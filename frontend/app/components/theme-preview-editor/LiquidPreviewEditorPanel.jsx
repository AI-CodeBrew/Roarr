import { BlockStack, Box, InlineStack, Text, TextField } from "@shopify/polaris";
import { LayoutGrid, X } from "lucide-react";
import { usePosthogAfterIdentify } from "../../lib/PosthogIdentityContext";
import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { LabeledTextField, LabeledImageField } from "./LiquidPreviewField";
import { liquidPreviewSectionIdToTemplatePath } from "../../lib/liquidTemplateDisplayNames.js";
import {
    normalizeHexColor,
    resolveHomeSectionKey,
    getSectionColorSchemeSlots,
    resolveSlotColorFields,
    getSchemeFieldsForSection,
} from "../../routes/_app.generate_store/store/utils/sectionColorUtils.js";

const DEFAULT_PICKER_COLOR = "#2563EB";

function CompactSectionColorPicker({ color, onChange, palette = [] }) {
    const [hexValue, setHexValue] = useState(color || DEFAULT_PICKER_COLOR);
    useEffect(() => {
        setHexValue(color || DEFAULT_PICKER_COLOR);
    }, [color]);
    const handleHexChange = (value) => {
        const upperValue = value.toUpperCase();
        if (/^#[0-9A-F]{0,6}$/.test(upperValue)) {
            setHexValue(upperValue);
            if (upperValue.length === 7) onChange(upperValue);
        }
    };
    const handleColorChange = (newColor) => {
        const upperColor = newColor.toUpperCase();
        setHexValue(upperColor);
        onChange(upperColor);
    };
    return (
        <BlockStack gap="300">
            {Array.isArray(palette) && palette.length > 0 ? (
                <InlineStack gap="200" wrap>
                    {palette.map((swatch) => {
                        const isSelected =
                            String(hexValue || "").toUpperCase() ===
                            String(swatch || "").toUpperCase();
                        return (
                            <button
                                key={swatch}
                                type="button"
                                onClick={() => onChange(String(swatch).toUpperCase())}
                                title={swatch}
                                className={`w-7 h-7 rounded-full border-2 shrink-0 ${
                                    isSelected ? "border-gray-900 scale-110" : "border-transparent"
                                }`}
                                style={{ backgroundColor: swatch }}
                                aria-label={`Use color ${swatch}`}
                            />
                        );
                    })}
                </InlineStack>
            ) : null}
            <Box minWidth="0" width="100%">
                <HexColorPicker
                    color={hexValue}
                    onChange={handleColorChange}
                    style={{ width: "100%", height: "120px" }}
                />
                <BlockStack gap="100" className="pt-3">
                    <Text as="label" variant="bodyXs" fontWeight="medium" tone="subdued">
                        Hex
                    </Text>
                    <TextField
                        value={hexValue}
                        onChange={handleHexChange}
                        placeholder={DEFAULT_PICKER_COLOR}
                        autoComplete="off"
                    />
                </BlockStack>
            </Box>
        </BlockStack>
    );
}

/**
 * Right-side editor panel for Liquid preview.
 * Schema-driven fields + per-section background / button / text colors.
 */
