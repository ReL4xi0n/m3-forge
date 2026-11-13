export function Card({ children }) {
  const style = {
    borderRadius: 14, // HIT
  };
  return <div style={style}>{children}</div>;
}
