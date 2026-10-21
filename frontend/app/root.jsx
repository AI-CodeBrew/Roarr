import { useEffect } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import tailwindStyles from "./tailwind.css?url";
import DeferredPostHogProvider from "./components/DeferredPostHogProvider";
import { SupabaseAuthProvider } from "./components/SupabaseAuthProvider";
import { reportWebVitals } from "./lib/reportWebVitals";

export const links = () => [
  { rel: "stylesheet", href: tailwindStyles },
];

export const loader = async () => {
  // Get API key from environment (server-side only)
  // PostHog / Crisp left empty in v2 by default (no-op providers)
  return {
    apiKey:
      typeof process !== "undefined" ? process.env.SHOPIFY_API_KEY || "" : "",
    posthogApiKey:
      typeof process !== "undefined"
        ? process.env.PUBLIC_POSTHOG_KEY || ""
        : "",
    posthogHost:
      typeof process !== "undefined"
        ? process.env.PUBLIC_POSTHOG_HOST || ""
        : "",
    supabaseUrl:
      typeof process !== "undefined" ? process.env.SUPABASE_URL || "" : "",
    supabaseAnonKey:
      typeof process !== "undefined" ? process.env.SUPABASE_ANON_KEY || "" : "",
  };
};

const LCP_SPLASH_STYLES = `
  .lcp-splash {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f1f1;
    transition: opacity 0.2s ease-out;
  }
  .lcp-splash[aria-hidden="true"] {
    opacity: 0;
    pointer-events: none;
  }
  .lcp-splash__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .lcp-splash__logo {
    width: 70px;
    height: 70px;
    border-radius: 5px;
    object-fit: contain;
    animation: lcp-pulse 1.2s ease-in-out infinite;
  }
  .lcp-splash__text {
    font-size: 14px;
    color:rgb(40, 41, 41);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  @keyframes lcp-pulse {
    0%, 100% { opacity: 0.85; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
`;

// Inline script installed in <head> BEFORE React mounts so that the
// `app-ready` event dispatched during hydration is never missed.
// Previously the listener was attached inside a React effect, but React
// runs child effects before parent effects, so the event fired before
// the listener was registered and the splash sat until the 8s fallback.
const SPLASH_HIDE_INLINE_SCRIPT = `
(function () {
  var hidden = false;
  function hide() {
    if (hidden) return;
    hidden = true;
    var el = document.querySelector('.lcp-splash');
    if (el) el.setAttribute('aria-hidden', 'true');
  }
  window.addEventListener('app-ready', hide, { once: true });
  // Safety net: hide on full DOM load or after 4s max, whichever comes first.
  window.addEventListener('load', function () { setTimeout(hide, 50); });
  setTimeout(hide, 4000);
})();
`;

export default function App() {
  const {
    apiKey,
    posthogApiKey,
    posthogHost,
    supabaseUrl = "",
    supabaseAnonKey = "",
  } = useLoaderData();

  useEffect(() => {
    reportWebVitals();
  }, []);

  return (
    <html lang="en">
      <head>
        {/* DNS prefetch and preconnect for external resources */}
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preload critical images */}
        <link
          rel="preload"
          as="image"
          href="https://cdn.shopify.com/s/files/1/0704/0119/6122/files/New_Project.png?v=1769678513"
          fetchpriority="high"
        />

        {/* Preload Shopify App Bridge script */}
        <link
          rel="preload"
          as="script"
          href="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          crossOrigin="anonymous"
        />

        {/* Preload Tailwind CSS */}
        <link
          rel="preload"
          as="style"
          href={tailwindStyles}
        />

        {/* Preload common dashboard images */}
        <link
          rel="preload"
          as="image"
          href="https://cdn.shopify.com/s/files/1/0704/0119/6122/files/BUNDDLES.png?v=1772100009"
        />
        <link
          rel="preload"
          as="image"
          href="https://cdn.shopify.com/s/files/1/0704/0119/6122/files/More_Templates_to_Choose_From.png?v=1772101790"
        />
        <link
          rel="preload"
          as="image"
          href="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        />

        <style dangerouslySetInnerHTML={{ __html: LCP_SPLASH_STYLES }} />
        <script dangerouslySetInnerHTML={{ __html: SPLASH_HIDE_INLINE_SCRIPT }} />


        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* Shopify App Bridge - Required for 2.2.3 compliance: first script element in head */}
        {apiKey && <meta name="shopify-api-key" content={apiKey} />}
        <meta name="shopify-debug" content="web-vitals" />
        <script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
        ></script>

        <Meta />
        <Links />
      </head>
      <body>
        <div
          className="lcp-splash"
          aria-hidden="false"
          aria-live="polite"
          suppressHydrationWarning
        >
          <div className="lcp-splash__content">
            <img
              src="https://cdn.shopify.com/s/files/1/0704/0119/6122/files/New_Project.png?v=1769678513"
              alt=""
              className="lcp-splash__logo"
              width={80}
              height={80}
              fetchpriority="low"
            />
            <span className="lcp-splash__text">Initializing…</span>
          </div>
        </div>
        <SupabaseAuthProvider url={supabaseUrl} anonKey={supabaseAnonKey}>
          <DeferredPostHogProvider
            apiKey={posthogApiKey}
            options={{
              api_host: posthogHost,
              defaults: "2026-01-30",
              autocapture: true,
              capture_pageview: false,
              capture_exceptions: true,
              debug: false,
            }}
          >
            <Outlet />
          </DeferredPostHogProvider>
        </SupabaseAuthProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
