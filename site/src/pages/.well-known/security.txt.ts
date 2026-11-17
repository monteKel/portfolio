// RFC 9116: onde reportar falhas de segurança. Expira 1 ano depois de cada build.
// Contato público (LinkedIn); trocar por email aqui se preferir.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().replace(/\.\d+Z$/, 'Z');
  const body = [
    'Contact: https://www.linkedin.com/in/kelvemcartaxo',
    `Expires: ${expires}`,
    'Preferred-Languages: en, pt, ja',
    `Canonical: ${new URL('/.well-known/security.txt', site).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
