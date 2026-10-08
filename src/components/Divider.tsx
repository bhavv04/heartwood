export default function Divider() {
  return (
    <div className="divider" role="separator" aria-hidden="true">
      <span className="divider-line divider-line-left" />
      <svg viewBox="0 0 24 24" className="divider-flower">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="12"
            cy="6.6"
            rx="2.5"
            ry="4.4"
            transform={`rotate(${deg} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="1.7" className="divider-center" />
      </svg>
      <span className="divider-line divider-line-right" />
    </div>
  );
}