import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  entrypointsDir: "src/entrypoints",
  manifest: {
    name: "agesture",
    description: "A browser extension for mouse gestures",
    version: "0.0.1",
    permissions: ["storage", "tabs"],
    action: {
      default_popup: "src/entrypoints/popup/index.html",
    },
    options_ui: {
      page: "src/entrypoints/options/index.html",
      open_in_tab: true,
    },
  },
  dev: {
    server: {
      host: "localhost",
      port: 3000,
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    server: {
      host: "localhost",
      port: 3000,
      strictPort: true,
      hmr: {
        port: 3000,
      },
    },
  }),
  webExt: {
    binaries: {
      chrome: "google-chrome",
    },
  },
});
