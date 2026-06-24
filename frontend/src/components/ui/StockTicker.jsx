// Borsa bandı — üstte kayan sahte ticker verileri
const TICKER_ITEMS = [
  { symbol: 'ÖFKL-TRST', change: '+240%', up: true },
  { symbol: 'VGN-BLNDR', change: '+18%', up: true },
  { symbol: 'KWN-DRNE', change: '-12%', up: false },
  { symbol: 'NFT-HALI', change: '+∞%', up: true },
  { symbol: 'MLD-BISIKLT', change: '+55%', up: true },
  { symbol: 'MNK-ŞMSYE', change: '-33%', up: false },
  { symbol: 'ZEN-FIRIN', change: '+7%', up: true },
  { symbol: 'KZM-KAŞIK', change: '+420%', up: true },
  { symbol: 'QUAN-TOST', change: '-8%', up: false },
  { symbol: 'ECO-DAVUL', change: '+99%', up: true },
  { symbol: 'AI-ÇRŞF', change: '+150%', up: true },
  { symbol: 'BLC-SCTR', change: '-67%', up: false },
];

export default function StockTicker() {
  // Bandı iki kez kopyala, sonsuz loop için
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="w-full bg-dark-850 border-b border-dark-600 py-1.5 overflow-hidden relative z-50">
      {/* Sol gradient fade */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-dark-850 to-transparent z-10 pointer-events-none" />
      {/* Sağ gradient fade */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-dark-850 to-transparent z-10 pointer-events-none" />

      <div className="ticker-track">
        {items.map((item, i) => (
          <span key={i} className="ticker-item">
            {/* Symbol */}
            <span className="font-mono text-xs text-gray-400 font-medium">{item.symbol}</span>

            {/* Change with arrow */}
            <span
              className={`font-mono text-xs font-bold flex items-center gap-0.5 ${
                item.up ? 'text-neon-green' : 'text-neon-red'
              }`}
            >
              {item.up ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {item.change}
            </span>

            {/* Separator */}
            <span className="text-dark-500 mx-1">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
