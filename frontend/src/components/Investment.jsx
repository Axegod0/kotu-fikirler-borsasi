import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import Timer from './ui/Timer';

export default function Investment() {
  const { state, actions } = useGame();
  const { currentProduct, timerSeconds, settings, myPlayer } = state;

  const [amount, setAmount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Yeni ürüne geçildiğinde slider'ı sıfırla
  useEffect(() => {
    setAmount(0);
    setSubmitted(false);
  }, [currentProduct?.playerId]);

  if (!currentProduct || !myPlayer) return null;

  const totalTime = settings?.investTime || 15;
  const isMyProduct = myPlayer.id === currentProduct.playerId;
  const maxBudget = myPlayer.budget || 0;

  const handleInvest = () => {
    if (submitted || isMyProduct) return;
    actions.submitInvestment(currentProduct.playerId, amount);
    setSubmitted(true);
  };

  const handleSliderChange = (e) => {
    if (submitted) return;
    setAmount(Number(e.target.value));
  };

  const formatMoney = (val) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
      .format(val)
      .replace('US$', '$');

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-dark-900 overflow-hidden relative">
      
      {/* Üst şerit */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-dark-800 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <span className="badge-yellow font-mono text-xs hidden sm:inline-flex">
            💰 YATIRIM ZAMANI
          </span>
          <h2 className="font-display font-bold text-white text-lg">
            {currentProduct.productName}
          </h2>
        </div>
        <Timer seconds={timerSeconds} totalSeconds={totalTime} size={56} warning={5} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Sol: Ürün Önizleme */}
          <div className="flex flex-col items-center justify-center">
            {currentProduct.imageData ? (
              <img
                src={currentProduct.imageData}
                alt={currentProduct.productName}
                className="w-full max-w-sm rounded-xl border-4 border-dark-600 shadow-2xl"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="w-full max-w-sm aspect-video bg-dark-800 rounded-xl border-2 border-dashed border-dark-600 flex items-center justify-center">
                <span className="text-4xl opacity-50">🎨</span>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 font-mono mb-1">Üretici: {currentProduct.playerName}</p>
              <h3 className="font-display text-2xl font-black text-neon-green text-shadow-neon">
                {currentProduct.productName}
              </h3>
              {currentProduct.slogan && (
                <p className="text-gray-300 italic mt-2">"{currentProduct.slogan}"</p>
              )}
            </div>
          </div>

          {/* Sağ: Yatırım Paneli */}
          <div className="flex flex-col justify-center">
            <div className="card p-6 md:p-8 shadow-2xl relative overflow-hidden">
              
              {isMyProduct ? (
                // Kendi ürününe yatırım yapamaz
                <div className="text-center py-8">
                  <div className="text-6xl mb-6">🍿</div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    Kendi Ürünündesin
                  </h3>
                  <p className="text-gray-400">
                    Diğer oyuncuların sana ne kadar yatırım yapacağını izle!
                  </p>
                </div>
              ) : submitted ? (
                // Yatırım yapıldı
                <div className="text-center py-8 animate-[fadeIn_0.3s_ease-out]">
                  <div className="text-6xl mb-6">💸</div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    Yatırım Tamamlandı!
                  </h3>
                  <p className="text-neon-green font-mono text-xl">
                    {formatMoney(amount)} yatırıldı
                  </p>
                  <p className="text-gray-500 text-sm mt-4">
                    Süre dolduğunda sonuçlar açıklanacak...
                  </p>
                </div>
              ) : (
                // Yatırım Slider'ı
                <>
                  <div className="text-center mb-8">
                    <h3 className="text-gray-400 font-mono text-sm mb-2 uppercase tracking-widest">
                      Yatırım Miktarı
                    </h3>
                    <div 
                      className="font-display font-black text-5xl tracking-tight transition-colors duration-200"
                      style={{ color: amount > 0 ? '#00ff88' : '#fff' }}
                    >
                      {formatMoney(amount)}
                    </div>
                  </div>

                  <div className="mb-8 relative">
                    <input
                      type="range"
                      min="0"
                      max={maxBudget}
                      step="1000"
                      value={amount}
                      onChange={handleSliderChange}
                      className="w-full relative z-10"
                    />
                    
                    {/* Tick işaretleri (görsel destek) */}
                    <div className="flex justify-between px-2 mt-3 text-xs font-mono text-gray-500">
                      <span>$0</span>
                      <span>MAX {formatMoney(maxBudget)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleInvest}
                    className="btn-primary w-full h-14 text-lg"
                  >
                    <span>💰</span> Yatırımı Onayla
                  </button>

                  <p className="text-center text-xs text-gray-500 mt-4">
                    * En çok yatırım alan ürün <span className="text-neon-green">2x</span> kazandırır.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
