import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BlockStack,
    Box,
    Button,
    Icon,
    InlineStack,
    Popover,
    Text,
    TextField,
} from "@shopify/polaris";
import {
    LIQUID_PREVIEW_FONT_OPTIONS,
    getLiquidPreviewGoogleFontsHref,
} from "../../lib/liquidPreviewFontOptions.js";
import { LayoutSectionIcon, TransferInIcon, TransferOutIcon } from "@shopify/polaris-icons";
import { ChevronDown, ChevronLeft, Plus } from "lucide-react";
import LiquidPreviewEditorPanel from "./LiquidPreviewEditorPanel";
import { HexColorPicker } from "react-colorful";
import {
    getLiquidTemplateDisplayName,
    liquidPreviewSectionIdToTemplatePath,
} from "../../lib/liquidTemplateDisplayNames.js";

/** Bootstrap-style gear icon for Theme settings (fills with currentColor). */
function ThemeSettingsGearIcon({ size = 16, className = "", strokeWidth: _sw, ...props }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            width={size}
            height={size}
            className={className}
            fill="currentColor"
            style={{ display: "block" }}
            aria-hidden
            {...props}
        >
            <path
                fillRule="evenodd"
                d="M10.5 8a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 5 0m-1.5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"
            />
            <path
                fillRule="evenodd"
                d="M7.377.5c-.926 0-1.676.75-1.676 1.676v.688c0 .056-.043.17-.198.251q-.23.12-.448.262c-.147.097-.268.076-.318.048l-.6-.346a1.676 1.676 0 0 0-2.29.613l-.622 1.08a1.675 1.675 0 0 0 .613 2.289l.648.374c.048.028.124.12.119.29l-.003.177q0 .144.008.288c.009.175-.07.27-.119.299l-.653.377a1.676 1.676 0 0 0-.613 2.29l.623 1.08a1.68 1.68 0 0 0 2.29.613l.7-.405c.048-.028.166-.048.312.043q.173.107.353.202c.155.08.198.195.198.251v.811c0 .926.75 1.676 1.676 1.676h1.246c.926 0 1.676-.75 1.676-1.676v-.81c0-.057.042-.171.197-.252q.182-.094.354-.202c.146-.091.264-.07.312-.043l.7.405a1.677 1.677 0 0 0 2.29-.614l.623-1.08a1.676 1.676 0 0 0-.613-2.289l-.654-.377c-.049-.029-.127-.123-.118-.3a5 5 0 0 0 .005-.463c-.005-.171.07-.263.12-.291l.647-.374a1.677 1.677 0 0 0 .613-2.29l-.623-1.079a1.676 1.676 0 0 0-2.29-.613l-.6.346c-.049.028-.17.048-.318-.048a5 5 0 0 0-.448-.262c-.155-.081-.197-.195-.197-.251v-.688c0-.926-.75-1.676-1.676-1.676zm-.176 1.676c0-.097.078-.176.176-.176h1.246c.097 0 .176.079.176.176v.688c0 .728.462 1.298 1.003 1.58q.166.088.323.19c.517.337 1.25.458 1.888.09l.6-.346a.175.175 0 0 1 .24.064l.623 1.08a.175.175 0 0 1-.064.24l-.648.374c-.623.36-.888 1.034-.868 1.638l.002.128q0 .105-.006.209c-.032.615.23 1.31.867 1.677l.653.377a.175.175 0 0 1 .064.24l-.623 1.08a.177.177 0 0 1-.24.065l-.701-.405c-.624-.36-1.341-.251-1.855.069q-.124.077-.255.145c-.54.283-1.003.853-1.003 1.581v.811a.176.176 0 0 1-.176.176h-1.246a.176.176 0 0 1-.176-.176v-.81c0-.73-.462-1.3-1.003-1.582a4 4 0 0 1-.255-.146c-.514-.32-1.23-.428-1.855-.068l-.7.405a.177.177 0 0 1-.241-.065l-.623-1.08a.175.175 0 0 1 .064-.24l.653-.377c.637-.368.899-1.062.867-1.677a4 4 0 0 1-.006-.21q0-.064.002-.127c.02-.604-.245-1.278-.868-1.638l-.648-.374a.175.175 0 0 1-.064-.24l.623-1.08a.175.175 0 0 1 .24-.064l.6.346c.638.368 1.37.247 1.888-.09a4 4 0 0 1 .323-.19c.54-.282 1.003-.852 1.003-1.58z"
            />
        </svg>
    );
}

