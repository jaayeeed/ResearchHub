import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RecommendationAPI, errorMessage } from '../api/client';
import Icon from '../components/Icon';
import ResearcherCard from '../components/ResearcherCard';
import { CardSkeleton, EmptyState, Pagination } from '../components/Feedback';
import { ROLE_OPTIONS } from '../utils/format';

const WEIGHT_LABELS = { researchDomains: 'Research domains', skills: 'Skills', interests: 'Interests', expertise: 'Expertise' };

export default function Recommendations() {
  const [role, setRole] = useState('');
  const [minScore, setMinScore] = useState(5);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    RecommendationAPI.list({ page, limit: 12, role: role || undefined, minScore })
      .then(setData)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, role, minScore]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <div className="page-head fade-up">
        <div>
          <p className="eyebrow">Recommendation system</p>
          <h1>Recommended collaborators</h1>
          <p className="muted">People whose research overlaps with yours, ranked by a weighted similarity score.</p>
        </div>
        <button type="button" className="btn btn--secondary" onClick={load} disabled={loading}>
          <Icon name="refresh" size={16} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {data?.weights && (
        <section className="card how-it-works fade-up">
          <div>
            <h3><Icon name="info" size={17} /> How matching works</h3>
            <p className="muted small">
              We compare your profile with every researcher who shares at least one topic. Each facet is scored for overlap
              (including partial matches like “Deep Learning” ↔ “Machine Learning”), then combined using these weights:
            </p>
          </div>
          <div className="weights">
            {Object.entries(data.weights).map(([k, w]) => (
              <div key={k} className="weights__item">
                <div className="weights__bar"><span style={{ '--w': `${w * 100}%` }} /></div>
                <span>{WEIGHT_LABELS[k]}</span>
                <strong>{Math.round(w * 100)}%</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="toolbar fade-up">
        <label>
          Role
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">Everyone</option>
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
        <label>
          Minimum match
          <select value={minScore} onChange={(e) => { setMinScore(Number(e.target.value)); setPage(1); }}>
            <option value={5}>Any (5%+)</option>
            <option value={25}>Good (25%+)</option>
            <option value={45}>Strong (45%+)</option>
            <option value={70}>Excellent (70%+)</option>
          </select>
        </label>
        {data && <span className="muted">{data.total} match{data.total === 1 ? '' : 'es'}</span>}
      </div>

      {error && <div className="alert alert--error"><Icon name="alert" size={16} /> {error}</div>}

      {loading && !data ? (
        <div className="card-grid">{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>
      ) : data && !data.hasProfileData ? (
        <EmptyState icon="flask" title="Tell us about your research first" action={<Link to="/research-profile" className="btn btn--primary">Add skills & interests</Link>}>
          Recommendations are based on your research domains, skills, interests and expertise. Add a few to get started.
        </EmptyState>
      ) : data && data.items.length ? (
        <>
          <div className={`card-grid ${loading ? 'is-loading' : ''}`}>
            {data.items.map((m, i) => <ResearcherCard key={m.researcher.id} researcher={m.researcher} match={m} index={i} />)}
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </>
      ) : (
        !error && (
          <EmptyState icon="sparkles" title="No matches at this level" action={<Link to="/research-profile" className="btn btn--secondary">Broaden your interests</Link>}>
            Try lowering the minimum match or adding more interests and skills.
          </EmptyState>
        )
      )}
    </div>
  );
}
