import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  entrypointsDir: "src/entrypoints",
  manifest: {
    name: "agesture",
    description: "A browser extension for mouse gestures",
    version: "0.0.1",
    // Fix extension id (gngfpbanmokepkcpgoebgnfgpfjhijhh) for unpacked install.
    // Only the public key is needed because the extension is not packed.
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1++nsyL0wdBf6t6Pwu2GoPd3h+0rb6hyOutK4IyTDzgn/U8H7Jp4QnLfW5Y9Av2EDVEQY7CL2neL2UeviOoHZOrF01w0UPVDyUNxAfWZzadfcHriMr97odl+CUTUH9Avf2jW6UmnvoFZyS54n+ctNLLlRnMqx6VQpAqZCSRB1Ukk+GNxUKcZWKI6YT4MIqUixUkPWD3uZ3qq3HSEIf8iqXuJslB3nwD6fg3p3T3KYDbTtak37W0BLQy78lWIYJmvzda6GiGUWTjjnhszk47/CskOqTW7wlPxjqwYXQMIkPnVUn87BR1TZshChkIR4bCJtbLk/djMP1ctO8680wJDqwIDAQAB",
    permissions: [
      "storage",
      "tabs",
      "bookmarks",
      "favicon",
      "scripting",
      "search",
      "sessions",
    ],
    host_permissions: ["http://*/*", "https://*/*"],
    action: {
      default_popup: "src/entrypoints/popup/index.html",
    },
    options_ui: {
      page: "src/entrypoints/options/index.html",
      open_in_tab: true,
    },
    chrome_url_overrides: {
      newtab: "src/entrypoints/newtab/index.html",
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
    chromiumArgs: ["--window-position=3520,0", "--window-size=1920,1080"],
  },
});
