import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import Icon from './Icon';
import ScoreRing from './ScoreRing';
import { ROLE_LABELS, scoreLabel } from '../utils/format';

/**
 * Card used by search results (FR-03) and recommendations (FR-04).
 * Pass `match` ({ score, reasons, shared }) to show the recommendation details.
 */
export default function ResearcherCard({ researcher: r, match, index = 0, highlight = [] }) {
  const sharedSet = new Set(
    match ? Object.values(match.shared || {}).flat().map((s) => s.toLowerCase()) : highlight.map((h) => h.toLowerCase())
  );
  const tags = [...(r.researchDomains || []), ...(r.skills || []).map((s) => s.name), ...(r.interests || [])];
  const uniqueTags = [...new Map(tags.map((t) => [t.toLowerCase(), t])).values()];
  // shared tags first so the "why" is visible at a glance
  uniqueTags.sort((a, b) => Number(sharedSet.has(b.toLowerCase())) - Number(sharedSet.has(a.toLowerCase())));
  const visible = uniqueTags.slice(0, 6);

  return (
    <article className="card researcher-card stagger-item" style={{ '--i': index }}>
      <div className="researcher-card__head">
        <Avatar src={r.avatarUrl} name={r.name} size={56} />
        <div className="researcher-card__id">
          <h3>
            <Link to={`/researchers/${r.id}`} className="stretched-link">
              {r.name}
            </Link>
          </h3>
          <p className="muted">{r.headline || ROLE_LABELS[r.role]}</p>
          {r.institution && (
            <p className="researcher-card__inst">
              <Icon name="building" size={14} /> {r.institution}
            </p>
          )}
        </div>
        {match && (
          <div className="researcher-card__score" title={scoreLabel(match.score)}>
            <ScoreRing value={match.score} size={54} stroke={5} label="match" />
          </div>
        )}
      </div>

      {match && (
        <ul className="match-reasons">
          {match.reasons.slice(0, 3).map((reason) => (
            <li key={reason}>
              <Icon name="check" size={14} /> {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="tag-row">
        {visible.map((t) => (
          <span key={t} className={`tag ${sharedSet.has(t.toLowerCase()) ? 'tag--shared' : ''}`}>
            {t}
          </span>
        ))}
        {uniqueTags.length > visible.length && <span className="tag tag--more">+{uniqueTags.length - visible.length}</span>}
      </div>

      <div className="researcher-card__foot">
        <span className={`role-pill role-pill--${r.role}`}>{ROLE_LABELS[r.role]}</span>
        {r.openToCollaborate && (
          <span className="open-badge">
            <span className="pulse-dot" /> Open to collaborate
          </span>
        )}
      </div>
    </article>
  );
}
