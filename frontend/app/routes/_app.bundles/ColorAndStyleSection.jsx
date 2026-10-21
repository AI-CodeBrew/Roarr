import { useState, useEffect } from "react";
import {
  Button,
  BlockStack,
  InlineStack,
  Text,
  Box,
  RangeSlider,
  TextField,
} from "@shopify/polaris";
import ArrowIcon from "../../components/icons/ArrowIcon";

const COLOR_PALETTES = [
  { name: "Classic Blue", value: "#2563EB", rgb: "37, 99, 235", primary: "#2563EB", secondary: "#DBEAFE" },
  { name: "Forest Green", value: "#059669", rgb: "5, 150, 105", primary: "#059669", secondary: "#D1FAE5" },
  { name: "Sunset Orange", value: "#EA580C", rgb: "234, 88, 12", primary: "#EA580C", secondary: "#FED7AA" },
  { name: "Royal Purple", value: "#7C3AED", rgb: "124, 58, 237", primary: "#7C3AED", secondary: "#EDE9FE" },
];

const MOST_POPULAR_BADGE_COLORS = [
  { name: "Blue", value: "#3B82F6", rgb: "59, 130, 246" },
  { name: "Green", value: "#10B981", rgb: "16, 185, 129" },
  { name: "Purple", value: "#A855F7", rgb: "168, 85, 247" },
  { name: "Yellow", value: "#F59E0B", rgb: "245, 158, 11" },
];

const LIMITED_OFFER_BADGE_COLORS = [
  { name: "Charcoal", value: "#111827", rgb: "17, 24, 39" },
  { name: "Red", value: "#DC2626", rgb: "220, 38, 38" },
  { name: "Orange", value: "#EA580C", rgb: "234, 88, 12" },
  { name: "Black", value: "#000000", rgb: "0, 0, 0" },
];

const TIER_NAME_COLORS = [
  { name: "Charcoal", value: "#333333", rgb: "51, 51, 51" },
  { name: "Black", value: "#111827", rgb: "17, 24, 39" },
  { name: "Slate", value: "#475569", rgb: "71, 85, 105" },
  { name: "Navy", value: "#1E3A8A", rgb: "30, 58, 138" },
];

const TIER_CARD_FILL_COLORS = [
  { name: "White", value: "#FFFFFF", rgb: "255, 255, 255" },
  { name: "Soft Gray", value: "#F3F4F6", rgb: "243, 244, 246" },
  { name: "Soft Blue", value: "#EFF6FF", rgb: "239, 246, 255" },
  { name: "Soft Cream", value: "#FFF7ED", rgb: "255, 247, 237" },
];

function normalizeHexColor(raw) {
  if (typeof raw !== "string") return null;
  let hex = raw.trim();
  if (!hex) return null;
  if (!hex.startsWith("#")) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const short = hex.slice(1);
    hex = `#${short.split("").map((c) => c + c).join("")}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return hex.toUpperCase();
}

function hexToRgbString(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  const raw = normalized.replace(/^#/, "");
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function lightenHex(hex, amount = 0.75) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return "#DBEAFE";
  const raw = normalized.replace(/^#/, "");
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const mix = (channel) =>
    Math.round(channel + (255 - channel) * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`.toUpperCase();
}

