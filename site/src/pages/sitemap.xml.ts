// sitemap com as três versões e os alternados de idioma (hreflang) de cada uma
import type { APIRoute } from 'astro';
import { LANGS } from '../data/content';

export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const alternates = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${url(l.path)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${url('/')}"/>`)
    .join('\n');
  const body = LANGS.map((l) => `  <url>\n    <loc>${url(l.path)}</loc>\n${alternates}\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
