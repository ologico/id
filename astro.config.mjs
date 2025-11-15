import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";

import db from "@astrojs/db";

export default defineConfig({
  site: "https://id.svc.h.infinitelogic.net",
  prefetch: {
    defaultStrategy: "viewport",
    prefetchAll: true
  },
  integrations: [sitemap({}), pagefind(), db()]
});
