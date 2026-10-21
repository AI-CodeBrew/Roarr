/**
 * Global modal triggered when any credit-spending action returns 402.
 *
 * The credits provider holds the state; any component can call
 *   const { showInsufficient } = useCredits();
 *   showInsufficient({ balance, required, feature, message });
 *
 * This component listens to that state and renders the modal.
 */
import { Modal, Text, BlockStack, Button, InlineStack } from "@shopify/polaris";
import { useNavigate } from "react-router";
import { useCredits } from "../lib/CreditsContext";
import { FEATURE_LABELS, formatCredits } from "../lib/credits";

export function InsufficientCreditsModal() {
  const { insufficient, dismissInsufficient } = useCredits();
  const navigate = useNavigate();

  if (!insufficient) return null;

  const { balance, required, feature, message } = insufficient;
  const featureLabel = feature ? FEATURE_LABELS[feature] || feature : null;
  const shortfall = Math.max(0, required - balance);

  const handleBuy = () => {
    dismissInsufficient();
    navigate("/credits");
  };

  return (
    <Modal
      open
      title="You're out of credits"
      onClose={dismissInsufficient}
      primaryAction={{ content: "Buy credits", onAction: handleBuy }}
      secondaryActions={[
        { content: "Cancel", onAction: dismissInsufficient },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {featureLabel ? (
            <Text as="p">
              <strong>{featureLabel}</strong> requires{" "}
              <strong>{formatCredits(required)}</strong>, but your wallet only
              has <strong>{formatCredits(balance)}</strong>.
            </Text>
          ) : (
            <Text as="p">{message}</Text>
          )}

          {shortfall > 0 && (
            <Text as="p" tone="subdued">
              You're short by <strong>{formatCredits(shortfall)}</strong>.
              Top up with a one-time credit pack — credits never expire and
              accumulate across purchases.
            </Text>
          )}

          <InlineStack gap="200">
            <Text as="span" tone="subdued">
              Smallest pack: <strong>600 credits for $20.00</strong>.
            </Text>
          </InlineStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
