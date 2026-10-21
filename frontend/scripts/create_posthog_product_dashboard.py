#!/usr/bin/env python3
"""
Rebuild the Kluck dashboard: stat cards on top, full-width funnels.

  export POSTHOG_PERSONAL_API_KEY='phx_...'
  export POSTHOG_PROJECT_ID=296750
  export POSTHOG_DASHBOARD_ID=1998629
  python scripts/create_posthog_product_dashboard.py
"""

from __future__ import annotations

import json
import os
import ssl
import sys
import urllib.error
import urllib.request

_CA_CANDIDATES = (
    "/etc/ssl/cert.pem",
    "/opt/homebrew/etc/openssl@3/cert.pem",
    "/usr/local/etc/openssl@3/cert.pem",
)


def _ssl_context() -> ssl.SSLContext:
    for path in _CA_CANDIDATES:
        if os.path.isfile(path):
            return ssl.create_default_context(cafile=path)
    try:
        import certifi

        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl._create_unverified_context()


SSL_CTX = _ssl_context()

HOST = os.environ.get("POSTHOG_HOST", "https://us.posthog.com").rstrip("/")
PROJECT_ID = os.environ.get("POSTHOG_PROJECT_ID", "296750")
API_KEY = os.environ.get("POSTHOG_PERSONAL_API_KEY", "").strip()
DASHBOARD_ID = os.environ.get("POSTHOG_DASHBOARD_ID", "1998629").strip()

DATE = {"date_from": "-30d", "explicitDate": False}

NAME = "Kluck — usage & drop-off"
DESCRIPTION = (
    "Totals first, then COD and prepaid stat cards and funnels. Last 30 days."
)


def req(method: str, path: str, body: dict | None = None) -> dict:
    url = f"{HOST}{path}"
    data = None if body is None else json.dumps(body).encode("utf-8")
    r = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(r, context=SSL_CTX) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        raise SystemExit(f"{method} {path} -> {e.code}\n{err}") from e


def events_node(
    event: str,
    name: str | None = None,
    props=None,
    math: str | None = None,
    math_property: str | None = None,
):
    node = {
        "kind": "EventsNode",
        "event": event,
        "name": name or event,
        "custom_name": name or event,
    }
    if math:
        node["math"] = math
    if math_property:
        node["math_property"] = math_property
    if props:
        node["properties"] = props
    return node


def prop(key: str, value, operator: str = "exact"):
    values = value if isinstance(value, list) else [value]
    return {"key": key, "value": values, "operator": operator, "type": "event"}


def funnel(series, market_type=None, viz="steps"):
    source = {
        "kind": "FunnelsQuery",
        "series": series,
        "dateRange": DATE,
        "funnelsFilter": {
            "funnelOrderType": "ordered",
            "funnelVizType": viz,
            "funnelWindowInterval": 14,
            "funnelWindowIntervalUnit": "day",
        },
    }
    if market_type:
        source["properties"] = [prop("market_type", market_type)]
    return {"kind": "InsightVizNode", "source": source}


def bold(event: str, name: str, props=None, math: str = "total"):
    return {
        "kind": "InsightVizNode",
        "source": {
            "kind": "TrendsQuery",
            "series": [events_node(event, name, props, math=math)],
            "dateRange": DATE,
            "interval": "day",
            "trendsFilter": {"display": "BoldNumber"},
            "compareFilter": {"compare": True},
        },
    }


# Old pdp_generated events (before the category fix) logged Glow/Play as "Template 3".
# Template 3 is only Aura (health_beauty) or Play (kids_toys); these page ids were Play.
_OLD_PLAY_PAGE_IDS = (
    "e6f8f771-daa4-4f6d-aee3-99344c1acab1",
    "ee3c9341-c9ea-4526-b1c1-6d3c4805e239",
)
THEME_EXPR = (
    "if(properties.theme_name = 'Template 3', "
    "if(toString(properties.page_id) IN ("
    + ", ".join(f"'{i}'" for i in _OLD_PLAY_PAGE_IDS)
    + "), 'Play', 'Aura'), properties.theme_name)"
)


