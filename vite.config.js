import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    // Single JS chunk + single CSS — drastically fewer requests
    rollupOptions: {
      output: {
        manualChunks: undefined,          // no code splitting → 1 JS file
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
      },
    },
    // Inline small assets (<10 KB) as base64 → no extra requests
    assetsInlineLimit: 10240,
    // Minify hard
    minify: "terser",
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
    // Gzip report
    reportCompressedSize: true,
    // Raise chunk warning limit (we're intentionally one chunk)
    chunkSizeWarningLimit: 1000,
  },

  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
