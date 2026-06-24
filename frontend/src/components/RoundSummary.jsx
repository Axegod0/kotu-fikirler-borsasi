import { useGame } from '../context/GameContext';
import Timer from './ui/Timer';

export default function RoundSummary() {
  const { state } = useGame();
  const { lastRoundResult, timerSeconds } = state;

  if (!lastRoundResult) return null;

  const { round, roundSummary, popularProductIds, playerResults } = lastRoundResult;

  // En popüler ürün(ler)
  const popularProducts = roundSummary.filter((p) => p.isPopular);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-dark-900 overflow-y-auto p-4 md:p-8">
      {/* Üst Kısım: Sayaç ve Başlık */}
      <div className="max-w-5xl mx-auto w-full mb-8 text-center animate-[fadeIn_0.4s_ease-out]">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-dark-600 bg-dark-800 mb-4">
          <Timer seconds={timerSeconds} totalSeconds={10} size={24} hideText />
          <span className="font-mono text-sm text-gray-300">
            Sonraki Tura Geçiliyor: {timerSeconds}
          </span>
        </div>
        <h1 className="font-display font-black text-4xl md:text-5xl text-white">
          Tur {round} Özeti
        </h1>
      </div>

      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sol: Şampiyon(lar) */}
        <div className="space-y-6">
          <h2 className="font-display font-bold text-2xl text-neon-green mb-4">
            🏆 Yatırım Şampiyonu
          </h2>
          {popularProducts.map((prod) => (
            <div
              key={prod.playerId}
              className="card relative overflow-hidden animate-[slideInUp_0.4s_ease-out]"
              style={{
                borderColor: 'rgba(0, 255, 136, 0.5)',
                boxShadow: '0 0 30px rgba(0, 255, 136, 0.15), inset 0 0 20px rgba(0, 255, 136, 0.05)',
              }}
            >
              {/* Parlayan Çerçeve Efekti (CSS) */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(45deg, transparent 40%, rgba(0,255,136,0.1) 50%, transparent 60%)',
                backgroundSize: '200% 200%',
                animation: 'scan-line 3s linear infinite'
              }} />

              {prod.imageData ? (
                <img
                  src={prod.imageData}
                  alt={prod.productName}
                  className="w-full h-48 object-cover rounded-lg mb-4 border border-dark-600"
                  style={{ imageRendering: 'pixelated' }}
                />
              ) : (
                <div className="w-full h-48 bg-dark-800 rounded-lg mb-4 border border-dark-600 flex items-center justify-center">
                  <span className="text-4xl opacity-50">🎨</span>
                </div>
              )}

              <p className="text-xs font-mono text-gray-500 uppercase mb-1">
                Üretici: {prod.playerName}
              </p>
              <h3 className="font-display font-bold text-xl text-white mb-2">
                {prod.productName}
              </h3>
              <p className="font-mono font-bold text-neon-green text-lg">
                Toplam Yatırım: ${prod.totalInvested.toLocaleString('tr-TR')}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                * Bu ürüne yatırım yapanlar x2 kâr elde etti!
              </p>
            </div>
          ))}

          {popularProducts.length === 0 && (
            <div className="card text-center py-12">
              <span className="text-4xl mb-4 block">🦗</span>
              <p className="text-gray-400 font-mono">Kimse yatırım yapmadı.</p>
            </div>
          )}
        </div>

        {/* Sağ: Oyuncu Bütçeleri (Borsa Tablosu) */}
        <div>
          <h2 className="font-display font-bold text-2xl text-white mb-4">
            📊 Borsa Sonuçları
          </h2>
          <div className="card overflow-hidden p-0 border border-dark-600">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-dark-800 border-b border-dark-600">
                    <th className="px-4 py-3 font-mono text-xs text-gray-400 uppercase tracking-widest">Oyuncu</th>
                    <th className="px-4 py-3 font-mono text-xs text-gray-400 uppercase tracking-widest text-right">Eski Bütçe</th>
                    <th className="px-4 py-3 font-mono text-xs text-gray-400 uppercase tracking-widest text-right">Fark</th>
                    <th className="px-4 py-3 font-mono text-xs text-white uppercase tracking-widest text-right">Yeni Bütçe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600">
                  {playerResults.map((pr) => {
                    const isProfit = pr.diff > 0;
                    const isLoss = pr.diff < 0;
                    const diffColor = isProfit ? '#00ff88' : isLoss ? '#ff3366' : '#6b7280';
                    const diffPrefix = isProfit ? '+' : '';

                    return (
                      <tr key={pr.id} className="transition-colors hover:bg-dark-800">
                        <td className="px-4 py-4 font-semibold text-white">
                          {pr.name}
                        </td>
                        <td className="px-4 py-4 font-mono text-sm text-gray-400 text-right">
                          ${pr.oldBudget.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-right" style={{ color: diffColor }}>
                          {diffPrefix}${pr.diff.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-4 py-4 font-mono font-black text-white text-right text-lg">
                          ${pr.newBudget.toLocaleString('tr-TR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
