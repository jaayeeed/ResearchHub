import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RecommendationAPI, errorMessage } from '../api/client';
import ResearcherCard from '../components/ResearcherCard';
import { CardSkeleton, EmptyState, Skeleton } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import ScoreRing from '../components/ScoreRing';
import { ROLE_LABELS } from '../utils/format';

function CountUp({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900);
      setN(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return n;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    RecommendationAPI.overview()
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, []);
  const stats = data?.stats;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const steps = [
    { done: !!user.avatarUrl, label: 'Add a profile picture', to: '/profile/edit' },
    { done: !!user.bio && !!user.headline, label: 'Write a headline and bio', to: '/profile/edit' },
    { done: !!user.institution && !!user.department, label: 'Add your institution & department', to: '/profile/edit' },
    { done: user.education.length > 0, label: 'Add your education', to: '/profile/edit' },
    { done: user.researchDomains.length > 0, label: 'Choose your research domains', to: '/research-profile' },
    { done: user.skills.length >= 3, label: 'Add at least 3 skills', to: '/research-profile' },
    { done: user.interests.length >= 3, label: 'Add at least 3 interests', to: '/research-profile' },
  ];

  return (
    <div className="page">
      <section className="welcome card fade-up">
        <div className="welcome__id">
          <Avatar src={user.avatarUrl} name={user.name} size={72} ring />
          <div>
            <p className="eyebrow">{greeting}</p>
            <h1>{user.name}</h1>
            <p className="muted">
              {ROLE_LABELS[user.role]}
              {user.institution ? ` · ${user.institution}` : ''}
            </p>
          </div>
        </div>
        <div className="welcome__actions">
          <Link to="/discover" className="btn btn--secondary"><Icon name="search" size={17} /> Find researchers</Link>
          <Link to="/recommendations" className="btn btn--primary"><Icon name="sparkles" size={17} /> See matches</Link>
        </div>
      </section>

      {error && <div className="alert alert--error"><Icon name="alert" size={16} /> {error}</div>}

      <section className="stat-grid">
        {[
          { label: 'Researchers on platform', value: stats?.researchers, icon: 'users' },
          { label: 'Institutions', value: stats?.institutions, icon: 'building' },
          { label: 'Potential collaborators', value: stats?.matches, icon: 'sparkles' },
        ].map((s, i) => (
          <div key={s.label} className="card stat stagger-item" style={{ '--i': i }}>
            <span className="stat__icon"><Icon name={s.icon} size={20} /></span>
            <div>
              <strong>{s.value === undefined ? <Skeleton w={48} h={26} /> : <CountUp value={s.value} />}</strong>
              <span>{s.label}</span>
            </div>
          </div>
        ))}
        <div className="card stat stat--ring stagger-item" style={{ '--i': 3 }}>
          <ScoreRing value={user.profileCompleteness} size={58} stroke={6} tone="green" label="profile complete" />
          <div>
            <strong>Profile strength</strong>
            <span>{user.profileCompleteness === 100 ? 'Complete — great job!' : 'Complete it for better matches'}</span>
          </div>
        </div>
      </section>

      <div className="dash-grid">
        <section className="dash-grid__main">
          <div className="section-head">
            <div>
              <h2>Top matches for you</h2>
              <p className="muted">Ranked by shared domains, skills, interests and expertise.</p>
            </div>
            <Link to="/recommendations" className="link-arrow">View all <Icon name="arrow" size={16} /></Link>
          </div>
          {!data && !error ? (
            <div className="card-grid card-grid--2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : data?.topMatches?.length ? (
            <div className="card-grid card-grid--2">
              {data.topMatches.map((m, i) => (
                <ResearcherCard key={m.researcher.id} researcher={m.researcher} match={m} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="sparkles"
              title="No matches yet"
              action={<Link to="/research-profile" className="btn btn--primary">Add skills & interests</Link>}
            >
              Add your research domains, skills and interests so we can find people who work on similar topics.
            </EmptyState>
          )}
        </section>

        <aside className="card checklist fade-up" style={{ animationDelay: '200ms' }}>
          <h3>Get discovered</h3>
          <p className="muted">A complete profile appears higher in search and gets better recommendations.</p>
          <ul>
            {steps.map((s) => (
              <li key={s.label} className={s.done ? 'is-done' : ''}>
                <span className="checklist__box">{s.done && <Icon name="check" size={13} strokeWidth={3} />}</span>
                {s.done ? <span>{s.label}</span> : <Link to={s.to}>{s.label}</Link>}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
