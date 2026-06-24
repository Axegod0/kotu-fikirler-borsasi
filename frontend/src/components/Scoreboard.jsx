import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export default function Scoreboard() {
  const { state, actions } = useGame();
  const { gameOverData, isHost } = state;
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    // 5 saniye ceza ekranı göster, sonra liderlik tablosuna geç
    const t = setTimeout(() => {
      setShowLeaderboard(true);
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  if (!gameOverData) return null;

  const { finalScores, winner, penaltyPool, sharePerPlayer } = gameOverData;

  const formatMoney = (amount) => {
    return '$' + amount.toLocaleString('tr-TR');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-dark-900 overflow-y-auto p-4 md:p-8 relative">
      
      {!showLeaderboard ? (
        // Cimrilik Cezası Animasyon Ekranı
        <div className="flex-1 flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
          <div className="text-8xl mb-6 animate-bounce-subtle">🚨</div>
          <h1 className="font-display font-black text-5xl md:text-7xl text-neon-red mb-4 text-center text-shadow-neon">
            CİMRİLİK CEZASI
          </h1>
          <h2 className="text-2xl text-white mb-8 text-center">
            Piyasada nakit tutanlar bedelini ödedi!
          </h2>

          <div className="card w-full max-w-lg bg-dark-800 border-neon-red border-opacity-50">
            <div className="text-center mb-6">
              <p className="text-gray-400 font-mono text-sm uppercase mb-2 tracking-widest">
                El Konulan Toplam Nakit
              </p>
              <p className="font-display font-black text-5xl text-neon-red">
                {formatMoney(penaltyPool)}
              </p>
            </div>
            
            <div className="border-t border-dark-600 pt-6 text-center">
              <p className="text-gray-400 font-mono text-sm uppercase mb-2 tracking-widest">
                Herkese Dağıtılan Temettü
              </p>
              <p className="font-display font-black text-4xl text-neon-green">
                +{formatMoney(sharePerPlayer)}
              </p>
            </div>
          </div>
          <p className="mt-8 text-gray-500 text-sm font-mono animate-pulse">
            Liderlik tablosu hazırlanıyor...
          </p>
        </div>
      ) : (
        // Nihai Liderlik Tablosu
        <div className="w-full max-w-4xl mx-auto animate-[fadeIn_1s_ease-out]">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 badge-yellow mb-4 px-4 py-1.5 text-sm rounded-full">
              <span>🏆</span>
              <span className="font-mono">BÜYÜK FİNAL</span>
            </div>
            <h1 className="font-display font-black text-5xl md:text-6xl text-white">
              Borsa Kapandı
            </h1>
          </div>

          <div className="space-y-4">
            {finalScores.map((player, index) => {
              const isWinner = index === 0;
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-4 p-4 md:p-6 rounded-2xl transition-all"
                  style={{
                    background: isWinner ? 'rgba(255,204,0,0.1)' : '#12121a',
                    border: `1px solid ${isWinner ? 'rgba(255,204,0,0.5)' : '#2a2a42'}`,
                    boxShadow: isWinner ? '0 0 40px rgba(255,204,0,0.2)' : 'none',
                    transform: isWinner ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <div className="w-12 h-12 flex-shrink-0 rounded-full bg-dark-800 flex items-center justify-center font-display font-black text-2xl text-gray-500">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-2xl text-white truncate">
                      {player.name}
                    </h3>
                    {isWinner ? (
                      <p className="text-sm font-mono text-yellow-400 mt-1">
                        👑 Borsanın Kurdu
                      </p>
                    ) : (
                      <p className="text-sm font-mono text-gray-500 mt-1">
                        Küçük Yatırımcı
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-1">
                      Son Bütçe
                    </p>
                    <p
                      className="font-display font-black text-3xl md:text-4xl"
                      style={{ color: isWinner ? '#ffcc00' : '#00ff88' }}
                    >
                      {formatMoney(player.budget)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Host Aksiyonları */}
          {isHost && (
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm mb-4">
                Sadece odayı kuran kişi yeni bir oyun başlatabilir.
              </p>
              <button
                onClick={actions.playAgain}
                className="btn-primary btn-lg font-bold w-full md:w-auto"
                style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}
              >
                🔄 Yeniden Oyna
              </button>
            </div>
          )}
          
          {!isHost && (
            <div className="mt-12 text-center text-gray-500 font-mono">
              Odayı kuran kişinin yeni oyunu başlatması bekleniyor...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
