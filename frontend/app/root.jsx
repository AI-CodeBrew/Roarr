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
import RoarrSplash, { SPLASH_SCRIPT, SPLASH_STYLES } from "./components/RoarrSplash";

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

        {/* Display font for dashboard headings (falls back to the system sans while loading) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
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

        <style dangerouslySetInnerHTML={{ __html: SPLASH_STYLES }} />


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
        <RoarrSplash />
        {/* Runs before React loads (the scripts sit at the end of body), so `app-ready` is never missed. */}
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
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