const BASE_LEFT_MENU_ITEMS = [
    { id: "sections", title: "Sections", iconSource: LayoutSectionIcon },
    { id: "theme-settings", title: "Theme settings", Icon: ThemeSettingsGearIcon },
];

const LEFT_MENU_BUTTON_BASE_CLASS =
    "relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors group";
const LEFT_MENU_BUTTON_SELECTED_CLASS = "bg-blue-50 text-[#1e40af] ring-1 ring-inset ring-blue-200";
const LEFT_MENU_BUTTON_UNSELECTED_CLASS = "text-slate-500 hover:bg-blue-50 hover:text-[#1e40af]";
const LEFT_MENU_TOOLTIP_CLASS =
    "absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1.5 bg-[#1e3a8a] text-white text-xs font-medium rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-[100] pointer-events-none";

const TAILWIND_COLORS = {
    rose: { 400: "#fb7185" },
    emerald: { 400: "#34d399", 300: "#6ee7b7" },
    violet: { 500: "#8b5cf6", 400: "#a78bfa" },
    red: { 400: "#f87171" },
    teal: { 400: "#2dd4bf" },
    pink: { 400: "#f472b6" },
    purple: { 400: "#c084fc" },
    slate: { 900: "#0f172a" }
};
const DEFAULT_COLOR_SCHEMES = [
    TAILWIND_COLORS.rose[400],
    TAILWIND_COLORS.emerald[400],
    TAILWIND_COLORS.violet[500],
    TAILWIND_COLORS.red[400],
    TAILWIND_COLORS.teal[400],
    TAILWIND_COLORS.emerald[300],
    TAILWIND_COLORS.pink[400],
    TAILWIND_COLORS.purple[400]
];
const DEFAULT_PICKER_COLOR = TAILWIND_COLORS.slate[900];

function SimpleColorPicker({ color, onChange }) {
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
        <InlineStack gap="400" align="start">
            <Box minWidth="0" width="100%">
                <HexColorPicker
                    color={hexValue}
                    onChange={handleColorChange}
                    style={{ width: "100%", height: "160px" }}
                />
                <BlockStack gap="100" className="pt-4">
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
        </InlineStack>
    );
}

/**
 * Block ids like `home_pf_collection_showcase_1` become `home-pf-collection-showcase`;
 * labels resolve via {@link getLiquidTemplateDisplayName}.
 */
function getSectionDisplayName(sectionId) {
    if (!sectionId) return "";
    const fromSectionWrapper = liquidPreviewSectionIdToTemplatePath(sectionId);
    if (fromSectionWrapper) {
        return getLiquidTemplateDisplayName(fromSectionWrapper);
    }
    let templateName = sectionId;
    if (sectionId.includes("_")) {
        const withoutSuffix = sectionId.replace(/_(\d+)$/, "");
        templateName = withoutSuffix.replace(/_/g, "-");
    }
    return getLiquidTemplateDisplayName(templateName);
}

