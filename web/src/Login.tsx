import { useState, type FormEvent } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { SiApple } from 'react-icons/si';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useNavigate } from 'react-router';
import { startDemoSession } from './demoSession';
import TurnoLogo from './TurnoLogo';
import teamIllustration from './assets/turno-team.png';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    if (!startDemoSession(email, password)) {
      setMessage('O e-mail ou a palavra-passe estão incorretos.');
      return;
    }

    setMessage('');
    navigate('/escala', { replace: true });
  }

  return (
    <main className="login-page">
      <section className="login-hero" aria-labelledby="welcome-title">
        <header className="login-hero__brand">
          <TurnoLogo />
        </header>

        <h1 id="welcome-title">
          A escala da equipa,
          <br />
          em um só lugar.
        </h1>

        <img
          className="login-hero__illustration"
          src={teamIllustration}
          alt=""
        />
      </section>

      <section className="login-sheet" aria-labelledby="login-title">
        <div className="login-sheet__content">
          <p className="login-sheet__welcome">Bem-vindo ao Turno</p>
          <h2 id="login-title">Entrar na conta</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Palavra-passe</label>

              <div className="login-password">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  aria-controls="password"
                  aria-label={
                    showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'
                  }
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? (
                    <FiEyeOff size={20} aria-hidden="true" />
                  ) : (
                    <FiEye size={20} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button className="login-submit" type="submit">
              Entrar
            </button>

            {message && (
              <p className="login-feedback" role="status">
                {message}
              </p>
            )}
          </form>

          <div className="login-social">
            <p className="login-social__divider">ou continuar com</p>

            <div
              className="login-social__buttons"
              aria-describedby="social-status"
            >
              <button type="button" disabled>
                <FcGoogle size={20} aria-hidden="true" />
                Google
              </button>

              <button type="button" disabled>
                <SiApple size={20} aria-hidden="true" />
                Apple
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}