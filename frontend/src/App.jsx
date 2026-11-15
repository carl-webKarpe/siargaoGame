import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import MenuLayout from './pages/MenuLayout.jsx';
import MainMenu from './pages/MainMenu.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import Loading from './components/ui/Loading.jsx';

const GamePage = lazy(() => import('./pages/GamePage.jsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const CommunityPage = lazy(() => import('./pages/CommunityPage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<Loading label="Loading Siargao…" />}>
      <Routes>
        <Route element={<MenuLayout />}>
          <Route index element={<MainMenu />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="play" element={<GamePage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<MainMenu />} />
      </Routes>
    </Suspense>
  );
}
