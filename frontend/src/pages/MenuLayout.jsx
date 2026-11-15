import { Suspense, lazy } from 'react';
import { Outlet } from 'react-router-dom';

const MenuScene = lazy(() => import('../scenes/MenuScene.jsx'));

/** Persistent 3D background behind the main menu and account screens. */
export default function MenuLayout() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-navy">
      <div className="absolute inset-0">
        <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-b from-sunset via-sky to-ocean" />}>
          <MenuScene />
        </Suspense>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy/10 via-transparent to-navy/60" />
      <div className="scrollbar-thin absolute inset-0 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
