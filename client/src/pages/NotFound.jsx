import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="fade-up">
        <p className="not-found__code">404</p>
        <h1>This page wandered off to a conference.</h1>
        <p className="muted">The page you’re looking for doesn’t exist or has moved.</p>
        <Link to="/" className="btn btn--primary"><Icon name="home" size={17} /> Go home</Link>
      </div>
    </div>
  );
}
