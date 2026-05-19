export default function Avatar({ src, name, size = 'md' }) {
  const initials = name
    ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  if (src) {
    return <img src={src} alt={name} className={`avatar avatar-${size}`} />;
  }
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
}
