import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import socket from '../socket';

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  // Connection
  connected: false,
  socketId: null,

  // Room
  roomId: null,
  phase: 'home',            // home | lobby | word_pool | drawing | presentation | investment | round_end | game_over
  players: [],
  settings: {
    mode: 2,
    voiceOption: 'external',
    totalRounds: 5,
    drawTime: 75,
    presentTime: 30,
    investTime: 15,
  },
  isHost: false,
  myPlayer: null,

  // Round / game
  round: 1,
  timerSeconds: 0,
  wordsSubmittedCount: 0,

  // Drawing phase
  myWordPair: null,          // { adjective, noun }
  drawingSubmitted: false,
  drawingProgress: { submitted: 0, total: 0 },

  // Presentation phase
  currentPresentation: null, // { playerId, playerName, productName, slogan, imageData, wordPair, index, total }

  // Investment phase
  currentProduct: null,      // { playerId, playerName, productName, slogan }
  myInvestment: 0,
  investmentConfirmed: false,

  // Results
  lastRoundResult: null,     // { round, roundSummary, popularProductIds, players }
  lastInvestmentResult: null,

  // Game over
  gameOverData: null,        // { finalScores, winner, penaltyPool, sharePerPlayer }

  // UI
  error: null,
  notification: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload, socketId: socket.id };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };

    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };

    case 'ROOM_CREATED':
    case 'ROOM_JOINED': {
      const { roomId, player } = action.payload;
      return {
        ...state,
        roomId,
        phase: 'lobby',
        myPlayer: player,
        isHost: player.isHost,
        error: null,
      };
    }

    case 'ROOM_UPDATED': {
      const roomState = action.payload;
      const myPlayer = roomState.players.find((p) => p.id === socket.id);
      return {
        ...state,
        players: roomState.players,
        settings: roomState.settings,
        isHost: roomState.host === socket.id,
        round: roomState.round,
        timerSeconds: roomState.timerSeconds,
        wordsSubmittedCount: roomState.wordsSubmittedCount,
        myPlayer: myPlayer || state.myPlayer,
      };
    }

    case 'PHASE_CHANGED': {
      const { phase, state: roomState, currentProduct } = action.payload;
      const myPlayer = roomState?.players?.find((p) => p.id === socket.id);
      return {
        ...state,
        phase,
        players: roomState?.players || state.players,
        settings: roomState?.settings || state.settings,
        round: roomState?.round || state.round,
        currentPresentationIndex: roomState?.currentPresentationIndex ?? state.currentPresentationIndex,
        myPlayer: myPlayer || state.myPlayer,
        isHost: roomState?.host === socket.id,
        // Reset per-phase state
        drawingSubmitted: phase === 'drawing' ? false : state.drawingSubmitted,
        myWordPair: phase === 'drawing' ? null : state.myWordPair,
        currentPresentation: phase === 'presentation' ? null : state.currentPresentation,
        currentProduct: currentProduct || (phase === 'investment' ? state.currentProduct : null),
        myInvestment: phase === 'investment' ? 0 : state.myInvestment,
        investmentConfirmed: phase === 'investment' ? false : state.investmentConfirmed,
        error: null,
      };
    }

    case 'SET_WORD_PAIR':
      return { ...state, myWordPair: action.payload };

    case 'DRAWING_SUBMITTED':
      return { ...state, drawingSubmitted: true };

    case 'DRAWING_PROGRESS':
      return { ...state, drawingProgress: action.payload };

    case 'PRESENT_PRODUCT':
      return { ...state, currentPresentation: action.payload };

    case 'INVESTMENT_RESULT':
      return { ...state, lastInvestmentResult: action.payload };

    case 'INVESTMENT_CONFIRMED':
      return {
        ...state,
        investmentConfirmed: true,
        myInvestment: action.payload.amount,
        myPlayer: state.myPlayer
          ? { ...state.myPlayer, budget: action.payload.remaining }
          : state.myPlayer,
      };

    case 'TIMER_TICK':
      return { ...state, timerSeconds: action.payload };

    case 'ROUND_RESULT':
      return { ...state, lastRoundResult: action.payload };

    case 'GAME_OVER':
      return { ...state, gameOverData: action.payload, phase: 'game_over' };

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'PLAYER_LEFT': {
      const { playerId } = action.payload;
      return {
        ...state,
        players: state.players.filter((p) => p.id !== playerId),
      };
    }

    case 'HOST_CHANGED':
      return { ...state, isHost: action.payload.newHost === socket.id };

    case 'RESET':
      return { ...initialState, connected: state.connected, socketId: state.socketId };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Socket event listeners ──────────────────────────────────────────────
  useEffect(() => {
    const onConnect = () => dispatch({ type: 'SET_CONNECTED', payload: true });
    const onDisconnect = () => dispatch({ type: 'SET_CONNECTED', payload: false });

    const onError = ({ message }) => {
      dispatch({ type: 'SET_ERROR', payload: message });
      setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 4000);
    };

    const onRoomCreated = (data) => dispatch({ type: 'ROOM_CREATED', payload: data });
    const onRoomJoined = (data) => dispatch({ type: 'ROOM_JOINED', payload: data });
    const onRoomUpdated = (data) => dispatch({ type: 'ROOM_UPDATED', payload: data });
    const onPhaseChanged = (data) => dispatch({ type: 'PHASE_CHANGED', payload: data });
    const onWordPair = (data) => dispatch({ type: 'SET_WORD_PAIR', payload: data });
    const onDrawingSubmitted = () => dispatch({ type: 'DRAWING_SUBMITTED' });
    const onDrawingProgress = (data) => dispatch({ type: 'DRAWING_PROGRESS', payload: data });
    const onPresentProduct = (data) => dispatch({ type: 'PRESENT_PRODUCT', payload: data });
    const onInvestmentResult = (data) => dispatch({ type: 'INVESTMENT_RESULT', payload: data });
    const onInvestmentConfirmed = (data) => dispatch({ type: 'INVESTMENT_CONFIRMED', payload: data });
    const onTimerTick = ({ seconds }) => dispatch({ type: 'TIMER_TICK', payload: seconds });
    const onRoundResult = (data) => dispatch({ type: 'ROUND_RESULT', payload: data });
    const onGameOver = (data) => dispatch({ type: 'GAME_OVER', payload: data });
    const onPlayerLeft = (data) => dispatch({ type: 'PLAYER_LEFT', payload: data });
    const onHostChanged = (data) => dispatch({ type: 'HOST_CHANGED', payload: data });

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('room_updated', onRoomUpdated);
    socket.on('game_phase_changed', onPhaseChanged);
    socket.on('your_word_pair', onWordPair);
    socket.on('drawing_submitted', onDrawingSubmitted);
    socket.on('drawing_progress', onDrawingProgress);
    socket.on('present_product', onPresentProduct);
    socket.on('investment_result', onInvestmentResult);
    socket.on('investment_confirmed', onInvestmentConfirmed);
    socket.on('timer_tick', onTimerTick);
    socket.on('round_result', onRoundResult);
    socket.on('game_over', onGameOver);
    socket.on('player_left', onPlayerLeft);
    socket.on('host_changed', onHostChanged);

    if (socket.connected) dispatch({ type: 'SET_CONNECTED', payload: true });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('room_updated', onRoomUpdated);
      socket.off('game_phase_changed', onPhaseChanged);
      socket.off('your_word_pair', onWordPair);
      socket.off('drawing_submitted', onDrawingSubmitted);
      socket.off('drawing_progress', onDrawingProgress);
      socket.off('present_product', onPresentProduct);
      socket.off('investment_result', onInvestmentResult);
      socket.off('investment_confirmed', onInvestmentConfirmed);
      socket.off('timer_tick', onTimerTick);
      socket.off('round_result', onRoundResult);
      socket.off('game_over', onGameOver);
      socket.off('player_left', onPlayerLeft);
      socket.off('host_changed', onHostChanged);
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────
  const actions = {
    createRoom: useCallback((playerName) => {
      socket.emit('create_room', { playerName });
    }, []),

    joinRoom: useCallback((roomId, playerName) => {
      socket.emit('join_room', { roomId: roomId.toUpperCase(), playerName });
    }, []),

    updateSettings: useCallback((settings) => {
      socket.emit('update_settings', { settings });
      dispatch({ type: 'SET_SETTINGS', payload: settings });
    }, []),

    startGame: useCallback(() => {
      socket.emit('start_game');
    }, []),

    submitWords: useCallback((adjectives, nouns) => {
      socket.emit('submit_words', { adjectives, nouns });
    }, []),

    submitDrawing: useCallback((imageData, productName, slogan) => {
      socket.emit('submit_drawing', { imageData, productName, slogan });
    }, []),

    skipPresentation: useCallback(() => {
      socket.emit('skip_presentation');
    }, []),

    submitInvestment: useCallback((targetPlayerId, amount) => {
      socket.emit('submit_investment', { targetPlayerId, amount });
    }, []),

    nextRound: useCallback(() => {
      socket.emit('next_round');
    }, []),

    playAgain: useCallback(() => {
      socket.emit('play_again');
    }, []),

    resetGame: useCallback(() => {
      dispatch({ type: 'RESET' });
    }, []),

    clearError: useCallback(() => {
      dispatch({ type: 'CLEAR_ERROR' });
    }, []),
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export default GameContext;
