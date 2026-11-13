export function Title({ text }) {
  return (
    <p className="title" style={{ fontSize: 'var(--md-sys-typescale-title-large-size)' }}>
      {text}
    </p>
  );
}
