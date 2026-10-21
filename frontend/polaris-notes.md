# Polaris Web Components + React Router app notes

## Routing and layout
- `app/routes.js` flattens file-system routes via `flatRoutes()`, so each file in `app/routes` maps to a route automatically.
- The document shell in `app/root.jsx` sets up Inter font preconnect, `<Meta />`, `<Links />`, `<ScrollRestoration />`, and `<Scripts />`, then renders the active route via `<Outlet />`. No Polaris mounting here—keeps the document lean.
- `app/entry.server.jsx` wraps requests in `ServerRouter`, adds Shopify document headers with `addDocumentResponseHeaders`, and streams HTML; bots wait for `onAllReady`, users for `onShellReady`.

## Shopify app wiring (auth, sessions, env)
- `app/shopify.server.js` builds the Shopify app instance with `shopifyApp(...)` (api key/secret, scopes, app URL, auth path prefix `/auth`, distribution `AppStore`).
- Sessions persist through Prisma: `sessionStorage: new PrismaSessionStorage(prisma)` using the `Session` model in `prisma/schema.prisma` (defaults to SQLite file `dev.sqlite`; swap datasource/provider for production).
- Auth helpers exported: `authenticate`, `unauthenticated`, `login`, `registerWebhooks`, plus `addDocumentResponseHeaders` for server rendering.
- `app/db.server.js` creates a singleton `PrismaClient` in dev to avoid hot-reload connection churn.

## Navigation shell
- The authenticated app shell is `app/routes/app.jsx`. Loader enforces `authenticate.admin(request)` and injects `apiKey` (from `SHOPIFY_API_KEY`). UI wraps children in `<AppProvider embedded apiKey={apiKey}>`, then renders Polaris web-component nav:
  ```
17:23:app/routes/app.jsx
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/additional">Additional page</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  ```
- New pages: add a route file under `app/routes` (e.g., `app.somepage.jsx`) and a matching `<s-link>` in the nav above.

## UI with Polaris web components (home page)
- Home route is `app/routes/app._index.jsx`. Loader enforces admin auth; `action` uses the authenticated Admin GraphQL client to create a product and then update its variant price.
- UI patterns:
  - Wrap page content in `<s-page>`; primary action placed via `slot="primary-action"` on `<s-button>`.
  - Sections use `<s-section>`; side rail via `slot="aside"`.
  - Layout spacing via `<s-stack>` and `<s-box>` for borders/padding/backgrounds.
  - Typography via `<s-heading>`, `<s-paragraph>`, `<s-text>`.
  - Links use `<s-link>`; avoid plain `<a>` to keep embedded session/nav intact.
  ```
93:178:app/routes/app._index.jsx
<s-page heading="Shopify app template">
  <s-button slot="primary-action" onClick={generateProduct}>
    Generate a product
  </s-button>

  <s-section heading="Congrats on creating a new Shopify app 🎉">
    <s-paragraph>
      This embedded app template uses <s-link href="https://shopify.dev/docs/apps/tools/app-bridge" target="_blank">App Bridge</s-link> interface examples...
    </s-paragraph>
  </s-section>
  <!-- more sections and aside content -->
</s-page>
  ```
- Data/UI interaction:
  - `useFetcher()` drives mutations without navigation; submit with `fetcher.submit({}, { method: "POST" })`.
  - Loading state derived from `fetcher.state` + `formMethod` to set `<s-button loading>`.
  - `useEffect` + `useAppBridge()` to toast when a product is created; `shopify.intents.invoke` opens Admin edit for the new product.
  - JSON results rendered inside `<s-box>` with `<pre><code>`.

## Additional routes
- `app/routes/app.additional.jsx`: static Polaris web-component page demonstrating multi-page nav and guidance on adding links to `app.jsx`.
- Webhooks:
  - `app/routes/webhooks.app.uninstalled.jsx`: authenticated webhook; deletes sessions for the shop on uninstall.
  - `app/routes/webhooks.app.scopes_update.jsx`: updates stored session scopes from webhook payload.
- Auth landing:
  - `app/routes/_index/route.jsx`: public marketing page; if `?shop=...` exists, redirects to `/app`. Shows a simple HTML login form posting to `/auth/login` when login is enabled. Styling in `app/routes/_index/styles.module.css`.
  - `app/routes/auth.login/route.jsx`: non-embedded `<AppProvider>` login page using Polaris web components (`<s-page>`, `<s-text-field>`, `<s-button>`). Loader/action both call `login(request)`; errors mapped via `loginErrorMessage` in `error.server.jsx`.
  - `app/routes/auth.$.jsx`: loader enforces `authenticate.admin` for auth callback routes; headers piped through Shopify boundary.

## Auth/session flow summary
- Public entry (`/`) → optional form posts to `/auth/login`.
- `login(request)` (from Shopify app instance) drives OAuth and redirects back.
- Authenticated routes (everything under `/app` and webhooks) call `authenticate.admin(request)` in loaders/actions. This ensures:
  - Session lookup via Prisma storage.
  - Redirect to auth if missing/expired.
  - Provides `admin` GraphQL client for server mutations.
- Session model fields: `id`, `shop`, `state`, `isOnline`, `scope`, `expires`, `accessToken`, plus optional user metadata.

## Dev/build notes (from repo config)
- Scripts: `npm run dev` (`shopify app dev`), `npm run build` (`react-router build`), `npm run start` (`react-router-serve ./build/server/index.js`), `npm run setup` (Prisma generate + migrate).
- Key env vars: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SCOPES`, optional `SHOP_CUSTOM_DOMAIN`.
- Config: `shopify.app.toml` sets app name/id, scopes (`read_themes,write_products`), auth redirect, and app-specific webhooks for `app/uninstalled` + `app/scopes_update`.

## Implementation takeaways for future work
- Always wrap embedded pages in `<AppProvider embedded apiKey={apiKey}>` and use Polaris web components (`s-*` tags) for UI, respecting slots (`primary-action`, `aside`).
- Guard every app route loader/action with `authenticate.admin(request)` to preserve session and get the `admin` client; use that client for GraphQL calls.
- Use `useFetcher` for mutations to avoid navigation; derive loading from `fetcher.state`; surface success via `shopify.toast`.
- Navigation should stay within `<s-app-nav>` using `<s-link>` to avoid breaking embedded context.
- If adding webhooks, prefer app-specific subscriptions in `shopify.app.toml`; handle them under `app/routes/webhooks.*` with `authenticate.webhook`.

