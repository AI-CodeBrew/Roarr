/**
 * Return URL after a Shopify credit-pack approval.
 *
 * Shopify redirects here with `?charge_id=<id>&pack=<name>` (the pack param
 * is what we passed in; charge_id is appended by Shopify automatically).
 * This page calls the confirm-pack proxy, displays the result, then
 * navigates the merchant back to /credits.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Spinner,
  Text,
} from "@shopify/polaris";
import { useCredits } from "../lib/CreditsContext";
import { formatCredits } from "../lib/credits";
import { CreditWalletWidget } from "../components/CreditWalletWidget";

export default function CreditsCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useCredits();

  const chargeId = searchParams.get("charge_id");
  const pack = searchParams.get("pack");

  const [status, setStatus] = useState("loading"); // loading | success | error | already
  const [message, setMessage] = useState(null);
  const [creditsGranted, setCreditsGranted] = useState(null);
  const [balanceAfter, setBalanceAfter] = useState(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!chargeId) {
      setStatus("error");
      setMessage("Missing charge_id in callback URL.");
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `/api/credits/confirm-pack/${encodeURIComponent(chargeId)}`,
          { method: "POST", credentials: "include" }
        );
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.success) {
          setStatus("error");
          setMessage(
            json?.error ||
              `We couldn't confirm the charge (HTTP ${res.status}). If you were charged, refresh the credits page and we'll reconcile automatically.`
          );
          return;
        }

        setBalanceAfter(typeof json.balance === "number" ? json.balance : null);
        setCreditsGranted(
          typeof json.credits_granted === "number" ? json.credits_granted : null
        );
        setStatus(json.already_active ? "already" : "success");
        setMessage(null);
        refresh();
      } catch (err) {
        console.error("[credits] callback confirm error:", err);
        setStatus("error");
        setMessage(err?.message || "Network error during confirmation.");
      }
    })();
  }, [chargeId, refresh]);

  const goCredits = () => navigate("/credits");

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <s-page heading="Credit purchase">
        <CreditWalletWidget floating={false} slot="secondary-actions" />
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              {status === "loading" && (
                <InlineStack gap="200" align="center">
                  <Spinner size="small" />
                  <Text as="p">Confirming your purchase…</Text>
                </InlineStack>
              )}

              {status === "success" && (
                <Banner tone="success" title="Credits added">
                  <p>
                    {creditsGranted != null
                      ? `${formatCredits(creditsGranted)} were added to your wallet.`
                      : `Your ${pack || "credit"} pack was successfully applied.`}
                    {balanceAfter != null && (
                      <>
                        {" "}New balance: <strong>{formatCredits(balanceAfter)}</strong>.
                      </>
                    )}
                  </p>
                </Banner>
              )}

              {status === "already" && (
                <Banner tone="info" title="Already confirmed">
                  <p>
                    This purchase was already credited to your wallet.
                    {balanceAfter != null && (
                      <>
                        {" "}Current balance: <strong>{formatCredits(balanceAfter)}</strong>.
                      </>
                    )}
                  </p>
                </Banner>
              )}

              {status === "error" && (
                <Banner tone="critical" title="Confirmation failed">
                  <p>{message}</p>
                </Banner>
              )}

              <InlineStack gap="200">
                <Button onClick={goCredits} variant="primary">
                  Back to credits
                </Button>
              </InlineStack>
            </BlockStack>
          </Box>
        </Card>
      </s-page>
    </div>
  );
}
