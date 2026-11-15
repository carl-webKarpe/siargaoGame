import { Link } from 'react-router-dom';
import Title from './Title.jsx';

export default function AuthCard({ title, children, wide = false }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-8">
      <Link to="/" aria-label="Back to main menu"><Title small /></Link>
      <div className={`panel-light animate-floatUp w-full overflow-hidden ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
        <div className="bg-navy px-6 py-3 font-display text-2xl font-bold text-white">{title}</div>
        <div className="p-6">{children}</div>
      </div>
      <Link to="/" className="text-sm font-bold text-white underline drop-shadow">← Back to main menu</Link>
    </div>
  );
}
