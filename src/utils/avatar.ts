/**
 * Generates an offline-safe SVG Data URI avatar with initials and gradient background.
 * Works 100% reliably in any browser/iframe without external network requests or CDN dependencies.
 */
export function getInitialsAvatar(name = 'Người dùng', role = 'TEACHER'): string {
  const cleanName = (name || 'Người dùng').trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  let initials = 'SC';
  if (words.length >= 2) {
    initials = (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 1) {
    initials = words[0].substring(0, 2).toUpperCase();
  }

  // Role-specific vivid cyberpunk gradient
  let c1 = '#06b6d4'; // cyan
  let c2 = '#2563eb'; // blue
  if (role === 'STUDENT') {
    c1 = '#8b5cf6'; // violet
    c2 = '#6366f1'; // indigo
  } else if (role === 'PARENT') {
    c1 = '#ec4899'; // pink
    c2 = '#a855f7'; // purple
  } else if (role === 'ADMIN') {
    c1 = '#3b82f6';
    c2 = '#1d4ed8';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g_${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="30" fill="url(#g_${initials})" />
    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
    <text x="50" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
