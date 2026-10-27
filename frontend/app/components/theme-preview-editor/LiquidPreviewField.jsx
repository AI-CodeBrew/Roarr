import { Text, TextField } from "@shopify/polaris";
import { Database, MoreHorizontal } from "lucide-react";
import EditableImage from "../../routes/_app.generate_pdp/templates/HealthBeauty/inline/EditableImage";

/**
 * Text field with label and metafield indicator (for linking to product metafields).
 * Matches the "Button" / "Label" style from theme editor.
 */
export function LabeledTextField({
    label,
    value,
    onChange,
    placeholder = "",
    showMetafieldIcon = true,
    showOptionsIcon = false,
    onOptionsClick
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Text as="label" variant="bodySm" fontWeight="medium" tone="subdued">
                        {label}
                    </Text>
                    {showMetafieldIcon && (
                        <button
                            type="button"
                            className="p-0.5 rounded hover:bg-blue-50 hover:text-[#1e40af] text-gray-500"
                            title="Link to product metafield"
                            aria-label="Link to metafield"
                        >
                            <Database size={14} strokeWidth={2} />
                        </button>
                    )}
                </div>
                {showOptionsIcon && (
                    <button
                        type="button"
                        onClick={onOptionsClick}
                        className="p-1 rounded hover:bg-blue-50 hover:text-[#1e40af] text-gray-500"
                        aria-label="More options"
                    >
                        <MoreHorizontal size={16} />
                    </button>
                )}
            </div>
            <TextField
                value={value ?? ""}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete="off"
                label=""
                labelHidden
            />
        </div>
    );
}

/**
 * Image field with image preview, Regenerate overlay when image exists, and Select when empty.
 * Uses EditableImage modal for AI regeneration when image is present.
 */
export function LabeledImageField({
    label,
    value,
    onChange,
    imageKey,
    showMetafieldIcon = true,
    onSelectClick,
    onExploreFreeImages,
    showUrlInput = false,
    referenceImages = [],
    onRegenerateSave,
    onRegenerate
}) {
    const displayValue = typeof value === "object" && value?.src ? value.src : (value ?? "");
    const hasImage = !!displayValue && /^https?:\/\//i.test(String(displayValue));

    const handleRegenerateSave = (url) => {
        onChange?.(typeof value === "object" && value != null ? { ...value, src: url } : url);
        onRegenerateSave?.();
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
                <Text as="label" variant="bodySm" fontWeight="medium" tone="subdued">
                    {label}
                </Text>
                {showMetafieldIcon && (
                    <button
                        type="button"
                        className="border-0 bg-transparent p-0.5 rounded hover:bg-blue-50 hover:text-[#1e40af] text-gray-500 cursor-pointer"
                        title="Link to product metafield"
                        aria-label="Link to metafield"
                    >
                        <Database size={14} strokeWidth={2} />
                    </button>
                )}
            </div>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex flex-col gap-2">

                    <EditableImage
                        enabled={true}
                        src={displayValue}
                        label={label}
                        badge="Regenerate image"
                        imageKey={imageKey}
                        onSave={handleRegenerateSave}
                        onRegenerateStart={onRegenerate}
                        referenceImages={referenceImages}
                        alt={label}
                    >
                        <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <img
                                src={displayValue}
                                alt={label}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </EditableImage>

                </div>
            </div>
        </div>
    );
}
