import { useState } from 'react';
import { useGame } from '../context/GameContext';
import socket from '../socket';

const EMPTY5 = () => ['', '', '', '', ''];

export default function WordPool() {
  const { state, actions } = useGame();
  const { players, wordsSubmittedCount } = state;

  const [adjectives, setAdjectives] = useState(EMPTY5);
  const [nouns, setNouns]           = useState(EMPTY5);
  const [submitted, setSubmitted]   = useState(false);

  const totalPlayers    = players.length;
  const waitingFor      = totalPlayers - wordsSubmittedCount;
  const validAdjs       = adjectives.filter((a) => a.trim().length > 0);
  const validNouns      = nouns.filter((n) => n.trim().length > 0);
  const canSubmit       = !submitted && validAdjs.length >= 3 && validNouns.length >= 3;

  const handleSubmit = () => {
    if (!canSubmit) return;
    actions.submitWords(validAdjs, validNouns);
    setSubmitted(true);
  };

  const updateAdj  = (i, val) => setAdjectives((prev) => prev.map((v, idx) => idx === i ? val : v));
  const updateNoun = (i, val) => setNouns((prev) => prev.map((v, idx) => idx === i ? val : v));

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 overflow-y-auto">
      {/* Başlık */}
      <div className="text-center mb-8 animate-[fadeIn_0.4s_ease-out]">
        <div className="inline-flex items-center gap-2 badge-green mb-3 px-4 py-1.5 text-sm rounded-full">
          <span>🎲</span>
          <span className="font-mono">KELIME HAVUZU MODU</span>
        </div>
        <h1 className="font-display font-black text-3xl md:text-4xl text-white mb-2">
          Komik Kelimelerini Gir
        </h1>
        <p className="text-gray-400 text-sm max-w-md">
          En az <span className="text-white font-semibold">3 sıfat</span> ve{' '}
          <span className="text-white font-semibold">3 isim</span> girilmeli.
          Havuz karıştırılarak herkese atanır.
        </p>
      </div>

      {!submitted ? (
        <div className="w-full max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sıfatlar */}
            <div className="card">
              <h2 className="font-display font-bold text-lg mb-1" style={{ color: '#00ff88' }}>
                🏷️ Sıfatlar
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Nesneyi tanımlayan kelimeler (Örn: Öfkeli, Çöpten Bulunmuş…)
              </p>
              <div className="space-y-2.5">
                {adjectives.map((val, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-600 w-4 flex-shrink-0">{i + 1}.</span>
                    <input
                      id={`adj-input-${i}`}
                      type="text"
                      className="input text-sm"
                      placeholder={`Sıfat ${i + 1}`}
                      maxLength={25}
                      value={val}
                      onChange={(e) => updateAdj(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const next = document.getElementById(`adj-input-${i + 1}`) ||
                                       document.getElementById(`noun-input-0`);
                          next?.focus();
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${(validAdjs.length / 5) * 100}%`,
                    background: validAdjs.length >= 3 ? '#00ff88' : '#ffcc00',
                    minWidth: 8,
                  }}
                />
                <span className="text-xs text-gray-500 font-mono">{validAdjs.length}/5</span>
              </div>
            </div>

            {/* İsimler */}
            <div className="card">
              <h2 className="font-display font-bold text-lg mb-1" style={{ color: '#00ccff' }}>
                📦 İsimler
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Ürünün ne olduğu (Örn: Tost Makinesi, Kamp Çadırı…)
              </p>
              <div className="space-y-2.5">
                {nouns.map((val, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-600 w-4 flex-shrink-0">{i + 1}.</span>
                    <input
                      id={`noun-input-${i}`}
                      type="text"
                      className="input text-sm"
                      placeholder={`İsim ${i + 1}`}
                      maxLength={25}
                      value={val}
                      onChange={(e) => updateNoun(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const next = document.getElementById(`noun-input-${i + 1}`);
                          next?.focus();
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${(validNouns.length / 5) * 100}%`,
                    background: validNouns.length >= 3 ? '#00ccff' : '#ffcc00',
                    minWidth: 8,
                  }}
                />
                <span className="text-xs text-gray-500 font-mono">{validNouns.length}/5</span>
              </div>
            </div>
          </div>

          {/* Gönder */}
          <div className="mt-6 flex flex-col items-center gap-3">
            {!canSubmit && (
              <p className="text-xs text-gray-500">
                {validAdjs.length < 3 ? `${3 - validAdjs.length} sıfat daha ekle` : ''}
                {validAdjs.length < 3 && validNouns.length < 3 ? ' · ' : ''}
                {validNouns.length < 3 ? `${3 - validNouns.length} isim daha ekle` : ''}
              </p>
            )}
            <button
              id="submit-words-btn"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="btn-primary btn-lg"
            >
              🚀 Kelime Havuzuna Gönder
            </button>
          </div>

          {/* Oyuncu durumu */}
          <div className="mt-6 card bg-dark-750 border-dark-600">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-mono">
              Gönderim Durumu
            </p>
            <div className="flex gap-2 flex-wrap">
              {players.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: i < wordsSubmittedCount
                      ? 'rgba(0,255,136,0.1)'
                      : 'rgba(42,42,66,0.6)',
                    border: `1px solid ${i < wordsSubmittedCount ? 'rgba(0,255,136,0.3)' : '#2a2a42'}`,
                    color: i < wordsSubmittedCount ? '#00ff88' : '#9ca3af',
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: i < wordsSubmittedCount ? '#00ff88' : '#4b5563' }}
                  />
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Gönderildi, bekleniyor */
        <div className="text-center animate-[slideInUp_0.4s_ease-out]">
          <div
            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl"
            style={{
              background: 'rgba(0,255,136,0.1)',
              border: '2px solid rgba(0,255,136,0.4)',
              boxShadow: '0 0 30px rgba(0,255,136,0.2)',
            }}
          >
            🎉
          </div>
          <h2 className="font-display font-black text-3xl text-white mb-2">
            Kelimeler Gönderildi!
          </h2>
          <p className="text-gray-400 mb-8">
            {waitingFor > 0
              ? `${waitingFor} oyuncu daha göndersin bekleniyor...`
              : 'Herkes gönderdi! Çizim başlıyor...'}
          </p>

          {/* İlerleme */}
          <div
            className="w-64 mx-auto rounded-full overflow-hidden"
            style={{ height: 6, background: '#1a1a28' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${totalPlayers > 0 ? (wordsSubmittedCount / totalPlayers) * 100 : 0}%`,
                background: 'linear-gradient(to right, #00ff88, #00ccff)',
              }}
            />
          </div>
          <p className="text-xs font-mono text-gray-500 mt-2">
            {wordsSubmittedCount}/{totalPlayers}
          </p>

          {/* Bekleyen oyuncular */}
          <div className="mt-6 flex gap-2 justify-center flex-wrap">
            {players.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: i < wordsSubmittedCount ? 'rgba(0,255,136,0.1)' : 'rgba(42,42,66,0.6)',
                  border: `1px solid ${i < wordsSubmittedCount ? 'rgba(0,255,136,0.3)' : '#2a2a42'}`,
                  color: i < wordsSubmittedCount ? '#00ff88' : '#9ca3af',
                }}
              >
                {i < wordsSubmittedCount ? '🟢' : '⏳'} {p.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
