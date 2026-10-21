/**
 * Pre-action confirmation that this feature will deduct credits from the wallet.
 *
 * Shows current balance, feature cost, and projected balance afterward.
 * If the wallet cannot cover the cost, confirm is unavailable and the credits page is offered.
 * If balance is low (or remaining after spend is low), surfaces "Get more credits".
 */
import { useEffect } from "react";
import { Modal, BlockStack, Text, Button, InlineStack, Box } from "@shopify/polaris";
import { useNavigate } from "react-router";
import { useCredits } from "../lib/CreditsContext";
import {
  FEATURE_COSTS_DEFAULT,
  FEATURE_LABELS,
  formatCredits,
} from "../lib/credits";

/** Below this balance we always show “Get more credits” (merchant may want to top up). */
const LOW_BALANCE_HINT_THRESHOLD = 200;
/** After this spend, remaining under this prompts the extra CTA. */
const LOW_REMAINING_AFTER_SPEND_THRESHOLD = 100;

export function CreditConfirmationModal({
  open,
  onClose,
  onConfirm,
  featureKey = "brand_ads_campaign",
  costOverride = null,
  featureLabelOverride = null,
}) {
  const navigate = useNavigate();
  const { balance, featureCosts, loading, refresh, hasActivePurchase } = useCredits();

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const costRaw =
    costOverride != null
      ? costOverride
      : featureCosts?.[featureKey] ?? FEATURE_COSTS_DEFAULT[featureKey] ?? 0;
  const cost = Number(costRaw) || 0;
  const featureLabel =
    featureLabelOverride ||
    FEATURE_LABELS[featureKey] ||
    featureKey.replace(/_/g, " ");

  const bal = typeof balance === "number" ? balance : null;
  const insufficient = bal !== null && cost > 0 && bal < cost;
  const remaining =
    bal !== null && typeof bal === "number" ? Math.max(0, bal - cost) : null;

  const showGetMoreCreditsHint =
    !insufficient &&
    bal !== null &&
    (bal < LOW_BALANCE_HINT_THRESHOLD ||
      (remaining !== null &&
        remaining < LOW_REMAINING_AFTER_SPEND_THRESHOLD &&
        remaining >= 0));

  const goBilling = () => {
    onClose?.();
    navigate("/credits"); // top-level route; `_app` allowlists /credits during onboarding
  };

  const handleConfirm = () => {
    if (insufficient || loading || bal === null) return;
    onConfirm?.();
  };

  return (
    <Modal
      open={open}
      title="Credit confirmation"
      onClose={onClose}
      primaryAction={
        insufficient
          ? {
              content: "Get more credits",
              onAction: goBilling,
              disabled: loading,
            }
          : {
              content: "Confirm and continue",
              onAction: handleConfirm,
              disabled: loading || bal === null,
            }
      }
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
          disabled: loading,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {loading && bal === null ? (
            <Text as="p" tone="subdued">
              Loading wallet…
            </Text>
          ) : (
            <>
              {insufficient && !hasActivePurchase && (
                <Box
                  background="bg-surface-warning"
                  padding="300"
                  borderRadius="200"
                  borderWidth="025"
                  borderColor="border-warning"
                >
                  <Text as="p" variant="bodyMd" fontWeight="bold">
                    You've used your free credits. Purchase a pack to keep
                    creating.
                  </Text>
                </Box>
              )}

              <Text as="p" variant="bodyMd">
                <strong>{featureLabel}</strong> will deduct credits from your wallet.
              </Text>

              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="baseline" gap="400" wrap={false}>
                  <Text as="span" variant="bodySm" tone="subdued">
                    Your current balance
                  </Text>
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    {bal !== null ? formatCredits(bal) : "—"}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between" blockAlign="baseline" gap="400" wrap={false}>
                  <Text as="span" variant="bodySm" tone="subdued">
                    This action requires
                  </Text>
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    {formatCredits(cost)}
                  </Text>
                </InlineStack>
                <InlineStack align="space-between" blockAlign="baseline" gap="400" wrap={false}>
                  <Text as="span" variant="bodySm" tone="subdued">
                    Balance after this action
                  </Text>
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    {insufficient ? "—" : remaining !== null ? formatCredits(remaining) : "—"}
                  </Text>
                </InlineStack>
              </BlockStack>

              {insufficient && (
                <Text as="p" tone="critical">
                  You need <strong>{formatCredits(cost)}</strong> but only have{" "}
                  <strong>{bal !== null ? formatCredits(bal) : formatCredits(0)}</strong>.
                  Purchase a credit pack to continue.
                </Text>
              )}

              {!insufficient &&
                remaining !== null &&
                showGetMoreCreditsHint && (
                  <Box paddingBlockStart="100">
                    <InlineStack gap="300" wrap blockAlign="center">
                      <Text as="span" variant="bodySm" tone="subdued">
                        Running low on credits? You can top up anytime.
                      </Text>
                      <Button onClick={goBilling}>Get more credits</Button>
                    </InlineStack>
                  </Box>
                )}
            </>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
