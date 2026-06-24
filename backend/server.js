const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { adjectives, nouns } = require('./data/words');

// ─── WebRTC Signaling State ───────────────────────────────────────────────────
// voicePeers[roomId] = Set<socketId>  — odada sesi açık olan oyuncular
const voicePeers = {};

// ─── App Setup ───────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// ─── In-Memory Store ──────────────────────────────────────────────────────────
/**
 * rooms[roomId] = {
 *   id: string,
 *   host: socketId,
 *   players: [{ id, name, budget, score }],
 *   settings: { mode: 1|2, voiceOption: 'ingame'|'external', totalRounds: 5 },
 *   phase: 'lobby'|'word_pool'|'drawing'|'presentation'|'investment'|'round_end'|'game_over',
 *   round: number,
 *   wordPairs: [{ playerId, adjective, noun }],
 *   customWords: { adjectives: [], nouns: [] },  // Mod 1
 *   wordsSubmitted: Set<playerId>,
 *   drawings: [{ playerId, imageData, productName, slogan, wordPair }],
 *   currentPresentationIndex: number,
 *   investments: { [targetPlayerId]: { [investorId]: amount } },
 *   timerInterval: NodeJS.Interval | null,
 *   timerSeconds: number,
 * }
 */
const rooms = {};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getRoomPublicState(room) {
  return {
    id: room.id,
    host: room.host,
    players: room.players,
    settings: room.settings,
    phase: room.phase,
    round: room.round,
    currentPresentationIndex: room.currentPresentationIndex,
    timerSeconds: room.timerSeconds,
    wordsSubmittedCount: room.wordsSubmitted ? room.wordsSubmitted.size : 0,
  };
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clearTimer(room) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
}

function startTimer(room, seconds, onTick, onEnd) {
  clearTimer(room);
  room.timerSeconds = seconds;

  io.to(room.id).emit('timer_tick', { seconds: room.timerSeconds });

  room.timerInterval = setInterval(() => {
    room.timerSeconds -= 1;
    if (onTick) onTick(room.timerSeconds);
    io.to(room.id).emit('timer_tick', { seconds: room.timerSeconds });

    if (room.timerSeconds <= 0) {
      clearTimer(room);
      if (onEnd) onEnd();
    }
  }, 1000);
}

// ─── Game Flow Functions ──────────────────────────────────────────────────────

function assignWordPairs(room) {
  const pool =
    room.settings.mode === 1
      ? { adjectives: room.customWords.adjectives, nouns: room.customWords.nouns }
      : { adjectives, nouns };

  const adjPool = shuffleArray(pool.adjectives);
  const nounPool = shuffleArray(pool.nouns);

  room.wordPairs = room.players.map((player, i) => ({
    playerId: player.id,
    adjective: adjPool[i % adjPool.length],
    noun: nounPool[i % nounPool.length],
  }));
}

function startDrawingPhase(room) {
  room.phase = 'drawing';
  room.drawings = [];
  assignWordPairs(room);

  io.to(room.id).emit('game_phase_changed', {
    phase: 'drawing',
    state: getRoomPublicState(room),
  });

  // Her oyuncuya kendi kelime çiftini gönder
  room.wordPairs.forEach((pair) => {
    io.to(pair.playerId).emit('your_word_pair', {
      adjective: pair.adjective,
      noun: pair.noun,
    });
  });

  const drawTime = room.settings.drawTime || 75;
  startTimer(room, drawTime, null, () => {
    // Süre dolunca çizim göndermeyenlerin yerine boş kayıt ekle
    room.players.forEach((player) => {
      const alreadySubmitted = room.drawings.find((d) => d.playerId === player.id);
      if (!alreadySubmitted) {
        const pair = room.wordPairs.find((p) => p.playerId === player.id);
        room.drawings.push({
          playerId: player.id,
          playerName: player.name,
          imageData: null,
          productName: `${pair?.adjective} ${pair?.noun}`,
          slogan: '(Süre doldu)',
          wordPair: pair,
        });
      }
    });
    startPresentationPhase(room);
  });
}

function startPresentationPhase(room) {
  room.phase = 'presentation';
  room.currentPresentationIndex = 0;
  room.investments = {};

  // Her ürün için yatırım takipçisini hazırla
  room.drawings.forEach((d) => {
    room.investments[d.playerId] = {};
  });

  io.to(room.id).emit('game_phase_changed', {
    phase: 'presentation',
    state: getRoomPublicState(room),
  });

  presentNextProduct(room);
}

