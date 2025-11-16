import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import cloudflare from "@astrojs/cloudflare";
import db from "@astrojs/db";

import react from "@astrojs/react";

export default defineConfig({
  site: "https://id.svc.h.infinitelogic.net",
  adapter: cloudflare(),
  prefetch: {
    defaultStrategy: "viewport",
    prefetchAll: true
  },
  integrations: [sitemap({}), pagefind(), db(), react()]
});
