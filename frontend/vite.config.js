import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the Vite server.
// The CLI will eventually stop passing in HOST,
// so we can remove this workaround after the next major release.
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
  .hostname;
let hmrConfig;

if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  server: {
    allowedHosts: [host],
    cors: {
      preflightContinue: true,
    },
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
      allow: ["app", "config", "node_modules"],
    },
  },
  plugins: [reactRouter(), tsconfigPaths()],
  ssr: {
    // posthog-js/react ships ESM in a .js file without "type": "module", so
    // runtimes that don't sniff module syntax (Vercel) load it as CommonJS and
    // crash on the named import. Bundling it into the server build avoids that.
    noExternal: [/^posthog-js(\/|$)/],
  },
  build: {
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    // Pre-bundle every client dep up front: if Vite discovers one mid-session it
    // re-optimizes, and an already-open embedded page ends up mixing React chunks
    // from two optimizer runs ("Cannot read properties of null (reading 'useContext')").
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "react-router",
      "react-router/dom",
      "@shopify/shopify-app-react-router/react",
      "@shopify/shopify-app-react-router/server",
      "@shopify/app-bridge-react",
      "@shopify/polaris",
      "@shopify/polaris-icons",
      "@supabase/supabase-js",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "crisp-sdk-web",
      "lucide-react",
      "posthog-js/react",
      "react-colorful",
      "uuid",
      "web-vitals",
    ],
  },
});
