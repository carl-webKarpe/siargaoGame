import { useNavigate } from 'react-router-dom';
import { useGame } from '../../game/store.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Modal from '../ui/Modal.jsx';
import DialogueModal from './DialogueModal.jsx';
import InfoModal from './InfoModal.jsx';
import QuizModal from './QuizModal.jsx';
import MissionsModal from './MissionsModal.jsx';
import MapModal from './MapModal.jsx';
import InventoryModal from './InventoryModal.jsx';
import ShopModal from './ShopModal.jsx';
import SurfSetupModal from './SurfSetupModal.jsx';
import RewardModal from './RewardModal.jsx';
import CommunityDashboard from '../CommunityDashboard.jsx';
import SettingsPanel from '../SettingsPanel.jsx';
import Controls from '../Controls.jsx';

function PauseMenu({ onClose }) {
  const { openModal } = useGame.getState();
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <Modal title="Paused" icon="⏸" onClose={onClose}>
      <div className="grid gap-2">
        <button className="btn-primary" onClick={onClose} autoFocus>▶ Resume</button>
        <button className="btn-ocean" onClick={() => openModal('settings')}>⚙️ Settings</button>
        <button className="btn-ocean" onClick={() => openModal('controls')}>🎮 Controls</button>
        <button className="btn-green" onClick={() => navigate('/')}>🏝️ Main menu</button>
        <button
          className="btn border-2 border-red-300 text-red-600 hover:bg-red-50"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          Log out
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-navy/60">Your progress is saved automatically on the server.</p>
    </Modal>
  );
}

export default function GameModals() {
  const modal = useGame((s) => s.modal);
  const close = useGame((s) => s.closeModal);
  if (!modal) return null;
  const p = { ...modal.props, onClose: close };
  switch (modal.type) {
    case 'dialogue': return <DialogueModal {...p} />;
    case 'info': return <InfoModal {...p} />;
    case 'quiz': return <QuizModal {...p} />;
    case 'missions': return <MissionsModal {...p} />;
    case 'map': return <MapModal {...p} />;
    case 'inventory': return <InventoryModal {...p} />;
    case 'shop': return <ShopModal {...p} />;
    case 'surfSetup': return <SurfSetupModal {...p} />;
    case 'reward': return <RewardModal {...p} />;
    case 'community':
      return <Modal title="Community Progress" icon="👥" onClose={close} wide><CommunityDashboard /></Modal>;
    case 'settings':
      return <Modal title="Settings" icon="⚙️" onClose={close}><SettingsPanel /></Modal>;
    case 'controls':
      return <Modal title="Controls" icon="🎮" onClose={close}><Controls /></Modal>;
    case 'menu': return <PauseMenu {...p} />;
    default: return null;
  }
}
