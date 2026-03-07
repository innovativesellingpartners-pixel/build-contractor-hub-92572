import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

function generateSitemapPlugin(): Plugin {
  const urls = [
    { loc: "/", changefreq: "weekly", priority: "1.0" },
    { loc: "/pricing", changefreq: "weekly", priority: "0.9" },
    { loc: "/what-we-do", changefreq: "monthly", priority: "0.8" },
    { loc: "/business-suite", changefreq: "monthly", priority: "0.8" },
    { loc: "/nationwide-network", changefreq: "monthly", priority: "0.8" },
    { loc: "/platform", changefreq: "monthly", priority: "0.7" },
    { loc: "/for-consumers", changefreq: "monthly", priority: "0.7" },
    { loc: "/savings", changefreq: "monthly", priority: "0.7" },
    { loc: "/products/pocketbot", changefreq: "monthly", priority: "0.8" },
    { loc: "/products/voice-ai", changefreq: "monthly", priority: "0.8" },
    { loc: "/products/tier-launch", changefreq: "monthly", priority: "0.7" },
    { loc: "/products/tier-growth", changefreq: "monthly", priority: "0.7" },
    { loc: "/products/tier-market", changefreq: "monthly", priority: "0.7" },
    { loc: "/features/crm", changefreq: "monthly", priority: "0.8" },
    { loc: "/features/estimating", changefreq: "monthly", priority: "0.8" },
    { loc: "/features/jobs", changefreq: "monthly", priority: "0.8" },
    { loc: "/features/voice-ai", changefreq: "monthly", priority: "0.8" },
    { loc: "/features/training", changefreq: "monthly", priority: "0.7" },
    { loc: "/features/reporting", changefreq: "monthly", priority: "0.7" },
    { loc: "/about", changefreq: "monthly", priority: "0.6" },
    { loc: "/contact", changefreq: "monthly", priority: "0.7" },
    { loc: "/core-values", changefreq: "monthly", priority: "0.5" },
    { loc: "/trades-we-serve", changefreq: "monthly", priority: "0.7" },
    { loc: "/blog-podcast", changefreq: "weekly", priority: "0.6" },
    { loc: "/legal/privacy", changefreq: "yearly", priority: "0.3" },
    { loc: "/legal/terms", changefreq: "yearly", priority: "0.3" },
    { loc: "/auth", changefreq: "monthly", priority: "0.6" },
    { loc: "/trial-signup", changefreq: "monthly", priority: "0.8" },
    { loc: "/contractor-crm-software", changefreq: "monthly", priority: "0.8" },
    { loc: "/contractor-estimating-software", changefreq: "monthly", priority: "0.8" },
    { loc: "/ai-answering-service-for-contractors", changefreq: "monthly", priority: "0.8" },
  ];

  return {
    name: "generate-sitemap",
    writeBundle() {
      const today = new Date().toISOString().split("T")[0];
      const entries = urls
        .map(
          (u) => `  <url>
    <loc>https://myct1.com${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
        )
        .join("\n");
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
      fs.writeFileSync(path.resolve(__dirname, "dist/sitemap.xml"), xml);
    },
    configureServer(server) {
      server.middlewares.use("/sitemap.xml", (_req, res) => {
        const today = new Date().toISOString().split("T")[0];
        const entries = urls
          .map(
            (u) => `  <url>
    <loc>https://myct1.com${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
        res.setHeader("Content-Type", "application/xml");
        res.end(xml);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger(), generateSitemapPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