export default function LiquidPreviewEditorPanel({
    selectedSection,
    form,
    onFieldChange,
    sectionOverrides = {},
    onSectionOverrideChange,
    sectionColors = {},
    onSectionColorChange,
    colorPalette = null,
    globalAccentColor = null,
    refImages = [],
    templateSchemas = {},
    onClose,
    embedded = false,
    pdpId = "",
}) {
    const posthog = usePosthogAfterIdentify();
    const imageRegenerationCountRef = useRef(0);
    const [activeSchemeSlot, setActiveSchemeSlot] = useState("color_scheme");
    const [activeSchemeField, setActiveSchemeField] = useState("background");

    useEffect(() => {
        setActiveSchemeSlot("color_scheme");
        setActiveSchemeField("background");
    }, [selectedSection]);

    const getTemplateName = (sectionId) => {
        if (!sectionId) return sectionId;
        let normalized = String(sectionId);
        const fromWrapper = liquidPreviewSectionIdToTemplatePath(normalized);
        if (fromWrapper) {
            normalized = fromWrapper;
        }
        if (normalized.startsWith("home/")) {
            normalized = normalized.slice(5);
        }
        if (normalized.startsWith("packs/cinematic/home/")) {
            normalized = normalized.slice("packs/cinematic/home/".length);
        }
        if (normalized.startsWith("packs/amour/home/")) {
            normalized = normalized.slice("packs/amour/home/".length);
        }
        if (normalized.startsWith("packs/lumenook/home/")) {
            normalized = normalized.slice("packs/lumenook/home/".length);
        }
        if (normalized.startsWith("product/")) {
            normalized = normalized.slice("product/".length);
        }
        if (normalized.startsWith("collection/")) {
            normalized = normalized.slice("collection/".length);
        }
        if (normalized.includes("_")) {
            const withoutSuffix = normalized.replace(/_(\d+)$/, "");
            return withoutSuffix.replace(/_/g, "-");
        }
        return normalized;
    };

    if (!selectedSection) {
        return (
            <div className="w-[320px] shrink-0 flex flex-col bg-gray-50 border-l border-gray-200 overflow-hidden max-h-screen">
                <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 shrink-0 md:hidden">
                    <span className="text-sm font-medium text-gray-700">Editor</span>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-[#1e40af] transition-colors shrink-0"
                            aria-label="Close editor panel"
                        >
                            <X size={18} strokeWidth={2} />
                        </button>
                    )}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col items-center justify-start text-center">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center mb-4">
                        <LayoutGrid size={24} className="text-gray-600" strokeWidth={1.5} />
                    </div>
                    <Text as="h2" variant="headingMd" fontWeight="semibold" className="mb-2 text-gray-900">
                        Customize your templates
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued" className="mb-8 text-gray-600">
                        Select a section or block in the sidebar to start.
                    </Text>
                </div>
            </div>
        );
    }

    const templateName = getTemplateName(selectedSection);
    const schema = templateSchemas[templateName];
    const sectionKey = resolveHomeSectionKey(selectedSection);
    const canEditSectionColor = Boolean(onSectionColorChange) && Boolean(sectionKey);
    const globalAccent =
        normalizeHexColor(globalAccentColor) || DEFAULT_PICKER_COLOR;
    const schemeSlots = sectionKey
        ? getSectionColorSchemeSlots(sectionKey)
        : [];
    const activeSlot =
        schemeSlots.find((s) => s.key === activeSchemeSlot)?.key ||
        schemeSlots[0]?.key ||
        "color_scheme";
    const slotFieldValues = sectionKey
        ? resolveSlotColorFields(
              sectionKey,
              activeSlot,
              sectionColors?.[sectionKey],
              globalAccent,
          )
        : {};
    const schemeFields = sectionKey
        ? getSchemeFieldsForSection(sectionKey, activeSlot)
        : [];
    const activeField =
        schemeFields.find((f) => f.key === activeSchemeField)?.key ||
        schemeFields[0]?.key ||
        "background";

    const sectionColorBlock = canEditSectionColor && schemeFields.length > 0 ? (
        <BlockStack gap="300">
            <Text as="p" variant="bodySm" fontWeight="semibold">
                Color scheme
            </Text>
            <Text as="p" variant="bodyXs" tone="subdued">
                Only colors used by this section are listed.
            </Text>
            {schemeSlots.length > 1 ? (
                <div
                    role="tablist"
                    aria-label="Color scheme area"
                    style={{
                        display: "inline-flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 2,
                        padding: 3,
                        borderRadius: 999,
                        background: "#f1f2f3",
                        alignSelf: "flex-start",
                    }}
                >
                    {schemeSlots.map(({ key, label }) => {
                        const isActive = activeSlot === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => {
                                    setActiveSchemeSlot(key);
                                    setActiveSchemeField("background");
                                }}
                                style={{
                                    border: "none",
                                    cursor: "pointer",
                                    borderRadius: 999,
                                    padding: "5px 10px",
                                    fontSize: 12,
                                    fontWeight: isActive ? 600 : 500,
                                    color: isActive ? "#1e3a8a" : "#64748b",
                                    background: isActive ? "#ffffff" : "transparent",
                                    boxShadow: isActive
                                        ? "0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)"
                                        : "none",
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            ) : null}
            <BlockStack gap="150">
                {schemeFields.map(({ key, label }) => {
                    const swatch = slotFieldValues[key] || "#FFFFFF";
                    const isActive = activeField === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveSchemeField(key)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: isActive
                                    ? "1px solid #1e40af"
                                    : "1px solid #e2e8f0",
                                background: isActive ? "#eff4ff" : "#ffffff",
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            <Text as="span" variant="bodySm">
                                {label}
                            </Text>
                            <span
                                aria-hidden
                                title={swatch}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    background: swatch,
                                    border: "1px solid rgba(0,0,0,0.12)",
                                    flexShrink: 0,
                                }}
                            />
                        </button>
                    );
                })}
            </BlockStack>
            <CompactSectionColorPicker
                color={slotFieldValues[activeField] || globalAccent}
                palette={colorPalette || form?.color_schemes || []}
                onChange={(hex) =>
                    onSectionColorChange(selectedSection, hex, {
                        slot: activeSlot,
                        field: activeField,
                    })
                }
            />
        </BlockStack>
    ) : null;

    if (!schema) {
        return (
            <div className={`flex flex-col bg-white overflow-hidden ${embedded ? "w-full h-full min-h-0" : "w-[320px] shrink-0 border-l border-gray-200 max-h-screen"}`}>
                {!embedded && (
                    <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-2 shrink-0">
                        <div className="min-w-0">
                            <Text as="h2" variant="headingMd" fontWeight="semibold">
                                {templateName || selectedSection}
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued" className="mt-0.5">
                                Change this section&apos;s color below.
                            </Text>
                        </div>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-[#1e40af] transition-colors shrink-0"
                                aria-label="Close editor panel"
                            >
                                <X size={18} strokeWidth={2} />
                            </button>
                        )}
                    </div>
                )}
                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                    <BlockStack gap="400">
                        {sectionColorBlock}
                        {!sectionColorBlock ? (
                            <Text as="p" variant="bodySm" tone="subdued">
                                No form schema for this section. Inspect content in the preview.
                            </Text>
                        ) : null}
                    </BlockStack>
                </div>
            </div>
        );
    }

    const displayName = schema.displayName || templateName;
    const useForm = schema.useForm === true;
    const overrides = useForm ? form : (sectionOverrides[selectedSection] || {});

    const getNested = (obj, path) => {
        if (!path || !obj) return undefined;
        const parts = path.split(".");
        let current = obj;
        for (const p of parts) {
            if (current == null || typeof current !== "object") return undefined;
            current = current[p];
        }
        return current;
    };

    const getValue = (field) => {
        const k = useForm ? field.formKey ?? field.key : field.key;
        const val = k.includes(".") ? getNested(overrides, k) : overrides[k];
        if (val != null && String(val).length > 0) return val;
        if (field.default != null) return field.default;
        return "";
    };

    const setValue = (field, value, isTextEdit = false) => {
        const k = useForm ? field.formKey ?? field.key : field.key;
        if (useForm) {
            onFieldChange?.(k, value);
        } else {
            onSectionOverrideChange?.(selectedSection, {
                ...sectionOverrides[selectedSection],
                [k]: value,
            });
        }
        if (isTextEdit && posthog) {
            posthog.capture("pdp_text_edited", {
                pdp_id: pdpId,
                section_edited: field.key,
            });
        }
    };

    const handleImageSelect = (field) => () => {
        const url = prompt("Enter image URL:", getValue(field));
        if (url != null) setValue(field, url);
    };

    const handleExploreFreeImages = () => {
        window.open("https://unsplash.com", "_blank");
    };

    return (
        <div className={`flex flex-col bg-white overflow-hidden ${embedded ? "w-full h-full min-h-0" : "w-[320px] shrink-0 border-l border-gray-200 max-h-screen"}`}>
            {!embedded && (
                <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-2 shrink-0">
                    <div className="min-w-0">
                        <Text as="h2" variant="headingMd" fontWeight="semibold">
                            {displayName}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued" className="mt-0.5">
                            Edit color, text, or images for this section
                        </Text>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-[#1e40af] transition-colors shrink-0"
                            aria-label="Close editor panel"
                        >
                            <X size={18} strokeWidth={2} />
                        </button>
                    )}
                </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <BlockStack gap="500">
                    {sectionColorBlock}
                    {schema.fields.map((field) => {
                        if (field.type === "text") {
                            return (
                                <LabeledTextField
                                    key={field.key}
                                    label={field.label}
                                    value={getValue(field)}
                                    onChange={(v) => setValue(field, v, true)}
                                    placeholder={field.placeholder}
                                    showMetafieldIcon={field.productMetafield != null}
                                    showOptionsIcon={field.showOptions === true}
                                />
                            );
                        }
                        if (field.type === "image") {
                            const val = getValue(field);
                            const referenceImages = refImages || [];
                            return (
                                <LabeledImageField
                                    key={field.key}
                                    label={field.label}
                                    value={val}
                                    imageKey={field.key}
                                    onChange={(v) => setValue(field, v)}
                                    showMetafieldIcon={field.productMetafield != null}
                                    onSelectClick={handleImageSelect(field)}
                                    onExploreFreeImages={handleExploreFreeImages}
                                    referenceImages={referenceImages}
                                    onRegenerate={
                                        posthog
                                            ? () => {
                                                imageRegenerationCountRef.current += 1;
                                                posthog.capture("pdp_image_regenerated", {
                                                    pdp_id: pdpId,
                                                    section_regenerated:
                                                        selectedSection + "_" + field.key,
                                                    regeneration_count:
                                                        imageRegenerationCountRef.current,
                                                });
                                            }
                                            : undefined
                                    }
                                    onRegenerateSave={
                                        posthog
                                            ? () => {
                                                posthog.capture("pdp_image_regenerated_save", {
                                                    pdp_id: pdpId,
                                                    regeneration_count:
                                                        imageRegenerationCountRef.current,
                                                    section_regenerated:
                                                        selectedSection + "_" + field.key,
                                                });
                                            }
                                            : undefined
                                    }
                                />
                            );
                        }
                        return null;
                    })}
                </BlockStack>
            </div>
        </div>
    );
}
