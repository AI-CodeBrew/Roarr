import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Box } from "@shopify/polaris";
import { X } from "lucide-react";
import { buildEmbeddedHref } from "../../lib/embeddedNavigation";

const surface = "#0d1b2e";
const accent = "#f6ad55";
const muted = "#a0aec0";

/**
 * Dismissible “new in v2.1” promo card; shown under plan slots on the home dashboard.
 * Dismiss is in-memory only — the card shows again on full page load.
 */
export default function DashboardAnnouncement({ shop }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const goTo = useCallback(
    (pathname) => {
      navigate(buildEmbeddedHref(pathname, searchParams, shop));
    },
    [navigate, searchParams, shop],
  );

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <Box position="relative" borderRadius="300" padding="0" overflow="hidden">
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 1,
        }}
      >
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            padding: 0,
            border: "none",
            borderRadius: 6,
            background: "rgba(255, 255, 255, 0.08)",
            color: muted,
            cursor: "pointer",
          }}
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      <div
        style={{
          background: surface,
          borderRadius: 12,
          padding: "24px 44px 24px 24px",
        }}
      >
        <p
          style={{
            margin: 0,
            color: accent,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            lineHeight: 1.4,
          }}
        >
          NEW IN V2.1
        </p>
        <h2
          style={{
            margin: "10px 0 0 0",
            color: "#ffffff",
            fontSize: "1.25rem",
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          Mobile-first layouts — now automatic
        </h2>
        <p
          style={{
            margin: "10px 0 0 0",
            color: muted,
            fontSize: "0.875rem",
            lineHeight: 1.5,
          }}
        >
          Store revamps now generate mobile-optimised layouts in the same generation.{" "}
          <span style={{ color: accent, fontWeight: 600 }}>50% faster</span> for all plans.
        </p>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={() => goTo("/entire-store")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: "0.8125rem",
              fontWeight: 500,
              cursor: "pointer",
              background: "#ffffff",
              color: surface,
              border: "1px solid #ffffff",
            }}
          >
            Start a store revamp
          </button>
          <button
            type="button"
            onClick={() => goTo("/faq")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: "0.8125rem",
              fontWeight: 500,
              cursor: "pointer",
              background: "transparent",
              color: "#e2e8f0",
              border: "1px solid rgba(226, 232, 240, 0.45)",
            }}
          >
            Learn more
          </button>
        </div>
      </div>
    </Box>
  );
}
