import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Title from '../components/Title.jsx';
import { ROLE_LABEL } from '../game/format.js';
import { audio } from '../services/audio.js';

export default function MainMenu() {
  const { profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const start = () => {
    audio.unlock();
    navigate(profile ? '/play' : '/login', { state: profile ? undefined : { from: '/play', message: 'Log in or create an account to start your island adventure.' } });
  };
  const item = 'btn w-full max-w-xs text-xl py-3';
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-10">
      <Title />
      {profile && (
        <div className="panel px-4 py-2 text-center text-sm font-semibold">
          Welcome back, <b>{profile.username}</b> · Lv. {profile.level} {ROLE_LABEL[profile.role]}
        </div>
      )}
      <nav className="flex w-full flex-col items-center gap-3" aria-label="Main menu">
        <button onClick={start} className={`${item} bg-sunset text-navy shadow-game hover:brightness-110`} autoFocus>
          ▶ Start Game
        </button>
        {!profile ? (
          <>
            <Link to="/login" className={`${item} bg-ocean text-white shadow-game hover:brightness-110`}>🔑 Login</Link>
            <Link to="/register" className={`${item} bg-tropical text-white shadow-game hover:brightness-110`}>🌴 Create Account</Link>
          </>
        ) : (
          <>
            <Link to="/community" className={`${item} bg-tropical text-white shadow-game hover:brightness-110`}>👥 Community Progress</Link>
            {isAdmin && <Link to="/admin" className={`${item} bg-navy text-white shadow-game hover:brightness-110`}>🛡️ Admin Dashboard</Link>}
          </>
        )}
        <Link to="/about" className={`${item} border border-white/30 bg-navy/70 text-white backdrop-blur hover:bg-navy/90`}>📖 About the Game</Link>
        <Link to="/settings" className={`${item} border border-white/30 bg-navy/70 text-white backdrop-blur hover:bg-navy/90`}>⚙️ Settings</Link>
        {profile && (
          <button onClick={logout} className="text-sm font-bold text-white/80 underline hover:text-white">
            Log out
          </button>
        )}
      </nav>
      <p className="max-w-lg text-center text-sm font-semibold text-white drop-shadow">
        Siargao is everyone's responsibility. Keep our tourist destinations clean, protect marine life and respect our communities.
      </p>
    </div>
  );
}
