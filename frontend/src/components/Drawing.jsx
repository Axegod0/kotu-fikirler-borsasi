import { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import Timer from './ui/Timer';

// ─── Araç & Renk Sabitleri ─────────────────────────────────────────────────────
const COLORS = [
  { id: 'black',  label: 'Siyah',    hex: '#1a1a1a' },
  { id: 'red',    label: 'Kırmızı',  hex: '#e63946' },
  { id: 'blue',   label: 'Mavi',     hex: '#2b7fff' },
  { id: 'green',  label: 'Yeşil',    hex: '#2dc653' },
  { id: 'yellow', label: 'Sarı',     hex: '#f4d03f' },
  { id: 'orange', label: 'Turuncu',  hex: '#f77f00' },
];

const BRUSH_SIZES = [
  { id: 'xs', size: 3,  label: 'İnce' },
  { id: 'sm', size: 7,  label: 'Orta' },
  { id: 'md', size: 14, label: 'Kalın' },
  { id: 'lg', size: 26, label: 'Dev' },
];

// Tuval iç çözünürlüğü (her zaman sabit, CSS ile ölçeklenir)
const CANVAS_W = 900;
const CANVAS_H = 480;

// ─── Ana Bileşen ───────────────────────────────────────────────────────────────
export default function Drawing() {
  const { state, actions } = useGame();
  const { myWordPair, timerSeconds, settings, drawingSubmitted, drawingProgress } = state;

  // ── Canvas ref ve çizim state'i ──────────────────────────────────────────
  const canvasRef      = useRef(null);
  const containerRef   = useRef(null);
  const isDrawingRef   = useRef(false);
  const lastPosRef     = useRef({ x: 0, y: 0 });
  const toolStateRef   = useRef({ tool: 'brush', color: '#1a1a1a', size: 7 });

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTool,  setActiveTool]  = useState('brush');
  const [activeColor, setActiveColor] = useState('#1a1a1a');
  const [activeSize,  setActiveSize]  = useState(7);
  const [productName, setProductName] = useState('');
  const [slogan,      setSlogan]      = useState('');
  const [submitted,   setSubmitted]   = useState(false);
  const [autoSaved,   setAutoSaved]   = useState(false);

  const totalTime     = settings?.drawTime || 90;
  const isSubmitted   = submitted || drawingSubmitted;
  const wordPairText  = myWordPair
    ? `${myWordPair.adjective.toUpperCase()} ${myWordPair.noun.toUpperCase()}`
    : '…';

  // ── Canvas başlatma (beyaz arka plan) ─────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  // ── toolStateRef'i UI state ile senkronize tut ────────────────────────────
  useEffect(() => {
    toolStateRef.current = { tool: activeTool, color: activeColor, size: activeSize };
  }, [activeTool, activeColor, activeSize]);

  // ── Koordinat dönüşümü (CSS boyut → canvas iç boyut) ─────────────────────
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect   = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const src    = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  }, []);

  // ── Fırça / Silgi çizimi ──────────────────────────────────────────────────
  const paintDot = useCallback((ctx, x, y) => {
    const { tool, color, size } = toolStateRef.current;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.fill();
  }, []);

  const paintLine = useCallback((ctx, x0, y0, x1, y1) => {
    const { tool, color, size } = toolStateRef.current;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle  = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth    = size;
    ctx.lineCap      = 'round';
    ctx.lineJoin     = 'round';
    ctx.stroke();
  }, []);

  // ── Mouse / Touch event'leri ──────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (isSubmitted) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getCanvasPos(e);
    lastPosRef.current = pos;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) paintDot(ctx, pos.x, pos.y);
  }, [isSubmitted, getCanvasPos, paintDot]);

  const onPointerMove = useCallback((e) => {
    if (!isDrawingRef.current || isSubmitted) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) paintLine(ctx, lastPosRef.current.x, lastPosRef.current.y, pos.x, pos.y);
    lastPosRef.current = pos;
  }, [isSubmitted, getCanvasPos, paintLine]);

  const onPointerUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  // ── Tuvali temizle ────────────────────────────────────────────────────────
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  // ── Gönder ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (isSubmitted) return;
    const canvas    = canvasRef.current;
    const imageData = canvas ? canvas.toDataURL('image/png') : null;
    actions.submitDrawing(imageData, productName.trim(), slogan.trim());
    setSubmitted(true);
  }, [isSubmitted, productName, slogan, actions]);

  // ── Süre dolunca otomatik kaydet ──────────────────────────────────────────
  useEffect(() => {
    if (timerSeconds <= 0 && !isSubmitted && !autoSaved) {
      setAutoSaved(true);
      handleSubmit();
    }
  }, [timerSeconds, isSubmitted, autoSaved, handleSubmit]);

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-0 flex-1 bg-dark-900 relative overflow-hidden">

      {/* ── Üst başlık şeridi ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-dark-800 border-b border-dark-600">
        {/* Sol: Kelime çifti */}
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-0.5">
            Senin İcadın
          </span>
          <h1
            className="font-display font-black text-2xl md:text-3xl leading-tight tracking-tight"
            style={{ color: '#00ff88', textShadow: '0 0 16px #00ff8866' }}
          >
            {wordPairText}
          </h1>
        </div>

        {/* Sağ: Sayaç + ilerleme */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Çizim ilerlemesi */}
          <div className="hidden sm:flex flex-col items-center">
            <span className="text-xs text-gray-500 font-mono mb-1">
              {drawingProgress.submitted}/{drawingProgress.total || state.players.length} hazır
            </span>
            <div className="w-28 h-1.5 bg-dark-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-neon-green rounded-full transition-all duration-500"
                style={{
                  width: `${drawingProgress.total
                    ? (drawingProgress.submitted / drawingProgress.total) * 100
                    : 0}%`
                }}
              />
            </div>
          </div>
          {/* Dairesel sayaç */}
          <Timer seconds={timerSeconds} totalSeconds={totalTime} size={72} warning={20} />
        </div>
      </div>

      {/* ── Ana içerik: Araç çubuğu + Tuval ─────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Araç çubuğu (sol şerit, MS Paint ruhu) */}
        <div className="flex-shrink-0 w-14 bg-dark-800 border-r border-dark-600 flex flex-col items-center py-3 gap-2 overflow-y-auto">

          {/* Fırça */}
          <ToolBtn
            active={activeTool === 'brush'}
            title="Fırça"
            onClick={() => setActiveTool('brush')}
          >
            <BrushIcon />
          </ToolBtn>

          {/* Silgi */}
          <ToolBtn
            active={activeTool === 'eraser'}
            title="Silgi"
            onClick={() => setActiveTool('eraser')}
          >
            <EraserIcon />
          </ToolBtn>

          {/* Temizle */}
          <button
            title="Tümünü Temizle"
            onClick={clearCanvas}
            disabled={isSubmitted}
            className="w-10 h-10 rounded-lg bg-dark-600 hover:bg-neon-red/20 hover:border-neon-red/50
                       border border-dark-500 flex items-center justify-center
                       transition-all duration-150 active:scale-90 disabled:opacity-30"
          >
            <TrashIcon />
          </button>

          {/* Ayraç */}
          <div className="w-8 h-px bg-dark-500 my-1" />

          {/* Renk paleti */}
          {COLORS.map((c) => (
            <button
              key={c.id}
              title={c.label}
              onClick={() => { setActiveColor(c.hex); setActiveTool('brush'); }}
              className="w-8 h-8 rounded-lg border-2 transition-all duration-150 active:scale-90 flex-shrink-0"
              style={{
                background: c.hex,
                borderColor: activeColor === c.hex && activeTool === 'brush'
                  ? '#00ff88'
                  : 'transparent',
                boxShadow: activeColor === c.hex && activeTool === 'brush'
                  ? '0 0 8px rgba(0,255,136,0.6)'
                  : 'none',
              }}
            />
          ))}

          {/* Ayraç */}
          <div className="w-8 h-px bg-dark-500 my-1" />

          {/* Fırça kalınlığı */}
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.id}
              title={b.label}
              onClick={() => setActiveSize(b.size)}
              className="w-10 h-8 rounded-lg border transition-all duration-150 active:scale-90
                         flex items-center justify-center flex-shrink-0"
              style={{
                background: activeSize === b.size ? 'rgba(0,255,136,0.12)' : 'transparent',
                borderColor: activeSize === b.size ? '#00ff88' : '#2a2a42',
              }}
            >
              <div
                className="rounded-full bg-gray-300"
                style={{ width: Math.min(b.size, 22), height: Math.min(b.size, 22) }}
              />
            </button>
          ))}
        </div>

        {/* Tuval alanı */}
        <div
          ref={containerRef}
          className="flex-1 flex items-start justify-center bg-dark-900 p-3 overflow-auto"
        >
          <div
            className="relative"
            style={{
              boxShadow: '0 0 0 3px #2a2a42, 0 0 32px rgba(0,0,0,0.6)',
              borderRadius: 4,
            }}
          >
            {/* Durum overlay: Gönderildi */}
            {isSubmitted && (
              <div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded"
                style={{ background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(4px)' }}
              >
                <span className="text-5xl mb-3">🎨</span>
                <p className="font-display font-bold text-2xl text-neon-green mb-1">
                  Çizim Teslim Edildi!
                </p>
                <p className="text-gray-400 text-sm">Diğer oyuncular bekleniyor…</p>
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={onPointerUp}
              onTouchStart={onPointerDown}
              onTouchMove={onPointerMove}
              onTouchEnd={onPointerUp}
              style={{
                display: 'block',
                cursor: activeTool === 'eraser' ? 'cell' : 'crosshair',
                touchAction: 'none',
                maxWidth: '100%',
                background: '#ffffff',
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Alt panel: İsim + Slogan + Gönder ──────────────────────────── */}
      <div className="flex-shrink-0 bg-dark-800 border-t border-dark-600 px-4 py-3">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch gap-3">
          {/* Ürün adı */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Ürün Adı
            </label>
            <input
              id="product-name-input"
              type="text"
              className="input text-sm"
              placeholder="Örn: TurboTermos Pro Max"
              maxLength={40}
              value={productName}
              disabled={isSubmitted}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          {/* Slogan */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Slogan
            </label>
            <input
              id="slogan-input"
              type="text"
              className="input text-sm"
              placeholder="Örn: Çünkü sıradan termos olmaz!"
              maxLength={60}
              value={slogan}
              disabled={isSubmitted}
              onChange={(e) => setSlogan(e.target.value)}
            />
          </div>

          {/* Gönder butonu */}
          <div className="flex items-end">
            <button
              id="submit-drawing-btn"
              onClick={handleSubmit}
              disabled={isSubmitted || !productName.trim()}
              className="btn-primary btn-lg h-[46px] whitespace-nowrap"
            >
              {isSubmitted ? (
                <>
                  <span>🎨</span>
                  <span>Teslim Edildi</span>
                </>
              ) : (
                <>
                  <span>🏭</span>
                  <span>Üretimi Tamamla</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Aktif renk & araç göstergesi */}
        <div className="max-w-3xl mx-auto mt-2 flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-dark-400 flex-shrink-0"
            style={{ background: activeTool === 'eraser' ? '#ffffff' : activeColor }}
          />
          <span className="text-xs text-gray-600 font-mono">
            {activeTool === 'eraser' ? 'Silgi' : COLORS.find(c => c.hex === activeColor)?.label ?? 'Özel'}
            {' · '}
            {activeSize}px
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Alt Bileşenler (ikonlar ve tool button) ───────────────────────────────────
function ToolBtn({ active, title, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-10 h-10 rounded-lg border flex items-center justify-center
                 transition-all duration-150 active:scale-90 flex-shrink-0"
      style={{
        background:   active ? 'rgba(0,255,136,0.12)' : 'transparent',
        borderColor:  active ? '#00ff88' : '#2a2a42',
        boxShadow:    active ? '0 0 8px rgba(0,255,136,0.3)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

function BrushIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
      <path d="M9.06 11.9l8.07-8.07a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
      <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.48 1 3.5 1 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-2.5-2z"/>
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
      <path d="M22 21H7"/>
      <path d="m5 11 9 9"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  );
}
