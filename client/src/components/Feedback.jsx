import Icon from './Icon';

export function Spinner({ size = 18, light = false }) {
  return <span className={`spinner ${light ? 'spinner--light' : ''}`} style={{ width: size, height: size }} aria-hidden="true" />;
}

export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <div className="page-loader__orbit">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function Skeleton({ w = '100%', h = 14, r = 8, style }) {
  return <span className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function CardSkeleton() {
  return (
    <div className="card researcher-card">
      <div className="researcher-card__head">
        <Skeleton w={56} h={56} r={999} />
        <div style={{ flex: 1, display: 'grid', gap: 8 }}>
          <Skeleton w="60%" h={16} />
          <Skeleton w="85%" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 18 }}>
        <Skeleton w={90} h={24} r={999} />
        <Skeleton w={70} h={24} r={999} />
        <Skeleton w={110} h={24} r={999} />
      </div>
      <Skeleton w="100%" h={38} r={10} style={{ marginTop: 18 }} />
    </div>
  );
}

export function EmptyState({ icon = 'search', title, children, action }) {
  return (
    <div className="empty-state fade-up">
      <div className="empty-state__icon">
        <Icon name={icon} size={28} />
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const nums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i += 1) nums.push(i);
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <Icon name="arrow-left" size={16} /> Prev
      </button>
      {nums.map((n) => (
        <button
          type="button"
          key={n}
          className={`pagination__num ${n === page ? 'is-active' : ''}`}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </button>
      ))}
      <button type="button" className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next <Icon name="arrow" size={16} />
      </button>
    </nav>
  );
}
