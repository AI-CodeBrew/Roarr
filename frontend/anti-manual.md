# Klucky anti-manual (React → Polaris web components pitfalls)

## Cross-cutting mistakes to avoid
- Don’t ship both Polaris React and web components: removing or keeping `polaris.js` script tags is required—mixed runtimes cause styling/runtime clashes. In v1/v1-new the HTML shell still injects Polaris React scripts:
```
14:16:klucky-v1-new/app/root.jsx
<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
<script src="https://cdn.shopify.com/shopifycloud/polaris.js"></script>
```
- Don’t manually wire DOM listeners to Polaris web components. Use JSX handlers. Old code adds native `addEventListener` to an `s-button` ref instead of `onClick`, risking leaks and hydration mismatches:
```
18:27:klucky-v1-unzipped/klucky-v1/app/routes/app._index.jsx
if (button) {
  button.addEventListener('click', handleClick);
}
```
- Avoid imperative App Bridge navigation when `s-link`/React Router Links already handle embedded navigation; duplicating navigation logic made the migration brittle.

## Navigation and routing pitfalls
- Don’t rebuild URLs with `shop`/`host` manually; let App Bridge + router manage context. Mixing manual query propagation with web-component links added noise:
```
39:53:klucky-v1-unzipped/klucky-v1/app/routes/app.jsx
const buildUrl = (path) => { ... url.searchParams.set('shop', shop); ... }
```
- Prefer `<s-link>` or `<Link>` consistently; mixing imperative `shopify.navigation.navigate` and DOM listeners caused dead ends and harder debugging.
- Keep nav minimal: `<s-app-nav>` plus child links. Extra providers or custom nav state isn’t needed for web components.

## UI layer mistakes
- Mixing React Polaris expectations (global Polaris JS/CSS) with `s-*` tags leads to odd spacing/vars. Strip Polaris React assets when committing to web components.
- Avoid wrapping `s-button` in `<a>` or manipulating it via refs; use its own `href`/`onClick`.
- Don’t sprinkle inline `<style>` blocks for layout the components already cover (`s-stack`, `s-box`, slots). Migration left custom flex styles that fight component spacing.
- Be careful with `dangerouslySetInnerHTML` for AI output without sanitization; prefer rendering trusted fragments or sanitizing before display.

## Data + actions mistakes
- Actions/endpoints used direct `fetch("/app/api/...")` with ad-hoc alerts and no loading/empty guards; align with `useFetcher` patterns so UI state stays in sync and embedded navigation isn’t interrupted.
- Avoid noisy loader logging in production routes; v1 littered `console.log` statements inside auth-protected loaders, cluttering logs and risking leaking URLs.

## Theme/editor deep-linking pitfalls
- Don’t hardcode app block IDs or assume main theme exists without clear errors. v1/v1-new embed static UUIDs and partial error states; always validate theme ID and show actionable UI when missing.
- Build theme-editor URLs once via helpers; scattering string concatenation across components made the migration fragile.

## Auth/session consistency
- Keep a single source for session/auth. Avoid manual query propagation for auth state; rely on `authenticate.admin` and the Shopify app provider to manage embedded context.
- Ensure every loader/action in `/app` routes calls `authenticate.admin` before GraphQL; mixing protected/unprotected endpoints causes silent failures in embedded mode.