function presentNextProduct(room) {
  const drawing = room.drawings[room.currentPresentationIndex];
  if (!drawing) {
    endRound(room);
    return;
  }

  io.to(room.id).emit('present_product', {
    index: room.currentPresentationIndex,
    total: room.drawings.length,
    drawing: {
      playerId: drawing.playerId,
      playerName: drawing.playerName,
      productName: drawing.productName,
      slogan: drawing.slogan,
      imageData: drawing.imageData,
      wordPair: drawing.wordPair,
    },
  });

  const presentTime = room.settings.presentTime || 30;
  startTimer(room, presentTime, null, () => {
    startInvestmentPhase(room, drawing);
  });
}

function startInvestmentPhase(room, drawing) {
  room.phase = 'investment';
  clearTimer(room);

  io.to(room.id).emit('game_phase_changed', {
    phase: 'investment',
    state: getRoomPublicState(room),
    currentProduct: {
      playerId: drawing.playerId,
      playerName: drawing.playerName,
      productName: drawing.productName,
      slogan: drawing.slogan,
    },
  });

  const investTime = room.settings.investTime || 15;
  startTimer(room, investTime, null, () => {
    // Süre dolunca yatırım yapmayanlar 0 yatırım yapmış sayılır
    finalizeInvestments(room, drawing);
  });
}

function finalizeInvestments(room, drawing) {
  // Yatırım sonuçlarını hesapla
  const investmentsForProduct = room.investments[drawing.playerId] || {};
  const totalInvested = Object.values(investmentsForProduct).reduce((s, a) => s + a, 0);

  // Ürün sahibi kazancı
  const owner = room.players.find((p) => p.id === drawing.playerId);
  if (owner) owner.budget += totalInvested;

  io.to(room.id).emit('investment_result', {
    productPlayerId: drawing.playerId,
    productName: drawing.productName,
    productSlogan: drawing.slogan,
    imageData: drawing.imageData,
    investments: investmentsForProduct,
    totalInvested,
  });

  // Sonraki ürüne geç
  room.currentPresentationIndex += 1;

  setTimeout(() => {
    if (room.currentPresentationIndex < room.drawings.length) {
      room.phase = 'presentation';
      io.to(room.id).emit('game_phase_changed', {
        phase: 'presentation',
        state: getRoomPublicState(room),
      });
      presentNextProduct(room);
    } else {
      endRound(room);
    }
  }, 2000);
}

function endRound(room) {
  clearTimer(room);

  // Eski bütçeleri kaydet
  const oldBudgets = {};
  room.players.forEach((p) => {
    oldBudgets[p.id] = p.budget;
  });

  // Yatırımcı kazançlarını hesapla: En çok yatırım alan ürün = 2x
  const totalsByProduct = {};
  room.drawings.forEach((d) => {
    const invs = room.investments[d.playerId] || {};
    totalsByProduct[d.playerId] = Object.values(invs).reduce((s, a) => s + a, 0);
  });

  const maxTotal = Math.max(...Object.values(totalsByProduct), 0);
  const popularProductIds = Object.entries(totalsByProduct)
    .filter(([, total]) => total === maxTotal && maxTotal > 0)
    .map(([pid]) => pid);

  // Yatırımcı kazançları
  room.drawings.forEach((d) => {
    const invs = room.investments[d.playerId] || {};
    Object.entries(invs).forEach(([investorId, amount]) => {
      if (amount > 0) {
        const investor = room.players.find((p) => p.id === investorId);
        if (!investor) return;
        if (popularProductIds.includes(d.playerId)) {
          investor.budget += amount * 2; // 2x kazanç
        }
      }
    });
  });

  room.phase = 'round_summary';
  room.round += 1;

  const roundSummary = room.drawings.map((d) => {
    const invs = room.investments[d.playerId] || {};
    const total = Object.values(invs).reduce((s, a) => s + a, 0);
    return {
      playerId: d.playerId,
      playerName: d.playerName,
      productName: d.productName,
      imageData: d.imageData,
      totalInvested: total,
      isPopular: popularProductIds.includes(d.playerId),
    };
  });

  const playerResults = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    oldBudget: oldBudgets[p.id],
    newBudget: p.budget,
    diff: p.budget - oldBudgets[p.id],
  }));

  io.to(room.id).emit('round_result', {
    round: room.round - 1,
    roundSummary,
    popularProductIds,
    playerResults,
    players: room.players,
  });

  io.to(room.id).emit('game_phase_changed', {
    phase: 'round_summary',
    state: getRoomPublicState(room),
  });

  // 10 saniye sonra bir sonraki tura veya oyun sonuna geçiş
  startTimer(room, 10, null, () => {
    startNextRound(room);
  });
}

