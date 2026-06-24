import { useEffect, useRef, useState } from 'react';

/**
 * Animated circular countdown timer
 * Props:
 *   seconds      - current remaining seconds (controlled from outside)
 *   totalSeconds - initial total seconds (for arc calculation)
 *   size         - SVG size in px (default 120)
 *   warning      - seconds threshold to show red (default 10)
 */
export default function Timer({ seconds, totalSeconds, size = 120, warning = 10 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? Math.max(0, seconds / totalSeconds) : 0;
  const dashOffset = circumference * (1 - progress);

  const isWarning = seconds <= warning && seconds > 0;
  const isDanger = seconds <= 5 && seconds > 0;
  const isExpired = seconds <= 0;

  const color = isDanger ? '#ff3366' : isWarning ? '#ffcc00' : '#00ff88';
  const glowColor = isDanger
    ? 'drop-shadow(0 0 6px #ff3366)'
    : isWarning
    ? 'drop-shadow(0 0 6px #ffcc00)'
    : 'drop-shadow(0 0 6px #00ff88)';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className={isDanger ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''}
        style={{ filter: glowColor }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a1a28"
          strokeWidth={6}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="timer-ring"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-bold leading-none"
          style={{
            fontSize: size * 0.28,
            color,
            textShadow: `0 0 8px ${color}`,
          }}
        >
          {isExpired ? '0' : seconds}
        </span>
        <span className="text-gray-500 font-mono leading-none mt-0.5" style={{ fontSize: size * 0.1 }}>
          sn
        </span>
      </div>
    </div>
  );
}

/**
 * Simple horizontal bar timer (used in investment phase)
 */
export function TimerBar({ seconds, totalSeconds, warning = 5 }) {
  const progress = totalSeconds > 0 ? Math.max(0, (seconds / totalSeconds) * 100) : 0;
  const isDanger = seconds <= warning;
  const color = isDanger ? 'bg-neon-red' : 'bg-neon-green';
  const glowColor = isDanger ? 'shadow-neon-red' : 'shadow-neon-green';

  return (
    <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000 ease-linear`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
