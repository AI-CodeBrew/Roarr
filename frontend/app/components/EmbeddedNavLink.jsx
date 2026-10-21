import { Link, matchPath, useLocation, useSearchParams } from "react-router";
import { buildEmbeddedSearch } from "../lib/embeddedNavigation";

/**
 * Client-side navigation for the embedded admin iframe.
 * Replaces s-link href navigation, which triggers full document loads and re-runs bootstrap fetches.
 *
 * Uses `Link` + `matchPath` instead of `NavLink` so anchors inside `<s-app-nav>`
 * do not get `aria-current` (Shopify App Bridge flags it on `<a>` children).
 * Use `visuallyHidden` for off-screen "home" targets — never the HTML `hidden`
 * attribute (App Bridge rejects that on nav links).
 */
export function EmbeddedNavLink({ to, shop, children, end, rel, visuallyHidden }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const search = buildEmbeddedSearch(searchParams, shop);
  const href = `${to}${search}`;
  const isActive = Boolean(
    matchPath({ path: to, end: Boolean(end) }, location.pathname),
  );

  return (
    <Link
      to={`${to}${search}`}
      prefetch="intent"
      rel={rel}
      className={[
        "embedded-app-nav__link",
        isActive ? "embedded-app-nav__link--active" : "",
        visuallyHidden ? "embedded-app-nav__link--home" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Link>
  );
}
