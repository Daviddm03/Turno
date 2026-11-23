export default function TurnoLogo({ opening = false }: { opening?: boolean }) {
  return (
    <span className={`turno-logo${opening ? ' turno-logo--opening' : ''}`}>
      <span className="turno-logo__mark" aria-hidden="true">
        {[0, 1, 2].map((slot) => (
          <span className="turno-logo__slot" key={slot}>
            <span className="turno-logo__block" />
          </span>
        ))}
      </span>

      <span className="turno-logo__name">Turno</span>
    </span>
  );
}