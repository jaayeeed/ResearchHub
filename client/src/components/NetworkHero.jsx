/** Animated collaboration graph used on the landing & auth pages (decorative). */
const NODES = [
  { x: 80, y: 90, r: 9, c: 'amber', l: 'NLP' },
  { x: 230, y: 60, r: 7, c: 'blue', l: '' },
  { x: 330, y: 150, r: 12, c: 'white', l: 'Machine Learning' },
  { x: 170, y: 200, r: 8, c: 'blue', l: '' },
  { x: 60, y: 260, r: 7, c: 'white', l: '' },
  { x: 260, y: 290, r: 10, c: 'amber', l: 'Health Informatics' },
  { x: 400, y: 260, r: 7, c: 'blue', l: '' },
  { x: 420, y: 70, r: 8, c: 'white', l: 'Vision' },
  { x: 140, y: 340, r: 6, c: 'blue', l: '' },
];
const EDGES = [[0, 1], [0, 3], [1, 2], [2, 3], [2, 5], [2, 7], [3, 4], [3, 5], [5, 6], [6, 2], [4, 8], [8, 5], [1, 7]];

export default function NetworkHero({ className = '' }) {
  return (
    <svg className={`network ${className}`} viewBox="0 0 480 380" role="img" aria-label="Researchers connected by shared topics">
      <g className="network__edges">
        {EDGES.map(([a, b], i) => (
          <line
            key={`${a}-${b}`}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </g>
      {NODES.map((n, i) => (
        <g key={`${n.x}-${n.y}`} className="network__node" style={{ animationDelay: `${i * 0.4}s` }}>
          <circle className={`network__halo network__halo--${n.c}`} cx={n.x} cy={n.y} r={n.r * 2.4} />
          <circle className={`network__dot network__dot--${n.c}`} cx={n.x} cy={n.y} r={n.r} />
          {n.l && (
            <text x={n.x + n.r * 2.4 + 6} y={n.y + 4}>
              {n.l}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
