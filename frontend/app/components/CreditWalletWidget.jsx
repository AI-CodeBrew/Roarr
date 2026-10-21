/**
 * Wallet balance — use `floating={false}` + `slot="secondary-actions"`
 * on `<s-page>` for the page title row.
 *
 * Click navigates to credits.
 */
import { useNavigate } from "react-router";
import { useCredits } from "../lib/CreditsContext";
import { formatCredits } from "../lib/credits";

const PILL_FLOATING_CONTENT = {
  padding: "6px 12px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.08)",
  userSelect: "none",
};

const PILL_FLOATING_SINGLE = {
  ...PILL_FLOATING_CONTENT,
  position: "fixed",
  top: 12,
  right: 12,
  zIndex: 50,
};

/** Inline variant for `<s-page slot="secondary-actions">` (no fixed positioning). */
const PILL_PAGE_BAR = {
  position: "static",
  zIndex: "auto",
  padding: "6px 12px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  border: "1px solid rgba(255,255,255,0.08)",
  userSelect: "none",
  flexShrink: 0,
};

const LOW_THRESHOLD = 200;
const VERY_LOW_THRESHOLD = 50;

function balanceBackground(balance) {
  let bg = PILL_FLOATING_CONTENT.background;
  if (typeof balance === "number") {
    if (balance < VERY_LOW_THRESHOLD) {
      bg = "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)";
    } else if (balance < LOW_THRESHOLD) {
      bg = "linear-gradient(135deg, #b45309 0%, #78350f 100%)";
    }
  }
  return bg;
}

export function CreditWalletWidget({ floating = true, onClick, slot: slotName }) {
  const { balance, loading, error } = useCredits();
  const navigate = useNavigate();

  const isPageBar = Boolean(slotName);
  if (!isPageBar && balance === null && !loading) return null;

  const handleClick = () => {
    if (onClick) onClick();
    else navigate("/credits");
  };

  const walletLabel =
    loading && balance === null
      ? "Wallet: …"
      : typeof balance === "number"
        ? `Wallet: ${formatCredits(balance)}`
        : error
          ? "Wallet: —"
          : "Wallet: …";

  const balanceBg = balanceBackground(balance);
  const balanceFloatingSingleStyle = { ...PILL_FLOATING_SINGLE, background: balanceBg };
  const balancePageStyle = { ...PILL_PAGE_BAR, background: balanceBg };

  const balanceAria =
    typeof balance === "number"
      ? `Wallet: ${formatCredits(balance)}. Click to manage credits.`
      : error
        ? "Wallet unavailable — click to open credits."
        : "Loading wallet balance.";

  const balanceTitle =
    error
      ? "Could not load balance — click to open credits"
      : "Click to buy or manage credits";

  const balanceInner = <span>{walletLabel}</span>;

  if (slotName) {
    return (
      <s-button
        slot={slotName}
        variant="secondary"
        onClick={handleClick}
        style={balancePageStyle}
        aria-label={balanceAria}
        title={balanceTitle}
      >
        {balanceInner}
      </s-button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={balanceFloatingSingleStyle}
      aria-label={balanceAria}
      title={balanceTitle}
    >
      {balanceInner}
    </button>
  );
}
