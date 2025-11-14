import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://infinitelogic.org',
  prefetch: {
    defaultStrategy: 'viewport',
    prefetchAll: true
  },
  integrations: [
    sitemap({}),
  ],
});
