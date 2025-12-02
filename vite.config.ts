import path from "node:path";
import { defineConfig } from "vite";
import { replacePlugin } from "rolldown/plugins";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    // Proxy /__/firebase to your live Firebase Hosting URL or local emulator
    // so 'init.json' can be fetched during local development.
    proxy: {
      "/__": {
        target: `http://localhost:5000`, // Replace with your actual project URL or http://localhost:5000
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rolldownOptions: {
      plugins: [
        replacePlugin({
          [`typeof window`]: JSON.stringify("object"),
        }),
      ],
    },
  },
});
