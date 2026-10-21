import { useState, useCallback } from "react";
import {
  BlockStack,
  Card,
  Collapsible,
  Box,
  InlineStack,
  Text,
  Icon,
} from "@shopify/polaris";
import { ChevronDownIcon } from "@shopify/polaris-icons";

const triggerBase = {
  width: "100%",
  textAlign: "left",
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  cursor: "pointer",
  color: "inherit",
  font: "inherit",
  display: "block",
};

/**
 * @param {{ id: string, question: import('react').ReactNode, answer: import('react').ReactNode }[]} items
 * @param {{ maxWidth?: string }} [layout]
 */
export function FaqAccordionList({ items, layout: { maxWidth = "860px" } = {} }) {
  const [openId, setOpenId] = useState(null);

  const toggle = useCallback((id) => {
    setOpenId((cur) => (cur === id ? null : id));
  }, []);

  return (
    <div style={{ maxWidth, margin: "0 auto", width: "100%" }}>
      <BlockStack gap="200">
        {items.map((item) => {
          const isOpen = openId === item.id;
          const panelId = `faq-panel-${item.id}`;
          return (
            <Card key={item.id} padding="0" roundedAbove="sm">
              <div style={{ overflow: "hidden" }}>
                <button
                  type="button"
                  id={`faq-button-${item.id}`}
                  className="pf-faq-item"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(item.id)}
                  style={triggerBase}
                >
                  <Box padding="400">
                    <InlineStack align="space-between" blockAlign="center" wrap={false}>
                      <Text as="span" variant="bodyMd" fontWeight="semibold" breakWord>
                        {item.question}
                      </Text>
                      <span
                        aria-hidden
                        style={{
                          flexShrink: 0,
                          marginLeft: "12px",
                          display: "flex",
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform 200ms ease",
                        }}
                      >
                        <Icon source={ChevronDownIcon} tone="subdued" />
                      </span>
                    </InlineStack>
                  </Box>
                </button>
                <Collapsible
                  id={panelId}
                  open={isOpen}
                  transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
                >
                  <Box
                    paddingBlockStart="0"
                    paddingBlockEnd="400"
                    paddingInlineStart="400"
                    paddingInlineEnd="400"
                  >
                    <div style={{ whiteSpace: "pre-line" }} className="pf-faq-answer">
                      {typeof item.answer === "string" ? (
                        <Text as="p" variant="bodyMd" tone="subdued" breakWord>
                          {item.answer}
                        </Text>
                      ) : (
                        <Text as="div" variant="bodyMd" tone="subdued" breakWord>
                          {item.answer}
                        </Text>
                      )}
                    </div>
                  </Box>
                </Collapsible>
              </div>
            </Card>
          );
        })}
      </BlockStack>
    </div>
  );
}
