export function Card({ children }) {
  const style = {
    borderRadius: 12,
  };
  return <div style={style}>{children}</div>;
}
