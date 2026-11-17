# Security

Found a vulnerability? Email montekel.dev@gmail.com with steps to reproduce.
Please don't open a public issue for security problems.

## What this site does by design
- Static site, no cookies, no trackers, no third-party scripts, fonts or CDNs.
- Strict Content-Security-Policy (`script-src 'self'`, no `unsafe-inline`), set as HTTP header (`site/public/_headers`) and repeated in a `<meta>` tag.
- HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, `CORP`, anti-framing.
- Visitor input (terminal) is only ever rendered with `textContent`.
- The build fails if inline scripts/styles, inline event handlers or external resources appear (`site/scripts/verify-dist.mjs`).
- GSAP's ScrambleText writes through `innerHTML`: its character set has no `<`, `>` or `&`, and text containing them is never scrambled.
- `/.well-known/security.txt` (RFC 9116) is generated on every build.
