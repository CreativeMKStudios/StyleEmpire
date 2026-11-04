import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";

const site = process.env.SITE || "http://localhost:4321";

export default defineConfig({
  site,
  adapter: node({ mode: "standalone" }),
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/book/pay") &&
        !page.includes("/book/confirmed") &&
        !page.includes("/api/"),
    }),
  ],
  server: {
    host: true,
    port: 4321,
  },
  vite: {
    server: {
      allowedHosts: true,
    },
  },
});
