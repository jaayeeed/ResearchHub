import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import ScoreRing from '../components/ScoreRing';
import { ROLE_LABELS } from '../utils/format';


export default function Dashboard() {
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const steps = [
    { done: !!user.avatarUrl, label: 'Add a profile picture', to: '/profile/edit' },
    { done: !!user.bio && !!user.headline, label: 'Write a headline and bio', to: '/profile/edit' },
    { done: !!user.institution && !!user.department, label: 'Add your institution & department', to: '/profile/edit' },
    { done: user.education.length > 0, label: 'Add your education', to: '/profile/edit' },
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
          <Link to="/profile" className="btn btn--secondary"><Icon name="user" size={17} /> View profile</Link>
          <Link to="/profile/edit" className="btn btn--primary"><Icon name="edit" size={17} /> Edit profile</Link>
        </div>
      </section>


      <div className="dash-grid">
        <section className="card section fade-up profile-strength">
          <h2 className="section__title"><Icon name="target" size={18} /> Profile strength</h2>
          <div className="profile-strength__body">
            <ScoreRing value={user.profileCompleteness} size={110} stroke={9} tone="green" label="profile complete" />
            <div>
              <h3>{user.profileCompleteness === 100 ? 'Your profile is complete!' : `Your profile is ${user.profileCompleteness}% complete`}</h3>
              <p className="muted">
                A complete academic profile helps other students, researchers and supervisors understand your work
                and find you for collaboration.
              </p>
              <Link to="/profile/edit" className="link-arrow">Improve your profile <Icon name="arrow" size={16} /></Link>
            </div>
          </div>
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
