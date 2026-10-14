import { useState } from 'react';
import { assetUrl } from '../api/client';
import { hueFromString, initials } from '../utils/format';

export default function Avatar({ src, name = '', size = 40, className = '', ring = false }) {
  const [failed, setFailed] = useState(false);
  const url = assetUrl(src);
  const hue = hueFromString(name);
  const style = {
    width: size,
    height: size,
    fontSize: Math.max(11, size * 0.38),
    '--av-bg': `hsl(${hue} 55% 90%)`,
    '--av-fg': `hsl(${hue} 45% 30%)`,
  };

  return (
    <span className={`avatar ${ring ? 'avatar--ring' : ''} ${className}`} style={style}>
      {url && !failed ? (
        <img src={url} alt={`${name} profile picture`} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span aria-label={name}>{initials(name) || '?'}</span>
      )}
    </span>
  );
}
