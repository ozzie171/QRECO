// Basic-auth gate for the admin panel and admin API. Public pages (employee
// profiles, signature pages) and the assets email signatures load are let
// through. Most static assets never reach this at all — see public/_routes.json.
const ADMIN_USERNAME = 'admin';

const PUBLIC_PREFIXES = [
  '/profile/',
  '/imza/',
  '/imzalar',
  '/assets/',
  '/eco-logo-beyaz.svg',
  '/eco-logo-kirmizi.svg',
  '/eco-logo-kirmizi.png',
  '/signature-icons/',
  '/favicon.svg',
];

function isPublicPath(pathname, method) {
  if (PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) return true;
  if (method !== 'GET') return false;
  return (
    /^\/api\/users\/[^/]+$/.test(pathname) ||
    /^\/api\/users\/[^/]+\/vcard$/.test(pathname) ||
    /^\/api\/users\/[^/]+\/qr-png$/.test(pathname) ||
    pathname === '/api/upload/signature-logo'
  );
}

export async function onRequest({ request, env, next }) {
  const { pathname } = new URL(request.url);
  if (isPublicPath(pathname, request.method)) return next();

  const password = env.ADMIN_PASSWORD;
  if (!password) {
    return new Response('ADMIN_PASSWORD ortam değişkeni tanımlı değil.', { status: 500 });
  }

  const expected = `Basic ${btoa(`${ADMIN_USERNAME}:${password}`)}`;
  if (request.headers.get('authorization') === expected) return next();

  return new Response('Yetkisiz erişim', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="QRECO Yonetim Paneli"' },
  });
}