def bars(series, breakdown=None, breakdown_type="event"):
    source = {
        "kind": "TrendsQuery",
        "series": series,
        "dateRange": DATE,
        "interval": "day",
        "trendsFilter": {"display": "ActionsBarValue"},
    }
    if breakdown:
        source["breakdownFilter"] = {
            "breakdown": breakdown,
            "breakdown_type": breakdown_type,
        }
    return {"kind": "InsightVizNode", "source": source}


def clear_tiles(dash_id: int) -> None:
    dash = req("GET", f"/api/projects/{PROJECT_ID}/dashboards/{dash_id}/")
    for tile in dash.get("tiles") or []:
        tid = tile.get("id")
        if not tid:
            continue
        req(
            "POST",
            f"/api/projects/{PROJECT_ID}/dashboards/{dash_id}/delete_tile/",
            {"tile_id": tid},
        )
        print(f"  removed tile {tid}")


def apply_layout(dash_id: int, kinds: list[str]) -> None:
    dash = req("GET", f"/api/projects/{PROJECT_ID}/dashboards/{dash_id}/")
    tiles = [t for t in (dash.get("tiles") or []) if not t.get("deleted")]
    if len(tiles) != len(kinds):
        print(f"warn: {len(tiles)} tiles vs {len(kinds)} kinds — laying out by zip")

    sizes = {
        "stat": (3, 4),
        "funnel": (12, 6),
        "bars": (12, 6),
        "text": (12, 1),
    }

    payload = []
    y = 0
    x = 0
    row_h = 0

    def flush_row():
        nonlocal x, y, row_h
        if row_h:
            y += row_h
            x = 0
            row_h = 0

    for tile, kind in zip(tiles, kinds):
        w, h = sizes.get(kind, (12, 6))
        if kind in ("text", "funnel", "bars") or x + w > 12:
            flush_row()
        payload.append(
            {
                "id": tile["id"],
                "show_description": kind in ("stat", "funnel", "bars"),
                "layouts": {"sm": {"x": x, "y": y, "w": w, "h": h}},
            }
        )
        if kind in ("text", "funnel", "bars"):
            y += h
            x = 0
            row_h = 0
        else:
            x += w
            row_h = max(row_h, h)
            if x >= 12:
                flush_row()
    flush_row()

    req(
        "PATCH",
        f"/api/projects/{PROJECT_ID}/dashboards/{dash_id}/",
        {"tiles": payload},
    )
    print(f"Laid out {len(payload)} tiles")