function startNextRound(room) {
  if (room.round > room.settings.totalRounds) {
    endGame(room);
    return;
  }
  startDrawingPhase(room);
}

function endGame(room) {
  clearTimer(room);

  // Cimrilik Cezası (Stinginess Penalty)
  // Herkesin elindeki paraya el koy ve eşit dağıt
  let totalPenalty = 0;
  room.players.forEach((p) => {
    totalPenalty += p.budget;
    p.budget = 0;
  });

  const share = Math.floor(totalPenalty / room.players.length);
  room.players.forEach((p) => {
    p.budget = share;
  });

  room.phase = 'game_over';
  const sorted = [...room.players].sort((a, b) => b.budget - a.budget);

  io.to(room.id).emit('game_phase_changed', { phase: 'game_over', state: getRoomPublicState(room) });
  io.to(room.id).emit('game_over', {
    finalScores: sorted,
    winner: sorted[0],
    penaltyPool: totalPenalty,
    sharePerPlayer: share
  });
}

// ─── Socket.io Event Handlers ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ── create_room ──────────────────────────────────────────────────────────
  socket.on('create_room', ({ playerName }) => {
    if (!playerName || playerName.trim().length < 1) {
      return socket.emit('error', { message: 'Oyuncu adı gerekli.' });
    }

    const roomId = uuidv4().substring(0, 6).toUpperCase();
    const player = { id: socket.id, name: playerName.trim(), budget: 50000, isHost: true };

    rooms[roomId] = {
      id: roomId,
      host: socket.id,
      players: [player],
      settings: {
        mode: 2,
        voiceOption: 'external',
        totalRounds: 5,
        drawTime: 90,
        presentTime: 30,
        investTime: 15,
      },
      phase: 'lobby',
      round: 1,
      wordPairs: [],
      customWords: { adjectives: [], nouns: [] },
      wordsSubmitted: new Set(),
      drawings: [],
      currentPresentationIndex: 0,
      investments: {},
      timerInterval: null,
      timerSeconds: 0,
    };

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerName = playerName.trim();

    socket.emit('room_created', { roomId, player });
    io.to(roomId).emit('room_updated', getRoomPublicState(rooms[roomId]));
    console.log(`[Room] Created: ${roomId} by ${playerName}`);
  });

  // ── join_room ────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomId, playerName }) => {
    const room = rooms[roomId];

    if (!room) return socket.emit('error', { message: 'Oda bulunamadı.' });
    if (room.phase !== 'lobby') return socket.emit('error', { message: 'Oyun zaten başladı.' });
    if (room.players.length >= 5) return socket.emit('error', { message: 'Oda dolu (max 5 kişi).' });
    if (!playerName || playerName.trim().length < 1)
      return socket.emit('error', { message: 'Oyuncu adı gerekli.' });

    const nameExists = room.players.find(
      (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
    );
    if (nameExists) return socket.emit('error', { message: 'Bu isim zaten kullanılıyor.' });

    const player = { id: socket.id, name: playerName.trim(), budget: 50000, isHost: false };
    room.players.push(player);

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerName = playerName.trim();

    socket.emit('room_joined', { roomId, player });
    io.to(roomId).emit('room_updated', getRoomPublicState(room));
    io.to(roomId).emit('player_joined', { player });
    console.log(`[Room] ${playerName} joined ${roomId}`);
  });

  // ── update_settings ──────────────────────────────────────────────────────
  socket.on('update_settings', ({ settings }) => {
    const room = rooms[socket.data.roomId];
    if (!room) return;
    if (room.host !== socket.id) return socket.emit('error', { message: 'Sadece host ayarları değiştirebilir.' });

    room.settings = { ...room.settings, ...settings };
    io.to(room.id).emit('room_updated', getRoomPublicState(room));
  });

  // ── start_game ───────────────────────────────────────────────────────────
  socket.on('start_game', () => {
    const room = rooms[socket.data.roomId];
    if (!room) return socket.emit('error', { message: 'Oda bulunamadı.' });
    if (room.host !== socket.id) return socket.emit('error', { message: 'Sadece host başlatabilir.' });
    if (room.players.length < 2) return socket.emit('error', { message: 'En az 2 oyuncu gerekli.' });
    if (room.phase !== 'lobby') return socket.emit('error', { message: 'Oyun zaten başladı.' });

    if (room.settings.mode === 1) {
      // Kelime toplama fazına geç
      room.phase = 'word_pool';
      room.wordsSubmitted = new Set();
      io.to(room.id).emit('game_phase_changed', {
        phase: 'word_pool',
        state: getRoomPublicState(room),
      });
    } else {
      startDrawingPhase(room);
    }
  });

  // ── submit_words (Mod 1) ─────────────────────────────────────────────────
  socket.on('submit_words', ({ adjectives: adjs, nouns: ns }) => {
    const room = rooms[socket.data.roomId];
    if (!room || room.phase !== 'word_pool') return;

    // Kelimeler havuza eklenir
    if (Array.isArray(adjs)) room.customWords.adjectives.push(...adjs.filter(Boolean));
    if (Array.isArray(ns)) room.customWords.nouns.push(...ns.filter(Boolean));
    room.wordsSubmitted.add(socket.id);

    io.to(room.id).emit('room_updated', getRoomPublicState(room));

    // Herkes gönderdi mi?
    if (room.wordsSubmitted.size >= room.players.length) {
      startDrawingPhase(room);
    }
  });

  // ── submit_drawing ───────────────────────────────────────────────────────
  socket.on('submit_drawing', ({ imageData, productName, slogan }) => {
    const room = rooms[socket.data.roomId];
    if (!room || room.phase !== 'drawing') return;

    const alreadySubmitted = room.drawings.find((d) => d.playerId === socket.id);
    if (alreadySubmitted) return;

    const wordPair = room.wordPairs.find((p) => p.playerId === socket.id);
    const player = room.players.find((p) => p.id === socket.id);

    room.drawings.push({
      playerId: socket.id,
      playerName: player?.name || 'Bilinmeyen',
      imageData,
      productName: productName?.trim() || `${wordPair?.adjective} ${wordPair?.noun}`,
      slogan: slogan?.trim() || '',
      wordPair,
    });

    socket.emit('drawing_submitted');
    io.to(room.id).emit('drawing_progress', {
      submitted: room.drawings.length,
      total: room.players.length,
    });

    // Herkes çizdi mi?
    if (room.drawings.length >= room.players.length) {
      clearTimer(room);
      startPresentationPhase(room);
    }
  });

  // ── skip_presentation ────────────────────────────────────────────────────
  socket.on('skip_presentation', () => {
    const room = rooms[socket.data.roomId];
    if (!room || room.phase !== 'presentation') return;

    const currentDrawing = room.drawings[room.currentPresentationIndex];
    if (!currentDrawing) return;
    if (currentDrawing.playerId !== socket.id) return; // sadece çizen atlayabilir

    clearTimer(room);
    startInvestmentPhase(room, currentDrawing);
  });

  // ── submit_investment ────────────────────────────────────────────────────
  socket.on('submit_investment', ({ targetPlayerId, amount }) => {
    const room = rooms[socket.data.roomId];
    if (!room || room.phase !== 'investment') return;

    const investor = room.players.find((p) => p.id === socket.id);
    if (!investor) return;
    if (socket.id === targetPlayerId) return; // Kendi ürününe yatırım yapamaz

    const currentDrawing = room.drawings[room.currentPresentationIndex];
    if (!currentDrawing || currentDrawing.playerId !== targetPlayerId) return;

    const safeAmount = Math.max(0, Math.min(amount, investor.budget));

    // Önceki yatırımı geri ver (değiştirme durumu)
    const prev = room.investments[targetPlayerId]?.[socket.id] || 0;
    if (prev > 0) investor.budget += prev;

    room.investments[targetPlayerId] = room.investments[targetPlayerId] || {};
    room.investments[targetPlayerId][socket.id] = safeAmount;
    investor.budget -= safeAmount;

    socket.emit('investment_confirmed', { amount: safeAmount, remaining: investor.budget });
    io.to(room.id).emit('room_updated', getRoomPublicState(room));
  });

  // ── next_round (host talebi) ─────────────────────────────────────────────
  socket.on('next_round', () => {
    const room = rooms[socket.data.roomId];
    if (!room) return;
    if (room.host !== socket.id) return;
    // We changed round_end to round_summary
    if (room.phase !== 'round_summary') return;

    startNextRound(room);
  });

  // ── play_again (host talebi) ─────────────────────────────────────────────
  socket.on('play_again', () => {
    const room = rooms[socket.data.roomId];
    if (!room) return;
    if (room.host !== socket.id) return;
    if (room.phase !== 'game_over') return;

    room.phase = 'lobby';
    room.round = 1;
    room.wordsSubmitted = new Set();
    room.customWords = { adjectives: [], nouns: [] };
    room.drawings = [];
    room.investments = {};
    clearTimer(room);

    // Bütçeleri sıfırlayalım
    room.players.forEach(p => p.budget = 50000);

    io.to(room.id).emit('game_phase_changed', {
      phase: 'lobby',
      state: getRoomPublicState(room)
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // ── WebRTC Signaling ──────────────────────────────────────────────────────
  // Mesh topoloji: her peer diğer herkesle bağlantı kurar (4-5 kişi için ideal)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * webrtc_join_voice
   * Bir oyuncu sesli kanala katılmak istediğinde gönderir.
   * Sunucu, odadaki mevcut ses peer'larının listesini geri döner.
   * Yeni peer, listede yer alan herkese offer göndermelidir.
   */
  socket.on('webrtc_join_voice', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    if (!voicePeers[roomId]) voicePeers[roomId] = new Set();

    // Mevcut peerlara yeni oyuncuyu bildir
    voicePeers[roomId].forEach((peerId) => {
      io.to(peerId).emit('webrtc_new_peer', { peerId: socket.id });
    });

    // Yeni oyuncuya mevcut peer listesini gönder
    socket.emit('webrtc_peers', { peers: [...voicePeers[roomId]] });

    voicePeers[roomId].add(socket.id);
    console.log(`[WebRTC] ${socket.id} joined voice in room ${roomId}. Peers: ${voicePeers[roomId].size}`);
  });

  /**
   * webrtc_offer
   * Bağlantı başlatan peer, hedef peer'a SDP offer iletir.
   * { to: socketId, offer: RTCSessionDescriptionInit }
   */
  socket.on('webrtc_offer', ({ to, offer }) => {
    if (!to || !offer) return;
    io.to(to).emit('webrtc_offer_for_you', { from: socket.id, offer });
    console.log(`[WebRTC] Offer relayed: ${socket.id} → ${to}`);
  });

  /**
   * webrtc_answer
   * Offer alan peer, SDP answer döner.
   * { to: socketId, answer: RTCSessionDescriptionInit }
   */
  socket.on('webrtc_answer', ({ to, answer }) => {
    if (!to || !answer) return;
    io.to(to).emit('webrtc_answer_for_you', { from: socket.id, answer });
    console.log(`[WebRTC] Answer relayed: ${socket.id} → ${to}`);
  });

  /**
   * webrtc_ice_candidate
   * ICE candidate'ları relay eder.
   * { to: socketId, candidate: RTCIceCandidateInit }
   */
  socket.on('webrtc_ice_candidate', ({ to, candidate }) => {
    if (!to || !candidate) return;
    io.to(to).emit('webrtc_ice_for_you', { from: socket.id, candidate });
  });

  /**
   * webrtc_leave_voice
   * Oyuncu ses kanalından ayrılır (manuel).
   */
  socket.on('webrtc_leave_voice', () => {
    const roomId = socket.data.roomId;
    if (!roomId || !voicePeers[roomId]) return;

    voicePeers[roomId].delete(socket.id);
    io.to(roomId).emit('webrtc_peer_left', { peerId: socket.id });
    console.log(`[WebRTC] ${socket.id} left voice in room ${roomId}`);
  });

  // ── disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    const roomId = socket.data.roomId;
    const room = rooms[roomId];

    // WebRTC: ses kanalından çıkar
    if (roomId && voicePeers[roomId]) {
      voicePeers[roomId].delete(socket.id);
      io.to(roomId).emit('webrtc_peer_left', { peerId: socket.id });
      if (voicePeers[roomId].size === 0) delete voicePeers[roomId];
    }

    if (!room) return;

    room.players = room.players.filter((p) => p.id !== socket.id);
    io.to(roomId).emit('player_left', { playerId: socket.id });

    if (room.players.length === 0) {
      clearTimer(room);
      delete rooms[roomId];
      console.log(`[Room] Deleted: ${roomId}`);
      return;
    }

    // Host ayrıldıysa, host yetkisini devret
    if (room.host === socket.id && room.players.length > 0) {
      room.host = room.players[0].id;
      room.players[0].isHost = true;
      io.to(roomId).emit('host_changed', { newHost: room.host });
    }

    io.to(roomId).emit('room_updated', getRoomPublicState(room));
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', rooms: Object.keys(rooms).length }));

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 Kötü Fikirler Borsası backend running on http://localhost:${PORT}`);
});
