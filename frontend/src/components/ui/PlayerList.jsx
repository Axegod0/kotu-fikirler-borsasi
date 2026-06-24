/**
 * PlayerList component
 * Shows all players with their budget, host crown, and connection status.
 *
 * Props:
 *   players  - array of player objects
 *   myId     - current user's socket ID
 *   hostId   - host's socket ID
 *   showBudget - boolean (default true)
 */
export default function PlayerList({ players = [], myId, hostId, showBudget = true }) {
  const formatBudget = (amount) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
      .format(amount)
      .replace('US$', '$');

  return (
    <div className="space-y-2">
      {players.map((player, idx) => {
        const isMe = player.id === myId;
        const isHost = player.id === hostId;

        return (
          <div
            key={player.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 animate-fade-in ${
              isMe
                ? 'bg-neon-green/10 border-neon-green/40'
                : 'bg-dark-700 border-dark-600'
            }`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Left: Avatar + name */}
            <div className="flex items-center gap-3">
              {/* Avatar circle */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  isMe ? 'bg-neon-green text-dark-900' : 'bg-dark-500 text-gray-300'
                }`}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold text-sm truncate ${isMe ? 'text-neon-green' : 'text-white'}`}>
                    {player.name}
                  </span>
                  {isMe && (
                    <span className="badge-green text-[10px] px-1.5 py-0 rounded-full">Sen</span>
                  )}
                  {isHost && (
                    <span title="Host" className="text-neon-yellow text-sm" role="img" aria-label="Host">
                      👑
                    </span>
                  )}
                </div>
                {showBudget && (
                  <span className="font-mono text-xs text-gray-500">
                    {formatBudget(player.budget ?? 50000)}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Connection indicator */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            </div>
          </div>
        );
      })}

      {/* Empty slots */}
      {Array.from({ length: Math.max(0, 5 - players.length) }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dark-600/40 border-dashed opacity-30"
        >
          <div className="w-9 h-9 rounded-full bg-dark-600/50 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-gray-600 text-sm">Bekleniyor...</span>
        </div>
      ))}
    </div>
  );
}
