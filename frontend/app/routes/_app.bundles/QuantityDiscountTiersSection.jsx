import { useState, useEffect } from "react";
import {
  Card,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Banner,
  Tooltip,
  Modal,
} from "@shopify/polaris";
import { GripVertical, X, Info } from "lucide-react";
import ArrowIcon from "../../components/icons/ArrowIcon";
import DuplicateIcon from "../../components/icons/DuplicateIcon";
import EyeIcon from "../../components/icons/EyeIcon";
import EyeOffIcon from "../../components/icons/EyeOffIcon";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DISCOUNT_TYPES = {
  PERCENTAGE: "percentage",
  FLAT: "flat",
  BOGO: "bogo",
};

const DISCOUNT_TYPE_LABELS = {
  [DISCOUNT_TYPES.PERCENTAGE]: "% Off",
  [DISCOUNT_TYPES.FLAT]: "Flat",
  [DISCOUNT_TYPES.BOGO]: "BOGO",
};

function flatAmountBadgeText(amount, isTier1) {
  const rounded = Math.round(Number(amount) * 100) / 100;
  if (isTier1 && rounded === 0) return "Standard Price";
  return `Flat $${rounded.toFixed(2)} off`;
}

function FlatAmountField({
  tier,
  index,
  isTier1,
  productPrice,
  onCommit,
}) {
  const committedAmount = tier.flatAmount ?? tier.discountValue ?? 0;
  const [draft, setDraft] = useState(String(committedAmount));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraft(String(committedAmount));
    }
  }, [committedAmount, isFocused]);

  const parsedDraft =
    draft === "" || draft === "." ? null : parseFloat(draft);
  const tierQuantity = tier.quantity ?? (isTier1 ? 1 : index + 1);
  const enforcePriceCap = tierQuantity === 1;
  const priceCap =
    enforcePriceCap &&
    productPrice != null &&
    Number.isFinite(Number(productPrice)) &&
    Number(productPrice) > 0
      ? Number(productPrice)
      : null;
  const exceedsPrice =
    priceCap != null &&
    parsedDraft != null &&
    !Number.isNaN(parsedDraft) &&
    parsedDraft > priceCap;

  const commitValue = (raw) => {
    if (raw === "" || raw === "." || raw === null || raw === undefined) {
      onCommit(index, 0, isTier1);
      setDraft("0");
      return;
    }
    const num = parseFloat(raw);
    if (Number.isNaN(num) || num < 0) {
      setDraft(String(committedAmount));
      return;
    }
    const rounded = Math.round(num * 100) / 100;
    onCommit(index, rounded, isTier1);
    setDraft(String(rounded));
  };

  return (
    <TextField
      label="Flat Discount Amount"
      type="number"
      value={draft}
      onChange={(value) => {
        if (value === "" || value === null || value === undefined) {
          setDraft("");
          return;
        }
        if (/^\d*\.?\d{0,2}$/.test(value)) {
          setDraft(value);
        }
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        commitValue(draft);
      }}
      min="0"
      step="0.01"
      prefix="$"
      autoComplete="off"
      error={
        exceedsPrice
          ? `Cannot exceed product price ($${priceCap.toFixed(2)})`
          : undefined
      }
      helpText={
        priceCap != null && !exceedsPrice
          ? `Max: $${priceCap.toFixed(2)} (product price)`
          : undefined
      }
    />
  );
}