function ThemeAccordionRow({ title, expanded, onToggle, children }) {
    return (
        <div className="border-b border-gray-200">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left bg-white hover:bg-blue-50 transition-colors"
            >
                <span className="text-sm font-semibold text-gray-900">{title}</span>
                <ChevronDown
                    size={18}
                    strokeWidth={2}
                    className={`shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                    aria-hidden
                />
            </button>
            {expanded ? <div className="px-4 pb-4 bg-white">{children}</div> : null}
        </div>
    );
}

/**
 * Settings panel for Liquid preview: Sections, Theme settings (Colors + Typography accordions), and optional section editor.
 */
export default function LiquidPreviewSettingsPanel({
    templatesConfig,
    form,
    onFieldChange,
    selectedSection,
    onSectionSelect,
    onClose,
    expandedOpen = false,
    onExpandedChange,
    sectionOverrides = {},
    onSectionOverrideChange,
    sectionColors = {},
    onSectionColorChange,
    colorPalette = null,
    globalAccentColor = null,
    refImages = [],
    templateSchemas,
    /** When true, shows Typography under Theme settings with heading/body font pickers (entire-store home preview). */
    showTypographySettings = false,
    /** When false, hides the Sections rail and per-section editor (e.g. product/collection preview) — Theme settings stay available. */
    showSectionMenu = true,
}) {
    const [leftMenuSelection, setLeftMenuSelection] = useState(() =>
        showSectionMenu ? "sections" : "theme-settings",
    );
    const [headingFontPopoverOpen, setHeadingFontPopoverOpen] = useState(false);
    const [bodyFontPopoverOpen, setBodyFontPopoverOpen] = useState(false);
    const [themeAccordion, setThemeAccordion] = useState({
        colors: true,
        typography: false,
    });

    const leftMenuItems = useMemo(() => {
        const items = [];
        if (showSectionMenu) {
            items.push(BASE_LEFT_MENU_ITEMS[0]);
        }
        items.push(BASE_LEFT_MENU_ITEMS[1]);
        return items;
    }, [showSectionMenu]);

    useEffect(() => {
        if (!showSectionMenu && leftMenuSelection === "sections") {
            setLeftMenuSelection("theme-settings");
        }
    }, [showSectionMenu, leftMenuSelection]);
    const [internalExpanded, setInternalExpanded] = useState(false);
    const isExpanded = onExpandedChange != null ? expandedOpen : internalExpanded;
    const setExpanded = useCallback((v) => {
        if (onExpandedChange) onExpandedChange(v);
        else setInternalExpanded(v);
    }, [onExpandedChange]);

    useEffect(() => {
        if (!showTypographySettings) return;
        const href = getLiquidPreviewGoogleFontsHref();
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
        return () => link.remove();
    }, [showTypographySettings]);

    const headingFont = form.headingFont ?? "Poppins";
    const bodyFont = form.bodyFont ?? "Inter";

    const renderColorsAccordionContent = useCallback(
        () => (
            <div className="flex flex-col">
                <div className="mt-1 grid grid-cols-4 gap-2">
                    {(form.color_schemes || DEFAULT_COLOR_SCHEMES).map((color, index) => {
                        const isSelected = (form.selected_color || form.color_schema) === color;
                        return (
                            <button
                                key={`${color}-${index}`}
                                type="button"
                                onClick={() => onFieldChange("selected_color", color)}
                                className={`h-10 aspect-square justify-self-center rounded-full border-2 transition-shadow ${isSelected
                                    ? "border-blue-600 ring-2 ring-blue-100"
                                    : "border-gray-200 hover:shadow-sm"
                                    }`}
                                style={{ backgroundColor: color }}
                                aria-label={`Select color scheme ${color}`}
                            />
                        );
                    })}
                </div>
                <div className="mt-5">
                    <Text as="h4" variant="bodySm" fontWeight="medium" tone="subdued">
                        Custom color
                    </Text>
                    <div className="mt-2">
                        <SimpleColorPicker
                            color={form.selected_color || form.color_schema || (form.color_schemes || DEFAULT_COLOR_SCHEMES)[0]}
                            onChange={(color) => onFieldChange("selected_color", color)}
                        />
                    </div>
                </div>
            </div>
        ),
        [form.selected_color, form.color_schema, form.color_schemes, onFieldChange]
    );

    const renderTypographySettingsContent = useCallback(
        () => (
            <div className="flex flex-col">

                <div className="mt-1 space-y-4">
                    <BlockStack gap="200">
                        <Text as="p" variant="bodySm" tone="subdued">
                            Heading font
                        </Text>
                        <Popover
                            active={headingFontPopoverOpen}
                            autofocusTarget="first-node"
                            onClose={() => setHeadingFontPopoverOpen(false)}
                            activator={
                                <Button
                                    onClick={() => setHeadingFontPopoverOpen(true)}
                                    disclosure="down"
                                    fullWidth
                                >
                                    <span style={{ fontFamily: `"${headingFont}", sans-serif` }}>
                                        {headingFont}
                                    </span>
                                </Button>
                            }
                        >
                            <div
                                style={{
                                    maxHeight: "280px",
                                    overflowY: "auto",
                                    padding: "8px",
                                    width: "200px",
                                }}
                            >
                                {LIQUID_PREVIEW_FONT_OPTIONS.map((font) => (
                                    <button
                                        key={font}
                                        type="button"
                                        onClick={() => {
                                            onFieldChange("headingFont", font);
                                            setHeadingFontPopoverOpen(false);
                                        }}
                                        style={{
                                            fontFamily: `"${font}", sans-serif`,
                                            fontSize: "14px",
                                            display: "block",
                                            width: "100%",
                                            padding: "10px 12px",
                                            textAlign: "left",
                                            border: "none",
                                            borderRadius: "6px",
                                            background: headingFont === font ? "#f3f4f6" : "transparent",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {font}
                                    </button>
                                ))}
                            </div>
                        </Popover>
                    </BlockStack>
                    <BlockStack gap="200">
                        <Text as="p" variant="bodySm" tone="subdued">
                            Body font
                        </Text>
                        <Popover
                            active={bodyFontPopoverOpen}
                            autofocusTarget="first-node"
                            onClose={() => setBodyFontPopoverOpen(false)}
                            activator={
                                <Button
                                    onClick={() => setBodyFontPopoverOpen(true)}
                                    disclosure="down"
                                    fullWidth
                                >
                                    <span style={{ fontFamily: `"${bodyFont}", sans-serif` }}>
                                        {bodyFont}
                                    </span>
                                </Button>
                            }
                        >
                            <div
                                style={{
                                    maxHeight: "280px",
                                    overflowY: "auto",
                                    padding: "8px",
                                    width: "200px",
                                }}
                            >
                                {LIQUID_PREVIEW_FONT_OPTIONS.map((font) => (
                                    <button
                                        key={font}
                                        type="button"
                                        onClick={() => {
                                            onFieldChange("bodyFont", font);
                                            setBodyFontPopoverOpen(false);
                                        }}
                                        style={{
                                            fontFamily: `"${font}", sans-serif`,
                                            fontSize: "14px",
                                            display: "block",
                                            width: "100%",
                                            padding: "10px 12px",
                                            textAlign: "left",
                                            border: "none",
                                            borderRadius: "6px",
                                            background: bodyFont === font ? "#f3f4f6" : "transparent",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {font}
                                    </button>
                                ))}
                            </div>
                        </Popover>
                    </BlockStack>
                </div>
            </div>
        ),
        [
            onFieldChange,
            headingFont,
            bodyFont,
            headingFontPopoverOpen,
            bodyFontPopoverOpen,
        ]
    );

    return (
        <>
            {/* Left icon bar */}
            <div className="w-14 shrink-0 self-stretch flex flex-col items-center py-3 gap-1 bg-white border-r border-gray-200">
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    title={isExpanded ? "Collapse panel" : "Expand panel"}
                    aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
                    className={`${LEFT_MENU_BUTTON_BASE_CLASS} ${LEFT_MENU_BUTTON_UNSELECTED_CLASS}`}
                >
                    <Icon source={isExpanded ? TransferOutIcon : TransferInIcon} />
                    <span className={LEFT_MENU_TOOLTIP_CLASS}>
                        {isExpanded ? "Collapse panel" : "Expand panel"}
                    </span>
                </button>
                {leftMenuItems.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                            setLeftMenuSelection(item.id);
                            setExpanded(true);
                            onSectionSelect?.(null);
                        }}
                        title={item.title}
                        className={`${LEFT_MENU_BUTTON_BASE_CLASS} ${leftMenuSelection === item.id ? LEFT_MENU_BUTTON_SELECTED_CLASS : LEFT_MENU_BUTTON_UNSELECTED_CLASS}`}
                    >
                        {item.iconSource ? (
                            <Icon source={item.iconSource} />
                        ) : (
                            <item.Icon size={16} strokeWidth={2.5} />
                        )}
                        <span className={LEFT_MENU_TOOLTIP_CLASS}>{item.title}</span>
                    </button>
                ))}
            </div>

            <div
                className="shrink-0 self-stretch min-h-0 h-full overflow-hidden transition-[max-width,opacity] duration-200 ease-out"
                style={{
                    maxWidth: isExpanded ? "260px" : "0px",
                    opacity: isExpanded ? 1 : 0,
                    pointerEvents: isExpanded ? "auto" : "none",
                }}
            >
                {/* Section settings on top when a section is selected (Shopify-style); hidden when section rail is off */}
                {selectedSection && showSectionMenu ? (
                    <div className="w-[260px] min-w-[260px] h-full min-h-0 shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden max-md:fixed max-md:inset-y-0 max-md:left-14 max-md:z-50 max-md:w-[min(260px,85vw)] max-md:shadow-xl max-md:border-l">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 shrink-0 min-w-0">
                            <button
                                type="button"
                                onClick={() => onSectionSelect?.(null)}
                                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-[#1e40af] transition-colors shrink-0"
                                title="Back to sections"
                                aria-label="Back to sections"
                            >
                                <ChevronLeft size={18} strokeWidth={2} />
                            </button>
                            <span className="text-sm font-medium text-gray-700 truncate min-w-0" title={getSectionDisplayName(selectedSection)}>
                                {getSectionDisplayName(selectedSection)}
                            </span>
                        </div>
                        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                            <LiquidPreviewEditorPanel
                                selectedSection={selectedSection}
                                form={form}
                                onFieldChange={onFieldChange}
                                sectionOverrides={sectionOverrides}
                                onSectionOverrideChange={onSectionOverrideChange}
                                sectionColors={sectionColors}
                                onSectionColorChange={onSectionColorChange}
                                colorPalette={colorPalette}
                                globalAccentColor={globalAccentColor}
                                refImages={refImages}
                                templateSchemas={templateSchemas}
                                onClose={() => onSectionSelect?.(null)}
                                embedded
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Sections panel */}
                        {showSectionMenu && leftMenuSelection === "sections" && (
                            <div className="min-w-[240px] h-full min-h-0 shrink-0 flex flex-col bg-white overflow-hidden max-md:fixed max-md:inset-y-0 max-md:left-14 max-md:z-50 max-md:w-[min(240px,85vw)] max-md:shadow-xl max-md:border-l">
                                <nav className="flex-1 min-h-0 overflow-y-auto" aria-label="Sections">
                                    {/* <div className="">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5 px-3 pt-2 border-t border-gray-200 first:border-t-0 first:pt-0">
                                    Header
                                </p>
                                <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                    <span className="w-4 h-4 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0">
                                        <Plus size={10} strokeWidth={2.5} />
                                    </span>
                                    <span>Add section</span>
                                </button>
                            </div> */}
                                    <div className="flex flex-col min-h-0">
                                        <div className="px-4 pt-4 pb-3 border-b border-gray-200 shrink-0">
                                            <Text as="h2" variant="headingSm">
                                                Template
                                            </Text>
                                        </div>
                                        <div className="space-y-0.5 pt-2">
                                            {templatesConfig.flatMap((row) => row.flatMap((item) => (Array.isArray(item) ? item : [item]))).map(({ template, context, displayName: explicitDisplayName }, index) => {
                                                const displayName = explicitDisplayName ?? getLiquidTemplateDisplayName(template);
                                                // Use block.id as unique identifier, fallback to template name
                                                const blockId = context?.block?.id;
                                                const sectionId = blockId || template;
                                                const isSelected = selectedSection === sectionId;
                                                return (
                                                    <button
                                                        key={`${sectionId}-${index}`}
                                                        type="button"
                                                        onClick={() => onSectionSelect?.(isSelected ? null : sectionId)}
                                                        className={`w-full flex items-center gap-1.5 px-3 py-1 rounded-lg text-left text-xs transition-colors ${isSelected
                                                            ? "bg-blue-600 text-white"
                                                            : "text-gray-900 hover:bg-blue-50"
                                                            }`}
                                                    >
                                                        <span className={`shrink-0 ${isSelected ? "text-white" : "text-gray-500"}`}>
                                                            <Icon source={LayoutSectionIcon} />
                                                        </span>
                                                        <span className="truncate">{displayName}</span>
                                                    </button>
                                                );
                                            })}

                                        </div>
                                    </div>

                                </nav>
                            </div>
                        )}
                        {/* Theme settings: Colors + Typography accordions */}
                        {leftMenuSelection === "theme-settings" && (
                            <div className="w-[240px] min-w-[240px] h-full min-h-0 shrink-0 flex flex-col bg-white overflow-hidden max-md:fixed max-md:inset-y-0 max-md:left-14 max-md:z-50 max-md:w-[min(240px,85vw)] max-md:shadow-xl max-md:border-l">
                                <div className="px-4 pt-4 pb-3 border-b border-gray-200 shrink-0">
                                    <Text as="h2" variant="headingSm">
                                        Theme settings
                                    </Text>
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto">
                                    <ThemeAccordionRow
                                        title="Colors"
                                        expanded={themeAccordion.colors}
                                        onToggle={() =>
                                            setThemeAccordion((prev) => ({ ...prev, colors: !prev.colors }))
                                        }
                                    >
                                        {renderColorsAccordionContent()}
                                    </ThemeAccordionRow>
                                    {showTypographySettings ? (
                                        <ThemeAccordionRow
                                            title="Typography"
                                            expanded={themeAccordion.typography}
                                            onToggle={() =>
                                                setThemeAccordion((prev) => ({
                                                    ...prev,
                                                    typography: !prev.typography,
                                                }))
                                            }
                                        >
                                            {renderTypographySettingsContent()}
                                        </ThemeAccordionRow>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
