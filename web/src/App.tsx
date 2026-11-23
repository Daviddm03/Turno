import { useLayoutEffect, useRef, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router';
import gsap from 'gsap';
import Login from './Login';
import TurnoLogo from './TurnoLogo';
import './App.css';
import { hasDemoSession } from './demoSession';
import Schedule from '../src/schedule';

const blockOffsets = [
  { x: 0, y: -28 },
  { x: -26, y: 8 },
  { x: 26, y: 8 },
];

function Opening({ onComplete }: { onComplete: () => void }) {
  const brandRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const brand = brandRef.current;

    if (!brand) return;

    const motion = gsap.matchMedia();

    motion.add(
      {
        animate: '(prefers-reduced-motion: no-preference)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        if (context.conditions?.reduce) {
          const timer = window.setTimeout(onComplete, 150);
          return () => window.clearTimeout(timer);
        }

        gsap.timeline()
          .from('.turno-logo__slot', {
            opacity: 0,
            duration: 0.28,
            stagger: 0.06,
          })
          .from(
            '.turno-logo__block',
            {
              x: (index: number) => blockOffsets[index].x,
              y: (index: number) => blockOffsets[index].y,
              scale: 0.82,
              opacity: 0,
              duration: 0.72,
              stagger: { each: 0.12, from: 'end' },
              ease: 'back.out(1.35)',
            },
            '-=0.08',
          )
          .from(
            '.turno-logo__name',
            {
              y: 12,
              opacity: 0,
              duration: 0.45,
              ease: 'power2.out',
            },
            '-=0.1',
          )
          .call(onComplete, [], '+=0.75');
      },
      brand,
    );

    return () => motion.revert();
  }, [onComplete]);

  return (
    <main className="turno-opening">
      <h1 className="turno-opening__brand" ref={brandRef}>
        <TurnoLogo opening />
      </h1>
    </main>
  );
}

function AppRoutes() {
  const { pathname } = useLocation();
  const [opening, setOpening] = useState(true);
  const signedIn = hasDemoSession();

  if (opening && (pathname === '/' || pathname === '/login')) {
    return <Opening onComplete={() => setOpening(false)} />;
  }

  const destination = signedIn ? '/escala' : '/login';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={destination} replace />} />

      <Route
        path="/login"
        element={signedIn ? <Navigate to="/escala" replace /> : <Login />}
      />

      <Route
        path="/escala"
        element={signedIn ? <Schedule /> : <Navigate to="/login" replace />}
      />

      <Route path="*" element={<Navigate to={destination} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}