import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import Timer from './ui/Timer';
import socket from '../socket';

export default function Presentation() {
  const { state, actions } = useGame();
  const {
    currentPresentation,
    timerSeconds,
    settings,
    myPlayer,
    players,
    round,
    lastInvestmentResult,
    phase,
  } = state;

  const [showResult, setShowResult] = useState(false);

  // Yatırım sonucu 2 saniye göster
  useEffect(() => {
    if (lastInvestmentResult) {
      setShowResult(true);
      const t = setTimeout(() => setShowResult(false), 2200);
      return () => clearTimeout(t);
    }
  }, [lastInvestmentResult]);

  const totalTime = settings?.presentTime || 30;

  if (!currentPresentation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4" style={{ animation: 'spin 1s linear infinite' }}>⏳</div>
          <p className="text-gray-400">Sunum hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  const { index, total, drawing } = currentPresentation;
  const isMyTurn    = drawing.playerId === myPlayer?.id;
  const isNoCanvas  = !drawing.imageData;
  const drawerName  = drawing.playerName;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-dark-900 relative">

      {/* Yatırım sonucu toast */}
      {showResult && lastInvestmentResult && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl border text-center"
          style={{
            background: 'rgba(18,18,26,0.95)',
            border: '1px solid rgba(0,255,136,0.4)',
            boxShadow: '0 0 30px rgba(0,255,136,0.2)',
            animation: 'slideInUp 0.3s ease-out',
          }}
        >
          <p className="font-mono text-xs text-gray-400 mb-0.5">Önceki Ürün</p>
          <p className="font-display font-bold text-white text-sm">
            {lastInvestmentResult.productName}
          </p>
          <p style={{ color: '#00ff88' }} className="font-mono text-lg font-bold">
            +${lastInvestmentResult.totalInvested.toLocaleString('tr-TR')} toplandı
          </p>
        </div>
      )}

      {/* Üst şerit */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b"
        style={{ background: '#12121a', borderColor: '#222235' }}
      >
        {/* Sol: İlerleme */}
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-xs px-2.5 py-1 rounded-full border"
            style={{
              color: '#ffcc00',
              borderColor: 'rgba(255,204,0,0.3)',
              background: 'rgba(255,204,0,0.08)',
            }}
          >
            TUR {round}/{settings?.totalRounds}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 20 : 8,
                  height: 8,
                  background: i < index
                    ? '#00ff88'
                    : i === index
                    ? '#00ccff'
                    : '#2a2a42',
                }}
              />
            ))}
          </div>
          <span className="text-gray-500 text-xs font-mono hidden sm:block">
            {index + 1}/{total} ürün
          </span>
        </div>

        {/* Sağ: Sayaç */}
        <Timer seconds={timerSeconds} totalSeconds={totalTime} size={64} warning={10} />
      </div>

      {/* Ana içerik */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

        {/* Çizim alanı */}
        <div
          className="flex-1 flex items-center justify-center p-4 lg:p-6 min-h-0"
          style={{ background: '#0a0a0f' }}
        >
          {isNoCanvas ? (
            <div
              className="w-full max-w-lg aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
              style={{ borderColor: '#2a2a42', background: '#12121a' }}
            >
              <span className="text-5xl">🎨</span>
              <p className="text-gray-500 text-sm">Çizim yüklenmedi</p>
            </div>
          ) : (
            <div
              className="relative max-w-xl w-full"
              style={{
                boxShadow: '0 0 0 3px #2a2a42, 0 8px 40px rgba(0,0,0,0.7)',
                borderRadius: 8,
              }}
            >
              {/* Üretici etiketi */}
              <div
                className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold z-10"
                style={{
                  background: '#12121a',
                  border: '1px solid rgba(0,204,255,0.4)',
                  color: '#00ccff',
                }}
              >
                🏭 Üretici: {drawerName}
              </div>
              <img
                src={drawing.imageData}
                alt={drawing.productName}
                className="w-full rounded-lg block"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          )}
        </div>

        {/* Sağ panel: Ürün bilgileri */}
        <div
          className="flex-shrink-0 lg:w-80 flex flex-col justify-center p-6 lg:p-8 border-t lg:border-t-0 lg:border-l"
          style={{ background: '#0e0e16', borderColor: '#1a1a28' }}
        >
          {/* Üretici (mobil) */}
          <div className="lg:hidden mb-4">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{
                background: 'rgba(0,204,255,0.1)',
                border: '1px solid rgba(0,204,255,0.3)',
                color: '#00ccff',
              }}
            >
              🏭 Üretici: {drawerName}
            </span>
          </div>

          {/* Kelime çifti (küçük) */}
          {drawing.wordPair && (
            <p className="text-xs font-mono text-gray-600 mb-3 uppercase tracking-widest">
              {drawing.wordPair.adjective} {drawing.wordPair.noun}
            </p>
          )}

          {/* Ürün adı */}
          <h1
            className="font-display font-black leading-tight mb-4"
            style={{
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              color: '#00ff88',
              textShadow: '0 0 20px rgba(0,255,136,0.4)',
            }}
          >
            {drawing.productName}
          </h1>

          {/* Slogan */}
          {drawing.slogan && (
            <div
              className="px-4 py-3 rounded-xl mb-6 italic text-sm leading-relaxed"
              style={{
                background: 'rgba(255,204,0,0.07)',
                border: '1px solid rgba(255,204,0,0.2)',
                color: '#d1d5db',
                borderLeft: '3px solid #ffcc00',
              }}
            >
              "{drawing.slogan}"
            </div>
          )}

          {/* Anlatımı Atla — SADECE çizen kişi görür */}
          {isMyTurn && (
            <button
              id="skip-presentation-btn"
              onClick={actions.skipPresentation}
              className="btn-danger w-full mb-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              Anlatımı Atla
            </button>
          )}

          {/* Diğer oyuncular için mesaj */}
          {!isMyTurn && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(42,42,66,0.5)',
                border: '1px solid #2a2a42',
                color: '#9ca3af',
              }}
            >
              <span className="text-base">🎤</span>
              <span>
                <span style={{ color: '#00ccff' }}>{drawerName}</span> ürününü tanıtıyor...
              </span>
            </div>
          )}

          {/* Oyuncu bütçeleri */}
          <div className="mt-6 space-y-2">
            <p className="text-xs font-mono text-gray-600 uppercase tracking-widest mb-2">
              Bütçeler
            </p>
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-xs text-gray-400 truncate max-w-[120px]">{p.name}</span>
                <span
                  className="font-mono text-xs font-semibold"
                  style={{ color: p.id === myPlayer?.id ? '#00ff88' : '#6b7280' }}
                >
                  ${p.budget.toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
