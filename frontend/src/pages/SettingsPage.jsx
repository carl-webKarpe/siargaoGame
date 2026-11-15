import AuthCard from '../components/AuthCard.jsx';
import SettingsPanel from '../components/SettingsPanel.jsx';

export default function SettingsPage() {
  return (
    <AuthCard title="⚙️ Settings">
      <SettingsPanel />
    </AuthCard>
  );
}
