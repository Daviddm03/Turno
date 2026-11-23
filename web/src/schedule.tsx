import { useNavigate } from 'react-router';
import { endDemoSession } from './demoSession';
import TurnoLogo from './TurnoLogo';

export default function Schedule() {
  const navigate = useNavigate();

  function handleSignOut() {
    endDemoSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="schedule-page">
      <header className="schedule-header">
        <TurnoLogo />

        <button type="button" onClick={handleSignOut}>
          Sair
        </button>
      </header>

      <main className="schedule-content">
        <h1>Escala semanal</h1>
      </main>
    </div>
  );
}