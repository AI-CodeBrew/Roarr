/**
 * Public Privacy Policy page: GET /privacy
 *
 * This is a resource route (a loader and no default export), so React Router returns this HTML
 * as it is. The root layout never renders here: no App Bridge script, no splash screen, no
 * Supabase/PostHog providers, and no Shopify authentication. Anyone can open it without
 * installing the app, which is what the App Store listing's privacy policy URL needs.
 *
 * Keep the text in line with the code. Sections 5 and 6 were checked against it on 2026-11-13:
 * providers in backend/app/clients, frontend/app/routes/_app.jsx (Crisp),
 * backend/app/modules/utils/reddit_conversions.py, and deletion in
 * frontend/app/routes/webhooks.compliance.jsx + DocumentStore.delete_shop_data.
 */

const CONTACT_EMAIL = "fynktech1@gmail.com";

const PRIVACY_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Roarr Privacy Policy</title>
<meta name="description" content="How the Roarr Shopify app collects, uses, shares and deletes merchant data.">
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #ffffff;
    color: #1f2328;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 17px;
    line-height: 1.65;
  }
  main { max-width: 760px; margin: 0 auto; padding: 48px 20px 64px; }
  h1 { font-size: 2rem; line-height: 1.25; margin: 0 0 6px; }
  h2 { font-size: 1.25rem; line-height: 1.35; margin: 36px 0 8px; }
  p, ul { margin: 0 0 14px; }
  ul { padding-left: 22px; }
  li { margin-bottom: 6px; }
  a { color: #4338ff; }
  .updated { color: #59636e; font-size: 0.95rem; margin-bottom: 28px; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.9em; }
  footer { margin-top: 44px; padding-top: 16px; border-top: 1px solid #d1d9e0; color: #59636e; font-size: 0.95rem; }
  @media (prefers-color-scheme: dark) {
    body { background: #0d1117; color: #e6edf3; }
    a { color: #a5b4fc; }
    .updated, footer { color: #9198a1; }
    footer { border-top-color: #30363d; }
  }
</style>
</head>
<body>
<main>
  <h1>Roarr Privacy Policy</h1>
  <p class="updated">Last updated: November 13, 2026</p>

  <p>This policy explains what information Roarr collects when a merchant installs it on a Shopify store, how we use that information, who we share it with, and how it is deleted.</p>

  <h2>1. Who we are</h2>
  <p>Roarr is a Shopify app made by FynkTech. In this policy, "we" and "us" mean FynkTech, and "you" means the merchant who installs Roarr. For any question about this policy or your data, email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>

  <h2>2. Information we collect</h2>
  <p>When you install and use Roarr, we collect:</p>
  <ul>
    <li><strong>Store details from Shopify:</strong> your shop domain, shop name, Shopify plan and store currency, the shop owner's email address, and the shop's phone number when Shopify provides one.</li>
    <li><strong>Your Shopify access token</strong>, which lets Roarr work with your store on your behalf.</li>
    <li><strong>Product data:</strong> titles, descriptions, images and prices of your products.</li>
    <li><strong>Theme data:</strong> the theme files Roarr reads, and the templates and sections it adds to your theme.</li>
    <li><strong>Discounts</strong> you create through Roarr, such as bundle discounts.</li>
    <li><strong>Content Roarr creates for you:</strong> generated product pages, store designs, images and ad creatives, and the brand details you enter for them.</li>
    <li><strong>Credits:</strong> your credit balance and credit purchase history.</li>
    <li><strong>App usage analytics:</strong> which parts of the app you use, and events such as installing, uninstalling or buying credits.</li>
    <li><strong>Support messages</strong> you send us through the in-app chat.</li>
  </ul>

  <h2>3. Your customers' data</h2>
  <p>Roarr does not collect or store personal data about your store's customers. Roarr does not ask for access to your customers or orders, and it does not request Shopify protected customer data.</p>

  <h2>4. How we use information</h2>
  <ul>
    <li>To generate product pages, store designs, images and ad creatives.</li>
    <li>To publish what Roarr generates to your theme when you choose to.</li>
    <li>To manage your credits and charge for credit packs through Shopify Billing.</li>
    <li>To provide support.</li>
    <li>To understand how the app is used and improve it.</li>
    <li>To measure our own advertising.</li>
  </ul>

  <h2>5. Service providers we share data with</h2>
  <p>We share information only with the providers below, and each one receives only what it needs for its task:</p>
  <ul>
    <li><strong>OpenAI and Google (Gemini):</strong> product information and images, sent to generate text and images.</li>
    <li><strong>Supabase:</strong> our app database.</li>
    <li><strong>Bunny CDN:</strong> stores and serves the images Roarr generates.</li>
    <li><strong>Vercel and Fly.io:</strong> host the app and its servers.</li>
    <li><strong>PostHog:</strong> product analytics about how the app is used.</li>
    <li><strong>Crisp:</strong> the in-app support chat. When the chat loads it receives your shop domain, shop name, Shopify plan, store currency, the shop owner's email address and, if available, the phone number, together with the messages you send.</li>
    <li><strong>Reddit (Conversions API):</strong> when a store installs Roarr, we send a SHA-256 hash of the shop owner's email address and, if available, phone number, to measure our Reddit ads. Reddit does not receive them in readable form.</li>
    <li><strong>Shopify:</strong> billing and the app platform.</li>
  </ul>
  <p>We do not sell personal information.</p>

  <h2>6. Data retention and deletion</h2>
  <p>We keep your data while Roarr is installed on your store.</p>
  <p>When you uninstall Roarr, we delete the app's Shopify sessions for your store, including the access tokens they hold, and mark the store as uninstalled.</p>
  <p>About 48 hours after you uninstall, Shopify sends us the <code>shop/redact</code> webhook. When it arrives, we delete everything our database holds for your store: store details, access tokens, generated pages and store designs, credits and purchase history, bundles and brand details.</p>
  <p>Images Roarr generated and stored on Bunny CDN are not yet removed by this automatic deletion. Email us and we will delete them.</p>
  <p>We also respond to Shopify's <code>customers/data_request</code> and <code>customers/redact</code> webhooks. Because Roarr stores no customer data, there is nothing to export or delete for those requests.</p>
  <p>Information already sent to the providers in section 5 is kept under their own retention policies.</p>

  <h2>7. Your rights</h2>
  <p>Under the GDPR, the CCPA and similar laws, you can ask to access, correct or delete the personal data we hold about you. Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> and tell us your shop domain.</p>

  <h2>8. Security</h2>
  <p>All data is encrypted in transit using HTTPS. Shopify access tokens are stored on our servers, and Roarr uses Shopify's expiring access tokens, which are renewed regularly. We check Shopify's signature on every webhook we receive.</p>

  <h2>9. Changes to this policy</h2>
  <p>If we change this policy, we will post the new version on this page and update the "Last updated" date above.</p>

  <footer>Roarr by FynkTech &middot; <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></footer>
</main>
</body>
</html>
`;

export const loader = () =>
  new Response(PRIVACY_HTML, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
