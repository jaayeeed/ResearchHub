import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { ROLE_LABELS, capitalize, formatDate, scoreLabel } from '../utils/format';

const LINKS = [
  { key: 'website', label: 'Website' },
  { key: 'googleScholar', label: 'Google Scholar' },
  { key: 'researchGate', label: 'ResearchGate' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
];
const LEVEL_PCT = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 };


/**
 * Researcher profile page.
 *  - /profile          -> your own profile (FR-01)
 *  - /researchers/:id  -> another researcher's public profile (FR-03)
 */
export default function ResearcherProfile({ self = false }) {
  const { user: me } = useAuth();

  const r = me;
  const match = null;
  const sharedSet = new Set(match ? Object.values(match.shared).flat().map((s) => s.toLowerCase()) : []);
  const isShared = (t) => sharedSet.has(t.toLowerCase());
  const links = LINKS.filter((l) => r.links?.[l.key]);

  return (
    <div className="page">
      <section className="card profile-hero fade-up">
        <div className="profile-hero__cover">
          <svg viewBox="0 0 800 160" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 120 C 150 60, 300 160, 460 90 S 700 40, 800 80 L800 0 L0 0Z" />
          </svg>
        </div>
        <div className="profile-hero__body">
          <Avatar src={r.avatarUrl} name={r.name} size={132} ring className="profile-hero__avatar" />
          <div className="profile-hero__main">
            <div className="profile-hero__title">
              <div>
                <h1>{r.name}</h1>
                {r.headline && <p className="profile-hero__headline">{r.headline}</p>}
                <ul className="meta-list">
                  <li><Icon name="graduation" size={15} /> {ROLE_LABELS[r.role]}{r.designation ? ` · ${r.designation}` : ''}</li>
                  {r.institution && <li><Icon name="building" size={15} /> {r.institution}{r.department ? `, ${r.department}` : ''}</li>}
                  {r.location && <li><Icon name="pin" size={15} /> {r.location}</li>}
                  {r.email && <li><Icon name="mail" size={15} /> <a href={`mailto:${r.email}`}>{r.email}</a></li>}
                </ul>
              </div>
              <div className="profile-hero__actions">
                {self && (
                  <>
                    <Link to="/profile/edit" className="btn btn--primary"><Icon name="edit" size={16} /> Edit profile</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <div className="profile-grid__main">
          <section className="card section fade-up" style={{ animationDelay: '80ms' }}>
            <h2 className="section__title"><Icon name="book" size={18} /> About</h2>
            {r.bio ? <p className="prose">{r.bio}</p> : <p className="muted">{self ? 'Add a short bio so others know what you work on.' : 'No bio yet.'}</p>}
          </section>


        </div>

        <aside className="profile-grid__side">

          <section className="card section fade-up" style={{ animationDelay: '120ms' }}>
            <h2 className="section__title"><Icon name="graduation" size={18} /> Education</h2>
            {r.education?.length ? (
              <ol className="timeline">
                {r.education.map((e) => (
                  <li key={e._id || `${e.degree}-${e.institution}`}>
                    <strong>{e.degree}{e.field ? `, ${e.field}` : ''}</strong>
                    <span>{e.institution}</span>
                    {(e.startYear || e.endYear) && <small>{e.startYear || '…'} – {e.endYear || 'Present'}</small>}
                  </li>
                ))}
              </ol>
            ) : <p className="muted">No education listed.</p>}
          </section>

          {(links.length > 0 || r.links?.orcid) && (
            <section className="card section fade-up" style={{ animationDelay: '180ms' }}>
              <h2 className="section__title"><Icon name="link" size={18} /> Links</h2>
              <ul className="link-list">
                {links.map((l) => (
                  <li key={l.key}>
                    <a href={r.links[l.key]} target="_blank" rel="noopener noreferrer"><Icon name="globe" size={15} /> {l.label}</a>
                  </li>
                ))}
                {r.links?.orcid && (
                  <li>
                    <a href={`https://orcid.org/${r.links.orcid}`} target="_blank" rel="noopener noreferrer"><Icon name="globe" size={15} /> ORCID {r.links.orcid}</a>
                  </li>
                )}
              </ul>
            </section>
          )}


          <p className="muted small">Member since {formatDate(r.createdAt)}</p>
        </aside>
      </div>
    </div>
  );
}
