import { useGame } from './context/GameContext';
import StockTicker from './components/ui/StockTicker';
import Lobby from './components/Lobby';
import Drawing from './components/Drawing';
import WordPool from './components/WordPool';
import Presentation from './components/Presentation';
import Investment from './components/Investment';
import RoundSummary from './components/RoundSummary';
import Scoreboard from './components/Scoreboard';
import VoiceChat from './components/VoiceChat';
import './index.css';

// Lazy placeholders for next phases (Faz 2'de doldurulacak)
function PlaceholderPhase({ name }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <div className="text-6xl animate-bounce-subtle">⚙️</div>
      <h2 className="font-display text-2xl font-bold text-white">{name}</h2>
      <p className="text-gray-400 text-sm">Bu aşama yakında geliyor...</p>
    </div>
  );
}

// ─── Phase Router ──────────────────────────────────────────────────────────────
function PhaseRouter() {
  const { state } = useGame();
  const { phase } = state;

  switch (phase) {
    case 'home':
    case 'lobby':
      return <Lobby />;
    case 'word_pool':
      return <WordPool />;
    case 'drawing':
      return <Drawing />;
    case 'presentation':
      return <Presentation />;
    case 'investment':
      return <Investment />;
    case 'round_summary':
      return <RoundSummary />;
    case 'game_over':
      return <Scoreboard />;
    default:
      return <Lobby />;
  }
}

// ─── Error Toast ───────────────────────────────────────────────────────────────
function ErrorToast() {
  const { state, actions } = useGame();
  if (!state.error) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-in-up"
      role="alert"
    >
      <div className="flex items-center gap-3 bg-dark-800 border border-neon-red/50 rounded-2xl px-5 py-3.5 shadow-neon-red">
        <span className="text-neon-red text-lg">⚠️</span>
        <span className="text-white text-sm font-medium">{state.error}</span>
        <button
          onClick={actions.clearError}
          className="text-gray-500 hover:text-white ml-2 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header() {
  const { state } = useGame();
  const { phase, round, settings, roomId, players, myPlayer } = state;

  const inGame = !['home', 'lobby'].includes(phase);

  const formatBudget = (amount) =>
    amount !== undefined
      ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
          .format(amount)
          .replace('US$', '$')
      : '$50.000';

  return (
    <header className="sticky top-0 z-40 glass border-b border-dark-600">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl">📈</span>
          <span className="font-display font-bold text-sm text-white hidden sm:block">
            KFB
          </span>
          {roomId && (
            <span className="font-mono text-xs text-neon-green/70 border border-neon-green/20 rounded px-1.5 py-0.5">
              {roomId}
            </span>
          )}
        </div>

        {/* Center: Phase indicator */}
        {inGame && (
          <div className="flex items-center gap-3">
            <span className="badge-yellow font-mono text-xs">
              TUR {round}/{settings.totalRounds}
            </span>
            <span className="text-gray-600 text-xs hidden sm:block">
              {phase === 'drawing' && '🎨 Çizim'}
              {phase === 'presentation' && '🎤 Sunum'}
              {phase === 'investment' && '💰 Yatırım'}
              {phase === 'round_end' && '📊 Tur Sonu'}
              {phase === 'word_pool' && '🎲 Kelimeler'}
            </span>
          </div>
        )}

        {/* Right: My budget */}
        {inGame && myPlayer && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-gray-500 text-xs hidden sm:block">Bütçen:</span>
            <span className="font-mono text-sm font-bold text-neon-green">
              {formatBudget(myPlayer.budget)}
            </span>
          </div>
        )}

        {/* Right: Player count in lobby */}
        {phase === 'lobby' && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="text-gray-400 text-xs font-mono">{players.length}/5</span>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { state } = useGame();
  
  // Çizim veya sunum aşamasında header gizlenir → tam ekran hissiyatı
  const hideHeader = state.phase === 'drawing' || state.phase === 'presentation';

  return (
    <div className="min-h-screen flex flex-col scanline-overlay">
      <StockTicker />
      {!hideHeader && <Header />}
      <main className="flex-1 flex flex-col min-h-0">
        <PhaseRouter />
      </main>
      <ErrorToast />
      <VoiceChat />
    </div>
  );
}