def main() -> None:
    if not API_KEY:
        sys.exit("Set POSTHOG_PERSONAL_API_KEY")

    if DASHBOARD_ID:
        dash_id = int(DASHBOARD_ID)
        req(
            "PATCH",
            f"/api/projects/{PROJECT_ID}/dashboards/{dash_id}/",
            {"name": NAME, "description": DESCRIPTION},
        )
        print(f"Clearing dashboard {dash_id}")
        clear_tiles(dash_id)
    else:
        dash = req(
            "POST",
            f"/api/projects/{PROJECT_ID}/dashboards/",
            {
                "name": NAME,
                "description": DESCRIPTION,
                "tags": ["kluck", "product"],
                "restriction_level": 21,
            },
        )
        dash_id = dash["id"]
        print(f"Dashboard {dash_id}")

    kinds: list[str] = []

    def text(body: str):
        req(
            "POST",
            f"/api/projects/{PROJECT_ID}/dashboards/{dash_id}/create_text_tile/",
            {"body": body},
        )
        kinds.append("text")

    def insight(name: str, description: str, query: dict, kind: str):
        created = req(
            "POST",
            f"/api/projects/{PROJECT_ID}/insights/",
            {
                "name": name,
                "description": description,
                "saved": True,
                "query": query,
                "dashboards": [dash_id],
                "tags": ["kluck"],
            },
        )
        kinds.append(kind)
        print(f"  + {name} ({created.get('id')})")
        return created

    flow_prop = [
        prop("step_name", ["store_flow_selected", "product_flow_selected"])
    ]

    def page(name, market=None):
        props = [prop("page_name", name)]
        if market:
            props.append(prop("market_type", market))
        return props

    def mprops(*extra, market=None):
        out = [p for p in extra if p]
        if market:
            out.append(prop("market_type", market))
        return out or None

    insight(
        "Installs",
        "Shops identified in the last 30 days (install / first session).",
        bold("$identify", "Installs"),
        "stat",
    )
    insight(
        "Uninstalls",
        "App uninstall events in the last 30 days.",
        bold("app_uninstalled", "Uninstalls"),
        "stat",
    )
    insight(
        "Checkouts started",
        "Times a merchant clicked buy on a credit pack.",
        bold("credits_pack_checkout_started", "Checkouts started"),
        "stat",
    )
    insight(
        "Paid (all)",
        "All credit pack purchases, COD and prepaid together.",
        bold("credits_pack_purchased", "Paid"),
        "stat",
    )

    for market, label in (("cod", "COD"), ("prepaid", "Prepaid")):
        insight(
            f"{label} · generated PDPs",
            f"{label} product pages generated.",
            bold("pdp_generated", f"{label} generated PDPs", mprops(market=market)),
            "stat",
        )
        insight(
            f"{label} · published PDPs",
            f"{label} product pages published.",
            bold("pdp_published", f"{label} published PDPs", mprops(market=market)),
            "stat",
        )
        insight(
            f"{label} · generated single stores",
            f"{label} single-product stores generated.",
            bold(
                "store_generated",
                f"{label} generated single",
                mprops(prop("store_type", "single"), market=market),
            ),
            "stat",
        )
        insight(
            f"{label} · published single stores",
            f"{label} single-product stores published.",
            bold(
                "store_published",
                f"{label} published single",
                mprops(prop("mode", "single_product"), market=market),
            ),
            "stat",
        )
        insight(
            f"{label} · generated multi stores",
            f"{label} multi-product stores generated.",
            bold(
                "store_generated",
                f"{label} generated multi",
                mprops(prop("store_type", "multi"), market=market),
            ),
            "stat",
        )
        insight(
            f"{label} · published multi stores",
            f"{label} multi-product stores published.",
            bold(
                "store_published",
                f"{label} published multi",
                mprops(prop("mode", "multi_product"), market=market),
            ),
            "stat",
        )
        insight(
            f"{label} · paywall modal",
            f"{label} times the purchase-required modal was shown.",
            bold(
                "purchase_required_modal_shown",
                f"{label} paywall",
                mprops(market=market),
            ),
            "stat",
        )
        insight(
            f"{label} · paid",
            f"{label} credit pack purchases.",
            bold(
                "credits_pack_purchased",
                f"{label} paid",
                mprops(market=market),
            ),
            "stat",
        )

        insight(
            f"{label} · paywall → paid",
            f"{label} only. Saw modal → credits → checkout → paid.",
            funnel(
                [
                    events_node("purchase_required_modal_shown", "Saw paywall"),
                    events_node("credits_page_viewed", "Opened credits"),
                    events_node("credits_pack_checkout_started", "Started checkout"),
                    events_node("credits_pack_purchased", "Paid"),
                ],
                market_type=market,
            ),
            "funnel",
        )
        insight(
            f"{label} · entire store → published",
            f"{label} only. Chose store → configured → generated → published.",
            funnel(
                [
                    events_node(
                        "onboarding_step_completed",
                        "Chose store",
                        mprops(prop("step_name", "store_flow_selected"), market=market),
                    ),
                    events_node(
                        "onboarding_step_completed",
                        "Configured",
                        mprops(prop("step_name", "store_configured"), market=market),
                    ),
                    events_node(
                        "onboarding_step_completed",
                        "Generated",
                        mprops(prop("step_name", "content_generated"), market=market),
                    ),
                    events_node(
                        "store_published",
                        "Published",
                        mprops(market=market),
                    ),
                ],
                market_type=market,
            ),
            "funnel",
        )
        insight(
            f"{label} · PDP → published",
            f"{label} only. Chose PDP → configured → generated → published.",
            funnel(
                [
                    events_node(
                        "onboarding_step_completed",
                        "Chose PDP",
                        mprops(prop("step_name", "product_flow_selected"), market=market),
                    ),
                    events_node(
                        "onboarding_step_completed",
                        "Configured",
                        mprops(prop("step_name", "product_configured"), market=market),
                    ),
                    events_node(
                        "onboarding_step_completed",
                        "Generated",
                        mprops(prop("step_name", "content_generated"), market=market),
                    ),
                    events_node(
                        "pdp_published",
                        "Published",
                        mprops(market=market),
                    ),
                ],
                market_type=market,
            ),
            "funnel",
        )
        insight(
            f"{label} · onboarding → paid",
            f"{label} only. Prefs saved → chose a flow → credits → paid.",
            funnel(
                [
                    events_node(
                        "onboarding_step_completed",
                        "Prefs saved",
                        mprops(
                            prop("step_name", "market_preferences_saved"),
                            market=market,
                        ),
                    ),
                    events_node(
                        "onboarding_step_completed",
                        "Chose a flow",
                        mprops(*flow_prop, market=market),
                    ),
                    events_node(
                        "credits_page_viewed",
                        "Opened credits",
                        mprops(market=market),
                    ),
                    events_node(
                        "credits_pack_purchased",
                        "Paid",
                        mprops(market=market),
                    ),
                ],
                market_type=market,
            ),
            "funnel",
        )
        insight(
            f"{label} · pages → time between them",
            f"{label} only. Hover a step for average time from the previous page.",
            funnel(
                [
                    events_node("page_viewed", "Onboarding", page("onboarding", market)),
                    events_node("page_viewed", "Dashboard", page("dashboard", market)),
                    events_node(
                        "page_viewed", "Entire store", page("entire_store", market)
                    ),
                    events_node(
                        "page_viewed", "Product page", page("product_page", market)
                    ),
                    events_node("page_viewed", "Credits", page("credits", market)),
                ],
                market_type=market,
            ),
            "funnel",
        )

    insight(
        "PDPs by theme · generated",
        "Product pages generated (pdp_generated), split by theme_name (Sleek, Vibe, Aura, Play).",
        bars([events_node("pdp_generated", "Generated")], breakdown=THEME_EXPR, breakdown_type="hogql"),
        "bars",
    )
    insight(
        "PDPs by theme · published",
        "Product pages published (pdp_published), split by theme_name (Sleek, Vibe, Aura, Play).",
        bars([events_node("pdp_published", "Published")], breakdown="theme_name"),
        "bars",
    )
    insight(
        "Stores by theme · generated",
        "Entire stores generated (store_generated), split by theme_name (Linen, Pulse, Eclipse, Velvet, Amour, Swift, The Collective, Meridian, Luminous).",
        bars(
            [events_node("store_generated", "Generated")],
            breakdown="theme_name",
        ),
        "bars",
    )
    insight(
        "Stores by theme · published",
        "Entire stores published (store_published), split by theme_name. Only stores published after theme tracking shipped have a theme.",
        bars(
            [events_node("store_published", "Published")],
            breakdown="theme_name",
        ),
        "bars",
    )
    for market, label in (("cod", "COD"), ("prepaid", "Prepaid")):
        insight(
            f"{label} · generations by theme",
            f"{label} only. PDPs and stores generated, split by theme_name.",
            bars(
                [
                    events_node("pdp_generated", "PDP generated", mprops(market=market)),
                    events_node("store_generated", "Store generated", mprops(market=market)),
                ],
                breakdown=THEME_EXPR,
                breakdown_type="hogql",
            ),
            "bars",
        )

    insight(
        "Average seconds on each page",
        "From page_left. Empty until duration tracking ships.",
        bars(
            [
                events_node(
                    "page_left",
                    "Avg seconds",
                    math="avg",
                    math_property="duration_seconds",
                )
            ],
            breakdown="page_name",
        ),
        "bars",
    )

    apply_layout(dash_id, kinds)
    print(f"{HOST}/project/{PROJECT_ID}/dashboard/{dash_id}")


if __name__ == "__main__":
    main()
