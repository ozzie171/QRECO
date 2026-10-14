const ADMIN_USERNAME = 'admin';

const PUBLIC_PREFIXES = ['/profile/', '/assets/', '/eco-logo-beyaz.svg'];

function isPublicPath(pathname, method) {
  if (PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
    return true;
  }
  if (method === 'GET' && /^\/api\/users\/[^/]+$/.test(pathname)) {
    return true;
  }
  if (method === 'GET' && /^\/api\/users\/[^/]+\/vcard$/.test(pathname)) {
    return true;
  }
  return false;
}

export default function middleware(request) {
  const { pathname } = new URL(request.url);
  const method = request.method;

  if (isPublicPath(pathname, method)) {
    return;
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new Response('ADMIN_PASSWORD ortam değişkeni tanımlı değil.', { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  const expected = `Basic ${btoa(`${ADMIN_USERNAME}:${password}`)}`;

  if (authHeader === expected) {
    return;
  }

  return new Response('Yetkisiz erişim', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="QRECO Yönetim Paneli"' },
  });
}

export const config = {
  matcher: '/:path*',
};