function CustomHexColorInput({
  value,
  onChange,
  placeholder = "#000000",
  compact = false,
}) {
  const [hexDraft, setHexDraft] = useState(value || "");

  useEffect(() => {
    setHexDraft(value || "");
  }, [value]);

  const commitHex = (input) => {
    const normalized = normalizeHexColor(input);
    if (!normalized) return;
    setHexDraft(normalized);
    onChange(normalized);
  };

  const handleHexChange = (input) => {
    let next = input.trim();
    if (next && !next.startsWith("#")) next = `#${next}`;
    const upper = next.toUpperCase();
    if (/^#[0-9A-F]{0,6}$/.test(upper) || upper === "") {
      setHexDraft(upper);
      if (/^#[0-9A-F]{6}$/.test(upper)) {
        onChange(upper);
      }
    }
  };

  const previewColor = normalizeHexColor(hexDraft || value) || "#CCCCCC";

  return (
    <InlineStack gap="200" blockAlign="center" wrap={false}>
      {!compact && (
        <Box
          style={{
            width: "48px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            backgroundColor: previewColor,
            flexShrink: 0,
          }}
        />
      )}
      <Box
        minWidth={compact ? "96px" : "140px"}
        maxWidth={compact ? "110px" : undefined}
        style={{ flex: compact ? "0 0 auto" : "1 1 auto" }}
      >
        <TextField
          label="Custom hex color"
          labelHidden
          value={hexDraft}
          onChange={handleHexChange}
          onBlur={() => commitHex(hexDraft)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </Box>
    </InlineStack>
  );
}

export default function ColorAndStyleSection({
  styleSettings,
  onStyleChange,
}) {
  const [isAppearanceExpanded, setIsAppearanceExpanded] = useState(false);
  const handleColorSelect = (color) => {
    onStyleChange({
      ...(styleSettings || {}),
      primaryColor: color.value,
      primaryColorRgb: color.rgb,
    });
  };

  const handleCustomPrimaryColorChange = (hex) => {
    const rgb = hexToRgbString(hex);
    if (!rgb) return;
    onStyleChange({
      ...(styleSettings || {}),
      primaryColor: hex,
      primaryColorRgb: rgb,
    });
  };

  const handleCornerRoundnessChange = (value) => {
    onStyleChange({
      ...(styleSettings || {}),
      cornerRoundness: value,
    });
  };

  const handleBreathingSpaceChange = (value) => {
    onStyleChange({
      ...(styleSettings || {}),
      breathingSpace: value,
    });
  };

  const handleMostPopularBadgeColorSelect = (color) => {
    onStyleChange({
      ...(styleSettings || {}),
      mostPopularBadgeColor: color.value,
      mostPopularBadgeColorRgb: color.rgb,
    });
  };

  const handleCustomBadgeColorChange = (hex) => {
    const rgb = hexToRgbString(hex);
    if (!rgb) return;
    onStyleChange({
      ...(styleSettings || {}),
      mostPopularBadgeColor: hex,
      mostPopularBadgeColorRgb: rgb,
    });
  };

  const handleLimitedOfferBadgeColorSelect = (color) => {
    onStyleChange({
      ...(styleSettings || {}),
      limitedOfferBadgeColor: color.value,
      limitedOfferBadgeColorRgb: color.rgb,
    });
  };

  const handleCustomLimitedOfferBadgeColorChange = (hex) => {
    const rgb = hexToRgbString(hex);
    if (!rgb) return;
    onStyleChange({
      ...(styleSettings || {}),
      limitedOfferBadgeColor: hex,
      limitedOfferBadgeColorRgb: rgb,
    });
  };

  const handleTierNameColorSelect = (color) => {
    onStyleChange({
      ...(styleSettings || {}),
      tierNameColor: color.value,
      tierNameColorRgb: color.rgb,
    });
  };

  const handleCustomTierNameColorChange = (hex) => {
    const rgb = hexToRgbString(hex);
    if (!rgb) return;
    onStyleChange({
      ...(styleSettings || {}),
      tierNameColor: hex,
      tierNameColorRgb: rgb,
    });
  };

  const handleTierCardFillColorSelect = (color) => {
    onStyleChange({
      ...(styleSettings || {}),
      tierCardFillColor: color.value,
      tierCardFillColorRgb: color.rgb,
    });
  };

  const handleCustomTierCardFillColorChange = (hex) => {
    const rgb = hexToRgbString(hex);
    if (!rgb) return;
    onStyleChange({
      ...(styleSettings || {}),
      tierCardFillColor: hex,
      tierCardFillColorRgb: rgb,
    });
  };

  const resetToDefaults = () => {
    onStyleChange({
      cornerRoundness: 9,
      breathingSpace: 14,
      primaryColor: "#2563EB",
      primaryColorRgb: "37, 99, 235",
      mostPopularBadgeColor: "#F59E0B",
      mostPopularBadgeColorRgb: "245, 158, 11",
      limitedOfferBadgeColor: "#111827",
      limitedOfferBadgeColorRgb: "17, 24, 39",
      tierNameColor: "#333333",
      tierNameColorRgb: "51, 51, 51",
      tierCardFillColor: "#FFFFFF",
      tierCardFillColorRgb: "255, 255, 255",
    });
  };

  const currentPrimaryColor = styleSettings?.primaryColor || "#2563EB";
  const currentBadgeColor = styleSettings?.mostPopularBadgeColor || "#F59E0B";
  const currentLimitedOfferBadgeColor =
    styleSettings?.limitedOfferBadgeColor || "#111827";
  const currentTierNameColor = styleSettings?.tierNameColor || "#333333";
  const currentTierCardFillColor =
    styleSettings?.tierCardFillColor || "#FFFFFF";
  const isPresetPrimarySelected = COLOR_PALETTES.some(
    (color) => color.value === currentPrimaryColor,
  );
  const isPresetBadgeSelected = MOST_POPULAR_BADGE_COLORS.some(
    (color) => color.value === currentBadgeColor,
  );
  const isPresetLimitedOfferBadgeSelected = LIMITED_OFFER_BADGE_COLORS.some(
    (color) => color.value === currentLimitedOfferBadgeColor,
  );
  const isPresetTierNameSelected = TIER_NAME_COLORS.some(
    (color) => color.value === currentTierNameColor,
  );
  const isPresetTierFillSelected = TIER_CARD_FILL_COLORS.some(
    (color) => color.value === currentTierCardFillColor,
  );

  return (
    <BlockStack gap="500">
      <Box
        background="bg-surface"
        borderWidth="025"
        borderColor="border"
        borderRadius="300"
        padding="400"
      >
        {/* Appearance Settings Accordion Header */}
        <Box
          onClick={() => setIsAppearanceExpanded(!isAppearanceExpanded)}
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsAppearanceExpanded(!isAppearanceExpanded);
            }
          }}
        >
          <InlineStack gap="200" align="space-between" blockAlign="center">
            <Text variant="headingMd" as="h3" fontWeight="semibold">
              Appearance Settings
            </Text>
            <InlineStack gap="200" blockAlign="center">
              <Box as="button"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetToDefaults();
                }}
                className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer border-none bg-transparent"
                style={{ fontSize: '14px' }}
              >
                <Box as="span" className="flex items-center justify-center" style={{ width: "16px", height: "16px" }}>
                  <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="48" height="48" fill="white" fillOpacity="0.01" />
                    <path d="M11.2721 36.7279C14.5294 39.9853 19.0294 42 24 42C33.9411 42 42 33.9411 42 24C42 14.0589 33.9411 6 24 6C19.0294 6 14.5294 8.01472 11.2721 11.2721C9.61407 12.9301 6 17 6 17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 9V17H14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Box>
                <span>Undo</span>
              </Box>
              <ArrowIcon
                size={16}
                rotation={isAppearanceExpanded ? -90 : 90}
                className="text-gray-600"
              />
            </InlineStack>
          </InlineStack>
        </Box>
        {isAppearanceExpanded && (
          <Box paddingBlockStart="400">
            <BlockStack gap="400">
              {/* Layout Settings */}
              <BlockStack gap="400">
                {/* Corner Roundness */}
                <BlockStack gap="200">
                  <InlineStack gap="200" align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <Box className="w-5 h-5 flex items-center justify-center">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          className="text-gray-600"
                        >
                          <rect
                            x="2"
                            y="2"
                            width="16"
                            height="16"
                            rx="3"
                            ry="3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </svg>
                      </Box>
                      <Text variant="bodySm" as="span">
                        All corner roundness
                      </Text>
                    </InlineStack>
                    <Text variant="bodySm" as="span" tone="subdued">
                      {styleSettings?.cornerRoundness || 9} / 50
                    </Text>
                  </InlineStack>
                  <Box paddingBlockStart="200">
                    <RangeSlider
                      label=""
                      labelHidden
                      value={styleSettings?.cornerRoundness || 9}
                      onChange={handleCornerRoundnessChange}
                      min={0}
                      max={50}
                    />
                  </Box>
                </BlockStack>

                {/* Breathing Space */}
                <BlockStack gap="200">
                  <InlineStack gap="200" align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <Box className="w-5 h-5 flex items-center justify-center">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          className="text-gray-600"
                        >
                          <rect
                            x="4"
                            y="4"
                            width="12"
                            height="12"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                          />
                          <path
                            d="M4 4l-2 0 0 -2"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M16 4l2 0 0 -2"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M16 16l2 0 0 2"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M4 16l-2 0 0 2"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </Box>
                      <Text variant="bodySm" as="span">
                        Breathing space
                      </Text>
                    </InlineStack>
                    <Text variant="bodySm" as="span" tone="subdued">
                      {styleSettings?.breathingSpace || 14} / 24
                    </Text>
                  </InlineStack>
                  <Box paddingBlockStart="200">
                    <RangeSlider
                      label=""
                      labelHidden
                      value={styleSettings?.breathingSpace || 14}
                      onChange={handleBreathingSpaceChange}
                      min={0}
                      max={24}
                    />
                  </Box>
                </BlockStack>
              </BlockStack>

              {/* Color Settings */}
              <BlockStack gap="400">
                {/* Color Palettes */}
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Box className="w-4 h-4 flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-gray-600"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                        <circle cx="8" cy="8" r="2" fill="currentColor" />
                        <circle cx="16" cy="8" r="2" fill="currentColor" />
                        <circle cx="8" cy="16" r="2" fill="currentColor" />
                        <circle cx="16" cy="16" r="2" fill="currentColor" />
                      </svg>
                    </Box>
                    <Text variant="bodySm" fontWeight="medium" as="p" tone="subdued">
                      Color Palettes
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" wrap={false} blockAlign="center">
                    {COLOR_PALETTES.map((color) => {
                      const isSelected =
                        styleSettings?.primaryColor === color.value;
                      return (
                        <Box
                          key={color.value}
                          as="button"
                          type="button"
                          onClick={() => handleColorSelect(color)}
                          className={`relative rounded-lg overflow-hidden transition-all shrink-0 ${isSelected
                            ? "ring-2 ring-offset-2 ring-gray-900 scale-105"
                            : "ring-1 ring-gray-300 hover:ring-gray-400 hover:scale-105"
                            }`}
                          style={{
                            width: "40px",
                            height: "28px",
                            border: isSelected ? "2px solid #000000" : "1px solid #d1d5db",
                          }}
                          title={color.name}
                        >
                          <Box
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(to right, ${color.primary || color.value} 0%, ${color.primary || color.value} 50%, ${color.secondary || color.value} 50%, ${color.secondary || color.value} 100%)`,
                            }}
                          />
                        </Box>
                      );
                    })}
                    {!isPresetPrimarySelected && (
                      <Box
                        className="relative rounded-lg overflow-hidden ring-2 ring-offset-2 ring-gray-900 scale-105 shrink-0"
                        style={{
                          width: "40px",
                          height: "28px",
                          border: "2px solid #000000",
                        }}
                        title="Custom color"
                      >
                        <Box
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to right, ${currentPrimaryColor} 0%, ${currentPrimaryColor} 50%, ${lightenHex(currentPrimaryColor)} 50%, ${lightenHex(currentPrimaryColor)} 100%)`,
                          }}
                        />
                      </Box>
                    )}
                    <CustomHexColorInput
                      value={currentPrimaryColor}
                      onChange={handleCustomPrimaryColorChange}
                      placeholder="#2563EB"
                      compact
                    />
                  </InlineStack>
                </BlockStack>

                {/* Most Popular Badge Color */}
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Box className="w-4 h-4 flex items-center justify-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-gray-600"
                      >
                        <path
                          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </Box>
                    <Text variant="bodySm" fontWeight="medium" as="p" tone="subdued">
                      Tier Badge
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" wrap={false} blockAlign="center">
                    {MOST_POPULAR_BADGE_COLORS.map((color) => {
                      const isSelected =
                        styleSettings?.mostPopularBadgeColor === color.value;
                      return (
                        <Box
                          key={color.value}
                          as="button"
                          type="button"
                          onClick={() => handleMostPopularBadgeColorSelect(color)}
                          className={`relative rounded-lg overflow-hidden transition-all shrink-0 ${isSelected
                            ? "ring-2 ring-offset-2 ring-gray-900 scale-105"
                            : "ring-1 ring-gray-300 hover:ring-gray-400 hover:scale-105"
                            }`}
                          style={{
                            width: "40px",
                            height: "28px",
                            border: isSelected ? "2px solid #000000" : "1px solid #d1d5db",
                            backgroundColor: color.value,
                          }}
                          title={color.name}
                        />
                      );
                    })}
                    {!isPresetBadgeSelected && (
                      <Box
                        className="relative rounded-lg overflow-hidden ring-2 ring-offset-2 ring-gray-900 scale-105 shrink-0"
                        style={{
                          width: "40px",
                          height: "28px",
                          border: "2px solid #000000",
                          backgroundColor: currentBadgeColor,
                        }}
                        title="Custom badge color"
                      />
                    )}
                    <CustomHexColorInput
                      value={currentBadgeColor}
                      onChange={handleCustomBadgeColorChange}
                      placeholder="#F59E0B"
                      compact
                    />
                  </InlineStack>
                </BlockStack>

                {/* Limited Offer Badge Color */}
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Box className="w-4 h-4 flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-gray-600"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M12 7V12L15 14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Box>
                    <Text variant="bodySm" fontWeight="medium" as="p" tone="subdued">
                      Limited Offer Badge
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" wrap={false} blockAlign="center">
                    {LIMITED_OFFER_BADGE_COLORS.map((color) => {
                      const isSelected =
                        styleSettings?.limitedOfferBadgeColor === color.value;
                      return (
                        <Box
                          key={color.value}
                          as="button"
                          type="button"
                          onClick={() =>
                            handleLimitedOfferBadgeColorSelect(color)
                          }
                          className={`relative rounded-lg overflow-hidden transition-all shrink-0 ${isSelected
                            ? "ring-2 ring-offset-2 ring-gray-900 scale-105"
                            : "ring-1 ring-gray-300 hover:ring-gray-400 hover:scale-105"
                            }`}
                          style={{
                            width: "40px",
                            height: "28px",
                            border: isSelected ? "2px solid #000000" : "1px solid #d1d5db",
                            backgroundColor: color.value,
                          }}
                          title={color.name}
                        />
                      );
                    })}
                    {!isPresetLimitedOfferBadgeSelected && (
                      <Box
                        className="relative rounded-lg overflow-hidden ring-2 ring-offset-2 ring-gray-900 scale-105 shrink-0"
                        style={{
                          width: "40px",
                          height: "28px",
                          border: "2px solid #000000",
                          backgroundColor: currentLimitedOfferBadgeColor,
                        }}
                        title="Custom limited offer badge color"
                      />
                    )}
                    <CustomHexColorInput
                      value={currentLimitedOfferBadgeColor}
                      onChange={handleCustomLimitedOfferBadgeColorChange}
                      placeholder="#111827"
                      compact
                    />
                  </InlineStack>
                </BlockStack>

                {/* Tier Name Color */}
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Box className="w-4 h-4 flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-gray-600"
                      >
                        <path
                          d="M4 20L9 4H11L16 20"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.5 14H13.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </Box>
                    <Text variant="bodySm" fontWeight="medium" as="p" tone="subdued">
                      Tier Name
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" wrap={false} blockAlign="center">
                    {TIER_NAME_COLORS.map((color) => {
                      const isSelected =
                        styleSettings?.tierNameColor === color.value;
                      return (
                        <Box
                          key={color.value}
                          as="button"
                          type="button"
                          onClick={() => handleTierNameColorSelect(color)}
                          className={`relative rounded-lg overflow-hidden transition-all shrink-0 ${isSelected
                            ? "ring-2 ring-offset-2 ring-gray-900 scale-105"
                            : "ring-1 ring-gray-300 hover:ring-gray-400 hover:scale-105"
                            }`}
                          style={{
                            width: "40px",
                            height: "28px",
                            border: isSelected ? "2px solid #000000" : "1px solid #d1d5db",
                            backgroundColor: color.value,
                          }}
                          title={color.name}
                        />
                      );
                    })}
                    {!isPresetTierNameSelected && (
                      <Box
                        className="relative rounded-lg overflow-hidden ring-2 ring-offset-2 ring-gray-900 scale-105 shrink-0"
                        style={{
                          width: "40px",
                          height: "28px",
                          border: "2px solid #000000",
                          backgroundColor: currentTierNameColor,
                        }}
                        title="Custom tier name color"
                      />
                    )}
                    <CustomHexColorInput
                      value={currentTierNameColor}
                      onChange={handleCustomTierNameColorChange}
                      placeholder="#333333"
                      compact
                    />
                  </InlineStack>
                </BlockStack>

                {/* Tier Card Fill Color */}
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Box className="w-4 h-4 flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-gray-600"
                      >
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="currentColor"
                          fillOpacity="0.15"
                        />
                      </svg>
                    </Box>
                    <Text variant="bodySm" fontWeight="medium" as="p" tone="subdued">
                      Tier Card Fill
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" wrap={false} blockAlign="center">
                    {TIER_CARD_FILL_COLORS.map((color) => {
                      const isSelected =
                        styleSettings?.tierCardFillColor === color.value;
                      return (
                        <Box
                          key={color.value}
                          as="button"
                          type="button"
                          onClick={() => handleTierCardFillColorSelect(color)}
                          className={`relative rounded-lg overflow-hidden transition-all shrink-0 ${isSelected
                            ? "ring-2 ring-offset-2 ring-gray-900 scale-105"
                            : "ring-1 ring-gray-300 hover:ring-gray-400 hover:scale-105"
                            }`}
                          style={{
                            width: "40px",
                            height: "28px",
                            border: isSelected ? "2px solid #000000" : "1px solid #d1d5db",
                            backgroundColor: color.value,
                          }}
                          title={color.name}
                        />
                      );
                    })}
                    {!isPresetTierFillSelected && (
                      <Box
                        className="relative rounded-lg overflow-hidden ring-2 ring-offset-2 ring-gray-900 scale-105 shrink-0"
                        style={{
                          width: "40px",
                          height: "28px",
                          border: "2px solid #000000",
                          backgroundColor: currentTierCardFillColor,
                        }}
                        title="Custom tier card fill"
                      />
                    )}
                    <CustomHexColorInput
                      value={currentTierCardFillColor}
                      onChange={handleCustomTierCardFillColorChange}
                      placeholder="#FFFFFF"
                      compact
                    />
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </BlockStack>
          </Box>
        )}
      </Box>
    </BlockStack>

  );
}
