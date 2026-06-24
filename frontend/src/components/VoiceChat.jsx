import useWebRTC from '../hooks/useWebRTC';
import { useGame } from '../context/GameContext';

/**
 * VoiceChat — Oyun içi ses paneli
 *
 * Lobide "Aktif" seçilmişse render edilir.
 * Oyuncular mikrofon erişimi verip sesli kanala katılabilir.
 */
export default function VoiceChat() {
  const { state } = useGame();
  const voiceEnabled = state.settings.voiceOption === 'ingame';

  const {
    isVoiceActive,
    isMuted,
    peerStates,
    joinVoice,
    leaveVoice,
    toggleMute,
    connectedPeerCount,
  } = useWebRTC(voiceEnabled);

  if (!voiceEnabled) return null;

  const totalPeers = Object.keys(peerStates).length;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in-up">
      <div className="card border border-neon-blue/30 bg-dark-800/90 backdrop-blur-sm min-w-[200px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-neon-blue text-sm">🎙️</span>
            <span className="text-xs font-semibold text-gray-300">Oyun İçi Ses</span>
          </div>
          {isVoiceActive && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="text-neon-green text-xs font-mono">CANLI</span>
            </div>
          )}
        </div>

        {/* Peer indicators */}
        {isVoiceActive && totalPeers > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(peerStates).map(([peerId, peerState]) => {
              const player = state.players.find((p) => p.id === peerId);
              const name = player?.name ?? peerId.substring(0, 4);
              const color =
                peerState === 'connected'
                  ? 'border-neon-green/60 bg-neon-green/10'
                  : peerState === 'failed'
                  ? 'border-neon-red/60 bg-neon-red/10'
                  : 'border-neon-yellow/60 bg-neon-yellow/10';
              const dot =
                peerState === 'connected'
                  ? 'bg-neon-green'
                  : peerState === 'failed'
                  ? 'bg-neon-red'
                  : 'bg-neon-yellow animate-pulse';

              return (
                <div
                  key={peerId}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs ${color}`}
                  title={`${name} — ${peerState}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <span className="text-gray-300 truncate max-w-[70px]">{name}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Not connected yet */}
        {isVoiceActive && totalPeers === 0 && (
          <p className="text-xs text-gray-500 mb-3">
            Diğer oyuncuları bekliyoruz...
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {!isVoiceActive ? (
            <button
              id="join-voice-btn"
              onClick={joinVoice}
              className="btn-outline-green w-full text-xs py-2"
            >
              🎙️ Sese Katıl
            </button>
          ) : (
            <>
              {/* Mute toggle */}
              <button
                id="mute-toggle-btn"
                onClick={toggleMute}
                className={`flex-1 btn text-xs py-2 rounded-xl border transition-all duration-200 ${
                  isMuted
                    ? 'border-neon-red/60 bg-neon-red/10 text-neon-red'
                    : 'border-neon-green/60 bg-neon-green/10 text-neon-green'
                }`}
                title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
              >
                {isMuted ? '🔇 Sessiz' : '🎙️ Açık'}
              </button>

              {/* Leave voice */}
              <button
                id="leave-voice-btn"
                onClick={leaveVoice}
                className="btn-ghost text-xs py-2 px-3 rounded-xl"
                title="Ses kanalından çık"
              >
                ✕
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        {isVoiceActive && (
          <p className="text-center text-xs text-gray-600 mt-2 font-mono">
            {connectedPeerCount}/{totalPeers} bağlı
          </p>
        )}
      </div>
    </div>
  );
}
