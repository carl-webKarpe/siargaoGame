import { Link } from 'react-router-dom';
import CommunityDashboard from '../components/CommunityDashboard.jsx';

export default function CommunityPage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-navy to-[#0b1d2e] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">🌏 Siargao Community Progress</h1>
          <Link to="/" className="btn-ghost btn-sm">← Menu</Link>
        </div>
        <CommunityDashboard dark />
      </div>
    </div>
  );
}
