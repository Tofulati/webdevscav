import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="box" />
        WebDevScav
      </Link>
      
      <div className="navbar-links">
        {location.pathname !== '/' && (
          <>
            <Link to="/play" className={isActive('/play') ? 'active' : ''}>
              PLAY
            </Link>
          </>
        )}
        <Link to="/leaderboard" className={isActive('/leaderboard') ? 'active' : ''}>
          LEADERBOARD
        </Link>
        <Link to="/instructions" className={isActive('/instructions') ? 'active' : ''}>
          HOW TO PLAY
        </Link>
        {location.pathname !== '/' && (
          <Link to="/play" className="btn btn-primary btn-small">
            LAUNCH CONSOLE
          </Link>
        )}
      </div>
    </nav>
  );
}
