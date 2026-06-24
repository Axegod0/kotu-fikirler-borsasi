import { useState } from 'react';
import { useGame } from '../context/GameContext';
import PlayerList from './ui/PlayerList';
import socket from '../socket';

// ─── Sub-components ────────────────────────────────────────────────────────────

function HomeScreen() {
  const { actions, state } = useGame();
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    actions.createRoom(name.trim());
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim()) return;
    actions.joinRoom(roomCode.trim(), name.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10 animate-slide-in-up">
        <div className="inline-flex items-center gap-2 badge-green mb-4 text-sm px-4 py-1.5 rounded-full">
          <span>📈</span>
          <span className="font-mono">BORSA CANLI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight mb-3">
          <span className="text-white">Kötü </span>
          <span className="text-neon">Fikirler</span>
          <br />
          <span className="text-white">Borsası</span>
          <span className="text-neon-red ml-2">📉</span>
        </h1>

        <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
          Çiz. Sun. Yatırım yap. <br />
          <span className="text-neon-yellow font-semibold">En saçma fikir kazanır.</span>
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm animate-fade-in" style={{ animationDelay: '150ms' }}>
        <div className="card glow-border-green">
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-dark-700 rounded-xl mb-6">
            <button
              id="tab-create"
              onClick={() => setTab('create')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === 'create'
                  ? 'bg-neon-green text-dark-900 shadow-neon-green'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Oda Kur
            </button>
            <button
              id="tab-join"
              onClick={() => setTab('join')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === 'join'
                  ? 'bg-neon-green text-dark-900 shadow-neon-green'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Odaya Katıl
            </button>
          </div>

          {tab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Oyuncu Adın
                </label>
                <input
                  id="create-name-input"
                  type="text"
                  className="input"
                  placeholder="Ahmet Borsa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <button
                id="create-room-btn"
                type="submit"
                disabled={!name.trim() || !state.connected}
                className="btn-primary btn-lg w-full"
              >
                🚀 Odayı Kur
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Oyuncu Adın
                </label>
                <input
                  id="join-name-input"
                  type="text"
                  className="input"
                  placeholder="Mehmet Hisseli"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Oda Kodu
                </label>
                <input
                  id="join-code-input"
                  type="text"
                  className="input-lg uppercase tracking-[0.3em]"
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  autoComplete="off"
                />
              </div>
              <button
                id="join-room-btn"
                type="submit"
                disabled={!name.trim() || roomCode.trim().length < 6 || !state.connected}
                className="btn-primary btn-lg w-full"
              >
                📥 Odaya Gir
              </button>
            </form>
          )}

          {/* Connection status */}
          {!state.connected && (
            <p className="text-center text-neon-red text-xs mt-4 animate-pulse">
              ⚡ Sunucuya bağlanılıyor...
            </p>
          )}
        </div>

        {/* How to play mini */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🎨', label: 'Çiz' },
            { icon: '🎤', label: 'Sun' },
            { icon: '💰', label: 'Yatır' },
          ].map((item) => (
            <div key={item.label} className="card py-3 px-2 text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs text-gray-400 font-semibold">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LobbyRoom() {
  const { state, actions } = useGame();
  const { players, settings, isHost, roomId, round, myPlayer } = state;

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
  };

  const canStart = players.length >= 2;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto w-full px-4 py-8 animate-fade-in">
      {/* Left: Room info + players */}
      <div className="flex-1 space-y-5">
        {/* Room code card */}
        <div className="card text-center glow-border-green">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Oda Kodu</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-4xl font-black text-neon tracking-[0.3em]">
              {roomId}
            </span>
            <button
              id="copy-room-code-btn"
              onClick={copyCode}
              className="btn-ghost p-2 rounded-lg"
              title="Kopyala"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Arkadaşlarınla paylaş</p>
        </div>

        {/* Player list */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-white">
              Oyuncular
            </h2>
            <span className="badge-green font-mono text-xs">
              {players.length}/5
            </span>
          </div>
          <PlayerList
            players={players}
            myId={socket.id}
            hostId={state.players.find(p => p.isHost)?.id}
            showBudget={false}
          />
        </div>
      </div>

      {/* Right: Settings */}
      <div className="lg:w-80 space-y-5">
        <div className="card">
          <h2 className="font-display font-bold text-lg text-white mb-5">
            ⚙️ Oyun Ayarları
          </h2>

          {/* Game mode */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              Oyun Modu
            </label>
            <div className="space-y-2">
              {[
                {
                  value: 2,
                  title: '⚡ Hızlı Mod',
                  desc: 'Hazır kelime havuzundan çekilir',
                },
                {
                  value: 1,
                  title: '🎲 Kendi Havuzumuz',
                  desc: 'Herkes 5 sıfat + 5 isim girer',
                },
              ].map((m) => (
                <button
                  key={m.value}
                  id={`mode-${m.value}-btn`}
                  disabled={!isHost}
                  onClick={() => actions.updateSettings({ mode: m.value })}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                    settings.mode === m.value
                      ? 'border-neon-green/60 bg-neon-green/10'
                      : 'border-dark-500 hover:border-dark-400'
                  } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white">{m.title}</span>
                    {settings.mode === m.value && (
                      <div className="w-4 h-4 rounded-full bg-neon-green flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice option — Aktif / Pasif toggle */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              🎙️ Oyun İçi Ses
            </label>

            {/* Toggle pill */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-dark-500 bg-dark-700">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  {settings.voiceOption === 'ingame' ? '🟢 Aktif' : '⚫ Pasif'}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">
                  {settings.voiceOption === 'ingame'
                    ? 'WebRTC P2P ses — tarayıcı mikrofonu'
                    : 'Discord / Telefon gibi harici bir uygulama kullan'}
                </span>
              </div>

              {/* Switch */}
              <button
                id="voice-toggle-btn"
                disabled={!isHost}
                onClick={() =>
                  actions.updateSettings({
                    voiceOption: settings.voiceOption === 'ingame' ? 'external' : 'ingame',
                  })
                }
                className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
                  settings.voiceOption === 'ingame'
                    ? 'bg-neon-green shadow-neon-green'
                    : 'bg-dark-500'
                } ${!isHost ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                title={isHost ? 'Sesi aç/kapat' : 'Sadece host değiştirebilir'}
                aria-pressed={settings.voiceOption === 'ingame'}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                    settings.voiceOption === 'ingame' ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* WebRTC info banner */}
            {settings.voiceOption === 'ingame' && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/25 text-xs text-gray-400 leading-relaxed animate-fade-in">
                ℹ️ Oyun başladığında her oyuncu <span className="text-white">mikrofon iznini</span> vermelidir.
                Bağlantı <span className="text-white">tarayıcıdan tarayıcıya</span> doğrudan kurulur (P2P).
              </div>
            )}
          </div>

          {/* Round count */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              Tur Sayısı: <span className="text-neon-green font-mono">{settings.totalRounds}</span>
            </label>
            <input
              id="round-count-slider"
              type="range"
              min={3}
              max={7}
              step={1}
              value={settings.totalRounds}
              disabled={!isHost}
              onChange={(e) => actions.updateSettings({ totalRounds: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>3</span><span>5</span><span>7</span>
            </div>
          </div>

          {/* Divider */}
          <div className="divider" />

          {/* Start button */}
          {isHost ? (
            <button
              id="start-game-btn"
              disabled={!canStart}
              onClick={actions.startGame}
              className="btn-primary btn-lg w-full"
            >
              {canStart ? '🎮 Oyunu Başlat' : `👥 En az 2 oyuncu gerekli`}
            </button>
          ) : (
            <div className="text-center py-3">
              <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-2 h-2 rounded-full bg-neon-yellow animate-bounce-subtle" />
                <span>Host oyunu başlatmasını bekle...</span>
              </div>
            </div>
          )}
        </div>

        {/* Budget reminder */}
        <div className="card bg-dark-750 border-neon-yellow/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-xs font-semibold text-neon-yellow mb-1">Hatırlatma</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Her oyuncunun başlangıç bütçesi <span className="text-white font-semibold">$50.000</span>'dir.
                Para tutmak ceza, yatırım yapmak kazanç getirir!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Lobby component (routes between home and room lobby) ─────────────────
export default function Lobby() {
  const { state } = useGame();

  if (state.phase === 'home' || !state.roomId) {
    return <HomeScreen />;
  }

  return <LobbyRoom />;
}
