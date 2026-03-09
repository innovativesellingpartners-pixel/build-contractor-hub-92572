import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

/**
 * Dynamic sitemap generation from data files.
 * Automatically includes trade pages, city+trade pages, blog posts, and feature pages.
 */
function generateSitemapPlugin(): Plugin {
  // Static pages
  const staticUrls = [
    { loc: "/", changefreq: "weekly", priority: "1.0" },
    { loc: "/pricing", changefreq: "weekly", priority: "0.9" },
    { loc: "/what-we-do", changefreq: "monthly", priority: "0.8" },
    { loc: "/business-suite", changefreq: "monthly", priority: "0.8" },
    { loc: "/nationwide-network", changefreq: "monthly", priority: "0.8" },
    { loc: "/platform", changefreq: "monthly", priority: "0.7" },
    { loc: "/for-consumers", changefreq: "monthly", priority: "0.7" },
    { loc: "/savings", changefreq: "monthly", priority: "0.7" },
    { loc: "/products/pocket-agent", changefreq: "monthly", priority: "0.8" },
    { loc: "/products/voice-ai", changefreq: "monthly", priority: "0.8" },
    { loc: "/products/tier-launch", changefreq: "monthly", priority: "0.7" },
    { loc: "/products/tier-growth", changefreq: "monthly", priority: "0.7" },
    { loc: "/products/tier-market", changefreq: "monthly", priority: "0.7" },
    { loc: "/about", changefreq: "monthly", priority: "0.6" },
    { loc: "/contact", changefreq: "monthly", priority: "0.7" },
    { loc: "/core-values", changefreq: "monthly", priority: "0.5" },
    { loc: "/trades-we-serve", changefreq: "monthly", priority: "0.7" },
    { loc: "/blog-podcast", changefreq: "weekly", priority: "0.6" },
    { loc: "/legal/privacy", changefreq: "yearly", priority: "0.3" },
    { loc: "/legal/terms", changefreq: "yearly", priority: "0.3" },
    { loc: "/trial-signup", changefreq: "monthly", priority: "0.8" },
    { loc: "/contractor-crm-software", changefreq: "monthly", priority: "0.8" },
    { loc: "/contractor-estimating-software", changefreq: "monthly", priority: "0.8" },
    { loc: "/ai-answering-service-for-contractors", changefreq: "monthly", priority: "0.8" },
    { loc: "/forge-ai-invoice-assistant", changefreq: "monthly", priority: "0.8" },
    { loc: "/contractor-business-resources", changefreq: "weekly", priority: "0.8" },
    { loc: "/trades", changefreq: "weekly", priority: "0.8" },
    { loc: "/cities", changefreq: "weekly", priority: "0.8" },
    { loc: "/features", changefreq: "weekly", priority: "0.8" },
    { loc: "/blog", changefreq: "weekly", priority: "0.8" },
    { loc: "/help", changefreq: "monthly", priority: "0.5" },
    { loc: "/support", changefreq: "monthly", priority: "0.5" },
    { loc: "/network-map", changefreq: "monthly", priority: "0.5" },
  ];

  function loadAllUrls(): Array<{ loc: string; changefreq: string; priority: string }> {
    const urls = [...staticUrls];

    try {
      // We can't import TS data files in Vite config directly at build time,
      // so we read the source files and extract slugs via regex.

      // Trade pages - extract slugs from tradeCrmPages.ts
      const tradesFile = fs.readFileSync(path.resolve(__dirname, "src/data/tradeCrmPages.ts"), "utf-8");
      const tradeSlugs: string[] = [];
      const tradeRegex = /slug:\s*"([^"]+)"/g;
      let match;
      while ((match = tradeRegex.exec(tradesFile)) !== null) {
        tradeSlugs.push(match[1]);
        urls.push({ loc: `/crm-for-${match[1]}`, changefreq: "monthly", priority: "0.7" });
      }

      // City pages - extract slugs from seoCities.ts
      const citiesFile = fs.readFileSync(path.resolve(__dirname, "src/data/seoCities.ts"), "utf-8");
      const citySlugs: string[] = [];
      const cityRegex = /slug:\s*"([^"]+)"/g;
      while ((match = cityRegex.exec(citiesFile)) !== null) {
        citySlugs.push(match[1]);
      }

      // City+Trade combinations
      for (const trade of tradeSlugs) {
        for (const city of citySlugs) {
          urls.push({ loc: `/crm-for-${trade}-in-${city}`, changefreq: "monthly", priority: "0.5" });
        }
      }

      // Blog posts - extract slugs from all blog data files
      const blogDir = path.resolve(__dirname, "src/data/blogPosts");
      if (fs.existsSync(blogDir)) {
        const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith(".ts") && f !== "index.ts" && f !== "types.ts");
        for (const file of blogFiles) {
          const content = fs.readFileSync(path.join(blogDir, file), "utf-8");
          const slugRegex = /slug:\s*"([^"]+)"/g;
          while ((match = slugRegex.exec(content)) !== null) {
            urls.push({ loc: `/blog/${match[1]}`, changefreq: "monthly", priority: "0.6" });
          }
        }
      }

      // Feature pages - extract slugs from seoFeaturePages.ts
      const featuresFile = path.resolve(__dirname, "src/data/seoFeaturePages.ts");
      if (fs.existsSync(featuresFile)) {
        const content = fs.readFileSync(featuresFile, "utf-8");
        const slugRegex = /slug:\s*"([^"]+)"/g;
        while ((match = slugRegex.exec(content)) !== null) {
          urls.push({ loc: `/features/${match[1]}`, changefreq: "monthly", priority: "0.7" });
        }
      }
    } catch (e) {
      console.warn("Sitemap: Error reading data files", e);
    }

    return urls;
  }

  function buildXml(urls: Array<{ loc: string; changefreq: string; priority: string }>): string {
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
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
  }

  return {
    name: "generate-sitemap",
    writeBundle() {
      const urls = loadAllUrls();
      const xml = buildXml(urls);
      fs.writeFileSync(path.resolve(__dirname, "dist/sitemap.xml"), xml);
      console.log(`Sitemap: Generated ${urls.length} URLs`);
    },
    configureServer(server) {
      server.middlewares.use("/sitemap.xml", (_req, res) => {
        const urls = loadAllUrls();
        const xml = buildXml(urls);
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