// Sortable Tier Item Component
function SortableTierItem({ tier, index, expandedTiers, toggleTierExpansion, handleBulkUpdate, handleMostPopularToggle, duplicateTier, onRemove, onRequestRemove, quantityDiscountTiers, DISCOUNT_TYPES, DISCOUNT_TYPE_LABELS, getDiscountDisplayText, generalDiscountType, maxTiers = 10, allowFlatDiscount = true, productPrice = null, calculateBogoPercentage }) {
  const isTier1 = index === 0; // Tier 1 is identified by position, not quantity

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `tier-${index}`,
    disabled: isTier1, // Disable dragging for Tier 1
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const tierState = expandedTiers[index];
  const isExpanded = tierState !== false; // Expanded by default so tier options are visible
  const discountType = generalDiscountType || tier.discountType || DISCOUNT_TYPES.PERCENTAGE;
  const tierTitle = tier.title || `Buy ${tier.quantity || (isTier1 ? 1 : 2)}`;

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card background="bg-surface-secondary">
        <BlockStack gap="400">
          {/* Tier Header */}
          <InlineStack gap="300" align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              {!isTier1 && (
                <Box
                  className="cursor-grab active:cursor-grabbing text-gray-500 flex items-center hover:text-gray-700 transition-colors select-none"
                  {...attributes}
                  {...listeners}
                  title="Drag to reorder tiers"
                >
                  <GripVertical size={14} strokeWidth={2} />
                </Box>
              )}
              {isTier1 && (
                <Box className="w-[14px]" />
              )}
              <Text variant="bodyMd" fontWeight="semibold">
                Tier {index + 1}:
              </Text>
              <Box minWidth="200px" maxWidth="300px">
                <TextField
                  label=""
                  labelHidden
                  value={tierTitle}
                  onChange={(value) => {
                    const limitedValue = isTier1 ? value.slice(0, 30) : value;
                    handleBulkUpdate(index, { title: limitedValue });
                  }}
                  placeholder={`Buy ${tier.quantity || (isTier1 ? 1 : 2)}`}
                  autoComplete="off"
                />
              </Box>
              {isTier1 && (
                <Tooltip content="Tier 1 quantity is locked at 1 (standard pricing)">
                  <span className="flex items-center cursor-help">
                    <Info size={16} className="text-gray-500" />
                  </span>
                </Tooltip>
              )}
            </InlineStack>
            <InlineStack gap="100" blockAlign="center">
              {!isTier1 && (
                <Tooltip content={quantityDiscountTiers.length >= maxTiers ? "Maximum tiers reached" : "Duplicate tier"}>
                  <Button
                    variant="plain"
                    size="micro"
                    onClick={() => duplicateTier(index)}
                    accessibilityLabel="Duplicate tier"
                    disabled={quantityDiscountTiers.length >= maxTiers}
                    className="p-1.5 hover:bg-gray-100 rounded"
                  >
                    <DuplicateIcon size={16} className={quantityDiscountTiers.length >= maxTiers ? "text-gray-300" : "text-gray-600"} />
                  </Button>
                </Tooltip>
              )}

              <Tooltip content={isExpanded ? "Collapse" : "Expand"}>
                <Button
                  variant="plain"
                  size="micro"
                  onClick={() => toggleTierExpansion(index)}
                  accessibilityLabel={isExpanded ? "Collapse" : "Expand"}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  <ArrowIcon
                    size={16}
                    rotation={isExpanded ? -90 : 90}
                    className="text-gray-600"
                  />
                </Button>
              </Tooltip>
              {quantityDiscountTiers.length > 1 && !isTier1 && (
                <Tooltip content="Remove tier">
                  <Button
                    variant="plain"
                    size="micro"
                    tone="critical"
                    onClick={() => {
                      if (onRequestRemove) {
                        onRequestRemove(index);
                      }
                    }}
                    accessibilityLabel="Remove tier"
                    className="p-1.5 hover:bg-red-50 rounded"
                  >
                    <X size={16} strokeWidth={2.5} className="text-red-600" />
                  </Button>
                </Tooltip>
              )}
            </InlineStack>
          </InlineStack>

          {isExpanded && (
            <BlockStack gap="400">
              {/* Discount Value Input */}
              <Box>
                {discountType === DISCOUNT_TYPES.PERCENTAGE ? (
                  <TextField
                    label="Discount in %"
                    type="number"
                    value={String(tier.discountPercentage !== undefined ? tier.discountPercentage : (tier.discountValue !== undefined ? tier.discountValue : (isTier1 ? 0 : 20)))}
                    onChange={(value) => {
                      const numValue = parseFloat(value) || 0;
                      const clampedValue = Math.min(100, Math.max(0, numValue));
                      const badgeText = isTier1 && clampedValue === 0 ? "Standard Price" : `${clampedValue}% OFF`;
                      handleBulkUpdate(index, { discountPercentage: clampedValue, discountValue: clampedValue, discountBadge: badgeText });
                    }}
                    min="0"
                    max="100"
                    step="0.01"
                    prefix="%"
                    autoComplete="off"
                  />
                ) : discountType === DISCOUNT_TYPES.FLAT ? (
                  <FlatAmountField
                    tier={tier}
                    index={index}
                    isTier1={isTier1}
                    productPrice={productPrice}
                    onCommit={(tierIndex, amount, tier1) => {
                      handleBulkUpdate(tierIndex, {
                        flatAmount: amount,
                        discountValue: amount,
                        discountBadge: flatAmountBadgeText(amount, tier1),
                      });
                    }}
                  />
                ) : discountType === DISCOUNT_TYPES.BOGO ? (
                  (() => {
                    // Calculate validation once for all fields
                    const buyX = tier.buyX !== undefined ? tier.buyX : (isTier1 ? 1 : 1);
                    const getYFree = tier.getYFree !== undefined ? tier.getYFree : (isTier1 ? 0 : 1);
                    const currentTotalQuantity = buyX + getYFree;
                    const previousTier = index > 0 ? quantityDiscountTiers[index - 1] : null;
                    // For BOGO, calculate previous tier's total quantity from buyX + getYFree
                    let previousQuantity = 1;
                    if (previousTier) {
                      if (previousTier.discountType === DISCOUNT_TYPES.BOGO || generalDiscountType === DISCOUNT_TYPES.BOGO) {
                        const prevBuyX = previousTier.buyX !== undefined ? previousTier.buyX : (index === 1 ? 1 : 1);
                        const prevGetYFree = previousTier.getYFree !== undefined ? previousTier.getYFree : (index === 1 ? 0 : 1);
                        previousQuantity = prevBuyX + prevGetYFree;
                      } else {
                        previousQuantity = previousTier.quantity || 1;
                      }
                    }
                    const hasQuantityError = !isTier1 && index > 0 && currentTotalQuantity <= previousQuantity;
                    const previousTierNumber = index;
                    const hasGetYFreeError = tier.getYFree !== undefined && tier.buyX !== undefined && tier.getYFree > tier.buyX * 5;
                    const hasGetYFreeMaxError = tier.getYFree !== undefined && tier.getYFree > 10;
                    const quantityErrorText = hasQuantityError ? `Total quantity must be greater than Tier ${previousTierNumber} (${previousQuantity})` : null;
                    const getYFreeErrorText = hasGetYFreeError ? `Get quantity cannot exceed buy quantity by more than 5x` : hasGetYFreeMaxError ? "Get Y Free cannot exceed 10" : null;

                    return (
                      <BlockStack gap="300">
                        <InlineStack gap="200" blockAlign="center">
                          <Box minWidth="0" maxWidth="120px" flex="0 0 auto">
                            <TextField
                              label="Buy X"
                              type="number"
                              value={String(buyX)}
                              onChange={(value) => {
                                // Allow empty string for typing, but don't update state
                                if (value === "" || value === null || value === undefined) {
                                  return;
                                }

                                const numValue = parseInt(value, 10);

                                // Only update if we have a valid number >= 1
                                if (isNaN(numValue) || numValue < 1) {
                                  return;
                                }

                                const newBuyX = Math.max(1, numValue);
                                const currentGetYFree = tier.getYFree !== undefined ? tier.getYFree : (isTier1 ? 0 : 1);
                                const totalQuantity = newBuyX + currentGetYFree;
                                let badgeText, titleText;
                                if (currentGetYFree === 0) {
                                  badgeText = isTier1 ? "Standard Price" : `Buy ${newBuyX}`;
                                  titleText = `Buy ${newBuyX}`;
                                } else {
                                  const percentage = calculateBogoPercentage(newBuyX, currentGetYFree);
                                  badgeText = `${percentage}% OFF`;
                                  titleText = `Buy ${newBuyX} Get ${currentGetYFree} Free!`;
                                }
                                handleBulkUpdate(index, {
                                  buyX: newBuyX,
                                  quantity: totalQuantity,
                                  discountBadge: badgeText,
                                  title: titleText,
                                });
                              }}
                              min="1"
                              autoComplete="off"
                            />
                          </Box>
                          <Box paddingBlockStart="400">
                            <Text variant="bodyMd" as="span">+</Text>
                          </Box>
                          <Box minWidth="0" flex="1">
                            <TextField
                              label="Get Y Free"
                              type="number"
                              value={String(getYFree)}
                              onChange={(value) => {
                                // Parse the value, defaulting to current or 0 if empty or invalid
                                const numValue = value === "" || value === null || value === undefined
                                  ? (tier.getYFree !== undefined ? tier.getYFree : 0)
                                  : parseInt(value, 10);

                                if (isNaN(numValue) || numValue < 0) {
                                  return;
                                }

                                const newGetYFree = Math.max(0, Math.min(10, numValue));
                                const currentBuyX = tier.buyX !== undefined ? tier.buyX : (isTier1 ? 1 : 1);
                                // Allow update even if exceeds limit - error will be shown
                                const totalQuantity = currentBuyX + newGetYFree;
                                let badgeText, titleText;
                                if (newGetYFree === 0) {
                                  badgeText = isTier1 ? "Standard Price" : `Buy ${currentBuyX}`;
                                  titleText = `Buy ${currentBuyX}`;
                                } else {
                                  const percentage = calculateBogoPercentage(currentBuyX, newGetYFree);
                                  badgeText = `${percentage}% OFF`;
                                  titleText = `Buy ${currentBuyX} Get ${newGetYFree} Free!`;
                                }
                                handleBulkUpdate(index, {
                                  getYFree: newGetYFree,
                                  quantity: totalQuantity,
                                  discountBadge: badgeText,
                                  title: titleText,
                                });
                              }}
                              min="0"
                              max="10"
                              autoComplete="off"
                              helpText={hasGetYFreeError ? `Maximum: ${tier.buyX * 5} (5x buy quantity)` : hasGetYFreeMaxError ? "Maximum: 10" : undefined}
                            />
                          </Box>
                          <Box paddingBlockStart="400">
                            <Text variant="bodyMd" as="span">=</Text>
                          </Box>
                          <Box minWidth="0" maxWidth="120px" flex="0 0 auto">
                            <TextField
                              label="Total Quantity"
                              type="number"
                              value={String(currentTotalQuantity)}
                              readOnly
                              autoComplete="off"
                            />
                          </Box>
                        </InlineStack>
                        {/* Single error message below all fields */}
                        {(quantityErrorText || getYFreeErrorText) && (
                          <Box>
                            <Text variant="bodySm" tone="critical" as="p">
                              {quantityErrorText || getYFreeErrorText}
                            </Text>
                          </Box>
                        )}
                      </BlockStack>
                    );
                  })()
                ) : null}
              </Box>

              {/* Quantity Input - Only show if not BOGO (BOGO calculates quantity automatically) */}
              {discountType !== DISCOUNT_TYPES.BOGO && (() => {
                const previousTier = index > 0 ? quantityDiscountTiers[index - 1] : null;
                const previousQuantity = previousTier?.quantity || 1;
                const currentQuantity = tier.quantity || (isTier1 ? 1 : 2);
                const hasQuantityError = !isTier1 && index > 0 && currentQuantity <= previousQuantity;
                // Previous tier display number calculation:
                // - If we're on Tier 3 (index=2), previous tier is at index=1 (Tier 2)
                // - Previous tier's display number = (index - 1) + 1 = index
                // - So previousTierNumber = index gives us the correct previous tier number
                // Example: Tier 3 (index=2) -> previous is Tier 2, so previousTierNumber = 2
                const previousTierNumber = index; // Previous tier display number (Tier 2 when index=1, Tier 3 when index=2, etc.)

                return (
                  <TextField
                    label="Total Quantity"
                    type="number"
                    value={String(currentQuantity)}
                    onChange={(value) => {
                      const numValue = parseInt(value, 10);
                      if (!value || Number.isNaN(numValue) || numValue < 1) return;
                      const nextQuantity = Math.max(1, numValue);
                      const previousQuantityLabel = `Buy ${tier.quantity || (isTier1 ? 1 : 2)}`;
                      const updates = { quantity: nextQuantity };
                      if (!tier.title || tier.title === previousQuantityLabel || tier.title === "Buy 1") {
                        updates.title = `Buy ${nextQuantity}`;
                      }
                      handleBulkUpdate(index, updates);
                    }}
                    min="1"
                    autoComplete="off"
                    error={hasQuantityError ? `Quantity must be greater than Tier ${previousTierNumber} Quantity:  (${previousQuantity})` : undefined}
                  />
                );
              })()}

              {/* Preview Fields */}
              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Box minWidth="0" flex="1">
                    <TextField
                      label="Discount Badge"
                      value={tier.discountBadge || (isTier1 ? "Standard Price" : getDiscountDisplayText(tier))}
                      onChange={(value) => {
                        const limitedValue = value.slice(0, 20);
                        handleBulkUpdate(index, { discountBadge: limitedValue });
                      }}
                      autoComplete="off"
                      maxLength={20}
                      error={(tier.discountBadge || (isTier1 ? "Standard Price" : getDiscountDisplayText(tier))).length >= 20 ? "Max limit reached (20 characters)" : undefined}
                    />
                  </Box>
                  <Box className="pt-8">
                    <Button
                      variant="plain"
                      size="micro"
                      onClick={() =>
                        handleBulkUpdate(
                          index,
                          { showDiscountBadge: tier.showDiscountBadge !== false ? false : true }
                        )
                      }
                      accessibilityLabel="Toggle discount badge visibility"
                      tone={tier.showDiscountBadge !== false ? "success" : "subdued"}
                      title={tier.showDiscountBadge !== false ? "Hide badge" : "Show badge"}
                      className={`p-2 rounded-full ${tier.showDiscountBadge !== false ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      {tier.showDiscountBadge !== false ? (
                        <EyeIcon size={18} className="text-gray-600" />
                      ) : (
                        <EyeOffIcon size={18} className="text-gray-400" />
                      )}
                    </Button>
                  </Box>
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Box minWidth="0" flex="1">
                    <TextField
                      label="Tier Badge"
                      value={tier.mostPopularText || "Most Popular"}
                      onChange={(value) => {
                        const limitedValue = value.slice(0, 20);
                        handleBulkUpdate(index, { mostPopularText: limitedValue });
                      }}
                      autoComplete="off"
                      maxLength={20}
                      error={(tier.mostPopularText || "Most Popular").length >= 20 ? "Max limit reached (20 characters)" : undefined}
                    />
                  </Box>
                  <Box className="pt-8">
                    <Button
                      variant="plain"
                      size="micro"
                      onClick={() => {
                        const currentValue = tier.showMostPopular;
                        const newValue = currentValue === false ? true : false;
                        handleBulkUpdate(index, { showMostPopular: newValue });
                      }}
                      accessibilityLabel="Toggle most popular badge visibility"
                      tone={tier.showMostPopular !== false ? "success" : "subdued"}
                      title={tier.showMostPopular !== false ? "Hide badge" : "Show badge"}
                      className={` p-2 rounded-full ${tier.showMostPopular !== false ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                    >
                      {tier.showMostPopular !== false ? (
                        <EyeIcon size={18} className="text-gray-600" />
                      ) : (
                        <EyeOffIcon size={18} className="text-gray-400" />
                      )}
                    </Button>
                  </Box>
                </InlineStack>

                {/* You save line */}
                <InlineStack gap="200" blockAlign="center" align="space-between">
                  <Text variant="bodyMd" as="span">
                    Show “You save $X”
                  </Text>
                  <Button
                    variant="plain"
                    size="micro"
                    onClick={() =>
                      handleBulkUpdate(index, {
                        showSavings: tier.showSavings === false,
                      })
                    }
                    accessibilityLabel="Toggle savings line"
                    title={tier.showSavings !== false ? "Hide savings" : "Show savings"}
                    className={`p-2 rounded-full ${tier.showSavings !== false ? "bg-green-50 hover:bg-green-100" : "bg-gray-50 hover:bg-gray-100"}`}
                  >
                    {tier.showSavings !== false ? (
                      <EyeIcon size={18} className="text-gray-600" />
                    ) : (
                      <EyeOffIcon size={18} className="text-gray-400" />
                    )}
                  </Button>
                </InlineStack>

                {/* Limited offer countdown */}
                <InlineStack gap="200" blockAlign="center" align="space-between">
                  <Text variant="bodyMd" as="span">
                    Limited-time offer
                  </Text>
                  <Button
                    variant="plain"
                    size="micro"
                    onClick={() =>
                      handleBulkUpdate(index, {
                        limitedOfferEnabled: !tier.limitedOfferEnabled,
                        limitedOfferEndsAt:
                          !tier.limitedOfferEnabled && !tier.limitedOfferEndsAt
                            ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
                            : tier.limitedOfferEndsAt,
                      })
                    }
                    accessibilityLabel="Toggle limited offer"
                    className={`p-2 rounded-full ${tier.limitedOfferEnabled ? "bg-green-50 hover:bg-green-100" : "bg-gray-50 hover:bg-gray-100"}`}
                  >
                    {tier.limitedOfferEnabled ? (
                      <EyeIcon size={18} className="text-gray-600" />
                    ) : (
                      <EyeOffIcon size={18} className="text-gray-400" />
                    )}
                  </Button>
                </InlineStack>
                {tier.limitedOfferEnabled && (
                  <BlockStack gap="200">
                    <TextField
                      label="Badge label"
                      value={tier.limitedOfferLabel || "Limited offer"}
                      onChange={(value) =>
                        handleBulkUpdate(index, {
                          limitedOfferLabel: value.slice(0, 24),
                        })
                      }
                      maxLength={24}
                      autoComplete="off"
                    />
                    <TextField
                      label="Ends at"
                      type="datetime-local"
                      value={
                        tier.limitedOfferEndsAt
                          ? (() => {
                              try {
                                const d = new Date(tier.limitedOfferEndsAt);
                                if (Number.isNaN(d.getTime())) return "";
                                const pad = (n) => String(n).padStart(2, "0");
                                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                              } catch {
                                return "";
                              }
                            })()
                          : ""
                      }
                      onChange={(value) => {
                        if (!value) {
                          handleBulkUpdate(index, { limitedOfferEndsAt: null });
                          return;
                        }
                        const d = new Date(value);
                        handleBulkUpdate(index, {
                          limitedOfferEndsAt: Number.isNaN(d.getTime())
                            ? null
                            : d.toISOString(),
                        });
                      }}
                      autoComplete="off"
                    />
                  </BlockStack>
                )}
              </BlockStack>
            </BlockStack>
          )}
        </BlockStack>
      </Card>
    </div>
  );
}

export default function QuantityDiscountTiersSection({
  quantityDiscountTiers,
  sectionHeader,
  generalDiscountType = "percentage",
  allowFlatDiscount = true,
  productPrice = null,
  onAdd,
  onRemove,
  onUpdate,
  onDuplicate,
  onReorder,
  onSectionHeaderChange,
}) {
  const [expandedTiers, setExpandedTiers] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [tierToRemoveIndex, setTierToRemoveIndex] = useState(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleTierExpansion = (index) => {
    setExpandedTiers((prev) => {
      // Expanded by default (undefined = expanded). Explicit false = collapsed.
      const isCurrentlyExpanded = prev[index] !== false;

      return {
        ...prev,
        [index]: !isCurrentlyExpanded,
      };
    });
  };

  const handleBulkUpdate = (index, updates) => {
    // Update single field - pass as object
    onUpdate(index, updates);
  };

  const handleMostPopularToggle = (index) => {
    const tier = quantityDiscountTiers[index];
    const newIsMostPopular = !tier.isMostPopular;

    // If marking as most popular, unmark all other tiers
    if (newIsMostPopular) {
      // First, unmark all other tiers
      quantityDiscountTiers.forEach((t, i) => {
        if (i !== index && t.isMostPopular) {
          onUpdate(i, { isMostPopular: false });
        }
      });
      // Then mark the selected tier as most popular
      onUpdate(index, { isMostPopular: true });
    } else {
      // Just unmark this tier
      onUpdate(index, { isMostPopular: false });
    }
  };

  const duplicateTier = (index) => {
    // Prevent duplication if at maximum limit
    if (quantityDiscountTiers.length >= 10) {
      return;
    }

    if (onDuplicate) {
      onDuplicate(index);
    } else {
      const tier = { ...quantityDiscountTiers[index] };
      const newTier = {
        ...tier,
        quantity: (tier.quantity || 2) + 1,
        title: `${tier.title || `Buy ${tier.quantity || 2}`} (Copy)`,
        isMostPopular: false,
        showMostPopular: false,
      };
      onAdd();
      setTimeout(() => {
        const lastIndex = quantityDiscountTiers.length;
        Object.keys(newTier).forEach((key) => {
          if (key !== "quantity") {
            handleBulkUpdate(lastIndex, { [key]: newTier[key] });
          }
        });
        handleBulkUpdate(lastIndex, { quantity: newTier.quantity });
      }, 50);
    }
  };

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    // Extract indices from IDs
    const activeIndex = parseInt(active.id.replace('tier-', ''));
    const overIndex = parseInt(over.id.replace('tier-', ''));

    if (activeIndex === overIndex) {
      setActiveId(null);
      return;
    }

    // Reorder tiers
    const newTiers = arrayMove(quantityDiscountTiers, activeIndex, overIndex);

    // Update expandedTiers to match new order
    const newExpandedTiers = {};
    newTiers.forEach((tier, newIndex) => {
      const oldIndex = quantityDiscountTiers.findIndex((oldTier) => oldTier === tier);
      if (oldIndex !== -1 && expandedTiers[oldIndex] !== undefined) {
        newExpandedTiers[newIndex] = expandedTiers[oldIndex];
      }
    });
    setExpandedTiers(newExpandedTiers);

    // If onReorder callback is provided, use it (more efficient)
    if (onReorder) {
      onReorder(activeIndex, overIndex);
    } else {
      // Fallback: update each tier in the new order
      newTiers.forEach((tier, newIndex) => {
        onUpdate(newIndex, { ...tier });
      });
    }

    setActiveId(null);
  };

  // Get active tier for drag overlay
  const activeTier = activeId
    ? quantityDiscountTiers[parseInt(activeId.replace('tier-', ''))]
    : null;

  const calculateBogoPercentage = (buyX, getYFree) => {
    if (getYFree === 0) return 0;
    const totalItems = buyX + getYFree;
    const percentage = (getYFree / totalItems) * 100;
    // Round to nearest integer, or 1 decimal if needed
    return Math.round(percentage * 10) / 10;
  };

  const handleRequestRemove = (index) => {
    setTierToRemoveIndex(index);
  };

  const handleConfirmRemove = () => {
    if (tierToRemoveIndex !== null) {
      onRemove(tierToRemoveIndex);
      setTierToRemoveIndex(null);
    }
  };

  const handleCancelRemove = () => {
    setTierToRemoveIndex(null);
  };

  const getDiscountDisplayText = (tier) => {
    const discountType = tier.discountType || DISCOUNT_TYPES.PERCENTAGE;
    const discountValue = tier.discountValue !== undefined ? tier.discountValue : (tier.discountPercentage || 0);

    switch (discountType) {
      case DISCOUNT_TYPES.PERCENTAGE:
        return `${discountValue}% OFF`;
      case DISCOUNT_TYPES.FLAT:
        return `Flat $${Number(discountValue).toFixed(2)} off`;
      case DISCOUNT_TYPES.BOGO:
        const buyX = tier.buyX !== undefined ? tier.buyX : 1;
        const getYFree = tier.getYFree !== undefined ? tier.getYFree : 1;
        if (getYFree === 0) {
          return "Standard Price";
        }
        const percentage = calculateBogoPercentage(buyX, getYFree);
        return `${percentage}% OFF`;
      default:
        return `${discountValue}% OFF`;
    }
  };

  const calculatePreviewPrice = (tier, basePrice = 20) => {
    const discountType = tier.discountType || DISCOUNT_TYPES.PERCENTAGE;
    const quantity = tier.quantity || 2;
    const discountValue = tier.discountValue !== undefined ? tier.discountValue : (tier.discountPercentage || 0);
    const originalTotal = basePrice * quantity;

    switch (discountType) {
      case DISCOUNT_TYPES.PERCENTAGE:
        const discountAmount = originalTotal * (discountValue / 100);
        return originalTotal - discountAmount;
      case DISCOUNT_TYPES.FLAT:
        return Math.max(0, originalTotal - discountValue);
      case DISCOUNT_TYPES.BOGO:
        const buyX = tier.buyX !== undefined ? tier.buyX : 1;
        const getYFree = tier.getYFree !== undefined ? tier.getYFree : 1;
        // Customer pays for buyX items, gets getYFree items free
        return basePrice * buyX;
      default:
        return originalTotal;
    }
  };

  return (
    <Card roundedAbove="sm" padding="0">
      <Box background="bg-surface" padding="400">
      <BlockStack gap="500">
        {/* Section Header Card */}

        <BlockStack gap="400">
          <Text variant="headingMd" as="h3" fontWeight="semibold">
            Section Header
          </Text>
          <TextField
            label="Section Header Text"
            value={sectionHeader}
            onChange={(value) => {
              if (onSectionHeaderChange) {
                const limitedValue = value.slice(0, 50);
                onSectionHeaderChange(limitedValue);
              }
            }}
            // placeholder="Buy More Save More"
            autoComplete="off"
            // helpText="This text will appear as the header above the bundle options (50 char limit)"
            maxLength={50}
            error={(sectionHeader || "").length >= 50 ? "Max limit reached (50 characters)" : undefined}
          />
        </BlockStack>


        <InlineStack gap="300" align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Text variant="headingMd" as="h3" fontWeight="semibold">
              Edit Tier Deals
            </Text>
            <Text variant="bodySm" tone="subdued" as="span">
              ({quantityDiscountTiers.length}/10 tiers)
            </Text>
          </InlineStack>
        </InlineStack>
        <Text variant="bodySm" tone="subdued" as="p">
          Per tier: savings line and limited offer.
        </Text>

        {quantityDiscountTiers.length >= 10 && (
          <Banner status="warning" title="Maximum tiers reached">
            You have reached the maximum limit of 10 tiers. Remove a tier to add a new one.
          </Banner>
        )}

        {quantityDiscountTiers.length === 0 ? (
          <Banner status="info">
            No discount tiers added. Click "Add Tier" to create your first tier.
          </Banner>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={quantityDiscountTiers.map((_, index) => `tier-${index}`)}
              strategy={verticalListSortingStrategy}
            >
              <BlockStack gap="100">
                {quantityDiscountTiers.map((tier, index) => (
                  <SortableTierItem
                    key={`tier-${index}`}

                    tier={tier}
                    index={index}
                    expandedTiers={expandedTiers}
                    toggleTierExpansion={toggleTierExpansion}
                    handleBulkUpdate={handleBulkUpdate}
                    handleMostPopularToggle={handleMostPopularToggle}
                    duplicateTier={duplicateTier}
                    onRemove={onRemove}
                    onRequestRemove={handleRequestRemove}
                    quantityDiscountTiers={quantityDiscountTiers}
                    DISCOUNT_TYPES={DISCOUNT_TYPES}
                    DISCOUNT_TYPE_LABELS={DISCOUNT_TYPE_LABELS}
                    getDiscountDisplayText={getDiscountDisplayText}
                    generalDiscountType={generalDiscountType}
                    maxTiers={10}
                    allowFlatDiscount={allowFlatDiscount}
                    productPrice={productPrice}
                    calculateBogoPercentage={calculateBogoPercentage}
                  />
                ))}
              </BlockStack>
            </SortableContext>
            <DragOverlay>
              {activeId && activeTier ? (
                <div className="opacity-50">
                  <Card>
                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="center">
                        <Box className="cursor-grab text-gray-500 flex items-center">
                          <GripVertical size={14} strokeWidth={2} />
                        </Box>
                        <Text variant="bodyMd" fontWeight="semibold">
                          Tier {parseInt(activeId.replace('tier-', '')) + 1}: {activeTier.title || `Buy ${activeTier.quantity || 2}`}
                        </Text>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Add Tier Button - Below tiers list */}
        {/* {quantityDiscountTiers.length > 0 && (
          <Box paddingBlockStart="200">
            <Button
              onClick={onAdd}
              variant="secondary"
              size="medium"
              disabled={quantityDiscountTiers.length >= 10}
              fullWidth
            >
              + Add Tier
            </Button>
          </Box>
        )} */}
      </BlockStack>
      {quantityDiscountTiers.length > 0 && (
        <Box paddingBlockStart="200">
          <Button
            onClick={onAdd}
            variant="secondary"
            size="medium"
            disabled={quantityDiscountTiers.length >= 10}
            fullWidth
          >
            + Add Tier
          </Button>
        </Box>
      )}
      {/* Remove Tier Confirmation Modal */}
      <Modal
        open={tierToRemoveIndex !== null}
        onClose={handleCancelRemove}
        title="Remove Tier"
        primaryAction={{
          content: "Remove",
          onAction: handleConfirmRemove,
          destructive: true,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCancelRemove,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" variant="bodyMd">
              Are you sure you want to remove Tier {tierToRemoveIndex !== null ? tierToRemoveIndex + 1 : ''}?
            </Text>
            <Text as="p" variant="bodyMd" tone="critical">
              <strong>Warning:</strong> This action cannot be undone. The tier will be permanently removed.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
      </Box>
    </Card>
  );
}
