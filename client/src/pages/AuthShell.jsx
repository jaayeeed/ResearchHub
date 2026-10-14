import NetworkHero from '../components/NetworkHero';
import { Logo } from '../components/AppLayout';

/** Split-screen layout shared by the login & register pages. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth__art">
        <Logo light />
        <div className="auth__art-body">
          <NetworkHero />
          <blockquote>
            “Every strong thesis starts with the right people around the table.”
            <cite>Built for students, researchers & supervisors</cite>
          </blockquote>
        </div>
      </aside>
      <main className="auth__panel">
        <div className="auth__card fade-up">
          <div className="auth__mobile-logo"><Logo /></div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
          {footer && <div className="auth__footer">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
