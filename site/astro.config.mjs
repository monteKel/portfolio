// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kelvecartaxo.dev',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    assets: 'assets',
    // CSP sem 'unsafe-inline': nenhum CSS embutido no HTML
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // CSP sem 'unsafe-inline': nenhum script/asset embutido no HTML
      assetsInlineLimit: 0,
      sourcemap: false,
    },
  },
});
