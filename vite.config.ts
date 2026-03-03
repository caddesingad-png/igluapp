import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "offline.html"],
      workbox: {
        // Pre-cache all built assets (CSS, JS, HTML, fonts, icons)
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,woff,webp}"],
        // Ensure old caches are cleaned up on new deployments
        cleanupOutdatedCaches: true,
        // Skip waiting so new SW activates immediately
        skipWaiting: true,
        clientsClaim: true,
        // Offline fallback
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/offline\.html$/],
        // Additional URLs to pre-cache for instant navigation
        additionalManifestEntries: [
          { url: "/offline.html", revision: Date.now().toString() },
        ],
        runtimeCaching: [
          // Google Fonts stylesheets — stale-while-revalidate
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // Google Fonts webfonts — cache-first (immutable)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Product images — cache-first
          {
            urlPattern: /^https:\/\/hsjwzymmyfmjexwdezoa\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "product-images",
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase REST API — stale-while-revalidate for reads
          {
            urlPattern: /^https:\/\/hsjwzymmyfmjexwdezoa\.supabase\.co\/rest\/v1\/.*/i,
            handler: "StaleWhileRevalidate",
            method: "GET",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 10 },
              cacheableResponse: { statuses: [0, 200] },
              plugins: [
                {
                  // Don't cache auth-related endpoints
                  cacheKeyWillBeUsed: async ({ request }) => {
                    if (request.url.includes("/auth/")) return undefined;
                    return request;
                  },
                },
              ],
            },
          },
          // Supabase Auth — network-only (never cache)
          {
            urlPattern: /^https:\/\/hsjwzymmyfmjexwdezoa\.supabase\.co\/auth\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
      manifest: {
        name: "Iglu",
        short_name: "Iglu",
        description: "Seu cantinho de maquiagem, organizado",
        theme_color: "#f5f0ed",
        background_color: "#f5f0ed",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
