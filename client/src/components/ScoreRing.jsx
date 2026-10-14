import { useEffect, useState } from 'react';

/** Animated circular percentage (used for match score & profile completeness). */
export default function ScoreRing({ value = 0, size = 64, stroke = 6, label, tone = 'accent' }) {
  const [shown, setShown] = useState(0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.max(0, Math.min(100, value))));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div className={`score-ring score-ring--${tone}`} style={{ width: size, height: size }} role="img" aria-label={`${value}%${label ? ` ${label}` : ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="score-ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="score-ring__bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c - (shown / 100) * c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="score-ring__value" style={{ fontSize: size * 0.26 }}>
        {value}
        <small>%</small>
      </span>
    </div>
  );
}
