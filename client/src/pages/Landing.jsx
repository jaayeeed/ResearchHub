import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import NetworkHero from '../components/NetworkHero';
import { Logo } from '../components/AppLayout';

const FEATURES = [
  { icon: 'user', title: 'Academic profile', text: 'Your institution, education, research links and a profile photo in one shareable page.' },
  { icon: 'flask', title: 'Skills & interests', text: 'Curate research domains, skills with proficiency levels, interests and expertise.' },
  { icon: 'search', title: 'Researcher discovery', text: 'Search people by domain, skill, interest, role or institution with instant filters.' },
  { icon: 'sparkles', title: 'Smart matching', text: 'Get collaborator suggestions ranked by how closely your research overlaps — with the reasons shown.' },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing__nav">
        <Logo light />
        <nav>
          <Link to="/login" className="btn btn--ghost-light">Log in</Link>
          <Link to="/register" className="btn btn--accent">Create account</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow fade-up">Research Collaboration Platform</p>
          <h1 className="fade-up" style={{ animationDelay: '80ms' }}>
            Find the people your research <em>has been missing.</em>
          </h1>
          <p className="hero__lead fade-up" style={{ animationDelay: '160ms' }}>
            ResearchHub connects students, thesis groups, researchers and supervisors through shared domains, skills and interests —
            so the right collaborator is a search away, not a coincidence.
          </p>
          <div className="hero__cta fade-up" style={{ animationDelay: '240ms' }}>
            <Link to="/register" className="btn btn--accent btn--lg">
              Build your research profile <Icon name="arrow" size={18} />
            </Link>
            <Link to="/login" className="btn btn--ghost-light btn--lg">I already have an account</Link>
          </div>
          <ul className="hero__trust fade-up" style={{ animationDelay: '320ms' }}>
            <li><Icon name="shield" size={16} /> Private by default</li>
            <li><Icon name="users" size={16} /> Students · Researchers · Professors</li>
          </ul>
        </div>
        <div className="hero__art">
          <NetworkHero />
        </div>
      </section>

      <section className="features">
        {FEATURES.map((f, i) => (
          <article key={f.title} className="feature stagger-item" style={{ '--i': i + 2 }}>
            <span className="feature__icon"><Icon name={f.icon} size={22} /></span>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </article>
        ))}
      </section>

      <footer className="landing__foot">
        <span>SE331 Capstone · Group 03 · Daffodil International University</span>
      </footer>
    </div>
  );
}
