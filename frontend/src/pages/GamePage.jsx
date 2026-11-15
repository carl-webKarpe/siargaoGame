import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { isTouchDevice, useSettings } from '../contexts/SettingsContext.jsx';
import { useGame } from '../game/store.js';
import { attachKeyboard, resetInput } from '../game/input.js';
import { interactables } from '../game/registry.js';
import { loadLayout } from '../environments/index.js';
import { audio } from '../services/audio.js';
import { TIPS } from '../game/format.js';
import DestinationScene from '../scenes/DestinationScene.jsx';
import Loading from '../components/ui/Loading.jsx';
import PlayerCard from '../components/hud/PlayerCard.jsx';
import QuestTracker from '../components/hud/QuestTracker.jsx';
import Notifications from '../components/hud/Notifications.jsx';
import InteractPrompt from '../components/hud/InteractPrompt.jsx';
import Minimap from '../components/hud/Minimap.jsx';
import IslandProgress from '../components/hud/IslandProgress.jsx';
import ActionBar from '../components/hud/ActionBar.jsx';
import TouchControls from '../components/hud/TouchControls.jsx';
import GameModals from '../components/modals/GameModals.jsx';
import SurfHUD from '../activities/surfing/SurfHUD.jsx';
import KayakHUD from '../activities/kayak/KayakHUD.jsx';

export default function GamePage() {
  const { profile: authProfile, setProfile: setAuthProfile, loading } = useAuth();
  const { settings } = useSettings();
  const profile = useGame((s) => s.profile);
  const spotKey = useGame((s) => s.spotKey);
  const detail = useGame((s) => s.detail);
  const loadingSpot = useGame((s) => s.loadingSpot);
  const spotError = useGame((s) => s.spotError);
  const mode = useGame((s) => s.mode);
  const layout = useGame((s) => s.layout);
  const layoutFor = useGame((s) => s.layoutFor);
  const openModal = useGame((s) => s.openModal);
  const modal = useGame((s) => s.modal);
  const [layoutError, setLayoutError] = useState(null);
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], [spotKey]);

  // Bootstrap the store from the authenticated profile.
  useEffect(() => {
    if (!authProfile) return;
    const store = useGame.getState();
    useGame.setState({ profile: authProfile, onProfile: setAuthProfile });
    if (!store.spotKey) store.loadSpot(authProfile.currentSpot || 'cloud9');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!authProfile]);

  // Keyboard + audio
  useEffect(() => {
    const detach = attachKeyboard();
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    const onEsc = (e) => {
      if (e.key === 'Escape' && !useGame.getState().modal) useGame.getState().openModal('menu');
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      detach();
      resetInput();
      window.removeEventListener('keydown', onEsc);
    };
  }, []);

  // Release keys when a modal opens so the player does not keep walking.
  useEffect(() => {
    if (modal) resetInput();
  }, [modal]);

  // Lazy-load the destination layout.
  useEffect(() => {
    if (!detail) return;
    let cancelled = false;
    setLayoutError(null);
    interactables.clear();
    loadLayout(detail.spot.environment.theme || detail.spot.key)
      .then((l) => !cancelled && useGame.getState().setLayout(l, detail.spot.key))
      .catch((e) => !cancelled && setLayoutError(e.message));
    return () => {
      cancelled = true;
    };
  }, [detail?.spot.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Leave the game cleanly.
  useEffect(
    () => () => {
      useGame.setState({ spotKey: null, detail: null, layout: null, layoutFor: null, mode: 'explore', modal: null, prompt: null });
    },
    []
  );

  const look = useMemo(() => {
    const a = profile?.appearance || {};
    return { shirt: a.shirt || '#ffffff', hat: a.hat || null, skin: a.skin, hair: a.hair, shorts: '#1f3b5a' };
  }, [profile?.appearance]);

  if (!loading && !authProfile) return <Navigate to="/login" replace state={{ from: '/play' }} />;

  const showTouch = settings.touchControls === 'on' || (settings.touchControls === 'auto' && isTouchDevice());
  const sceneReady = !!(layout && detail && layoutFor === detail.spot.key);

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-navy">
      {sceneReady && <DestinationScene key={detail.spot.key} layout={layout} settings={settings} look={look} />}

      {!sceneReady || loadingSpot ? <Loading label={detail && !loadingSpot ? `Arriving at ${detail.spot.name}…` : 'Traveling…'} tip={tip} /> : null}
      {(spotError || layoutError) && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-navy/90 p-6 text-center">
          <div className="panel-light max-w-md p-6">
            <div className="text-4xl">⚠️</div>
            <p className="mt-2 font-bold">{spotError || layoutError}</p>
            <button className="btn-primary mt-4" onClick={() => useGame.getState().loadSpot(spotKey || 'cloud9')}>Try again</button>
          </div>
        </div>
      )}

      {sceneReady && (
        <>
          {mode === 'explore' && (
            <>
              <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-2 sm:left-4 sm:top-4">
                <div className="pointer-events-auto"><PlayerCard profile={profile} onClick={() => openModal('inventory')} /></div>
                <div className="pointer-events-auto hidden sm:block"><QuestTracker /></div>
              </div>
              <div className="pointer-events-none absolute right-2 top-2 z-10 flex flex-col items-end gap-2 sm:right-4 sm:top-4">
                <div className="pointer-events-auto flex items-center gap-2">
                  <div className="panel flex items-center gap-1.5 px-3 py-1.5 font-display text-lg font-bold">🪙 {profile?.coins ?? 0}</div>
                  <div className="panel hidden items-center gap-1.5 px-3 py-1.5 font-display text-lg font-bold sm:flex">🍃 {profile?.ecoPoints ?? 0}</div>
                  <button className="panel grid h-11 w-11 place-items-center text-xl hover:brightness-110" onClick={() => openModal('menu')} aria-label="Menu">⚙️</button>
                </div>
                {settings.showMinimap && <Minimap layout={layout} spotName={detail.spot.name} />}
              </div>
              <div className="pointer-events-auto absolute right-4 top-[300px] z-10 hidden lg:block">
                <IslandProgress onOpen={() => openModal('community')} />
              </div>
              <div className="absolute bottom-24 left-2 z-10 sm:bottom-6 sm:left-4">
                <Notifications />
              </div>
              <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
                <ActionBar canSurf={!!detail.spot.environment.surf} />
              </div>
              <button onClick={() => openModal('map')} className="panel absolute bottom-6 right-4 z-10 hidden w-56 overflow-hidden text-left hover:brightness-110 xl:block">
                <div className="bg-gradient-to-br from-ocean to-tropical p-3">
                  <div className="font-display text-lg font-bold leading-tight">Explore Siargao's Tourist Spots!</div>
                  <span className="mt-2 inline-block rounded-full bg-sunset px-3 py-1 text-sm font-bold text-navy">Go Explore →</span>
                </div>
              </button>
              <InteractPrompt />
            </>
          )}
          {mode === 'surf' && <SurfHUD layout={layout} />}
          {mode === 'kayak' && (
            <>
              <KayakHUD layout={layout} />
              <InteractPrompt />
              <div className="absolute bottom-24 left-2 z-10 sm:bottom-6 sm:left-4"><Notifications /></div>
            </>
          )}
          {showTouch && !modal && <TouchControls mode={mode} />}
        </>
      )}
      <GameModals />
    </div>
  );
}
