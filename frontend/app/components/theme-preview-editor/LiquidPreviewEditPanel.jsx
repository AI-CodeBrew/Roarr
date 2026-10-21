import { Box, Text, TextField } from "@shopify/polaris";

const FIELDS = [
    { key: "color_schema", label: "Color schema" },
    { key: "heading", label: "Heading" },
    { key: "before_issue_1", label: "Before issue 1" },
    { key: "before_issue_2", label: "Before issue 2" },
    { key: "before_issue_3", label: "Before issue 3" },
    { key: "after_benefit_1", label: "After benefit 1" },
    { key: "after_benefit_2", label: "After benefit 2" },
    { key: "after_benefit_3", label: "After benefit 3" },
    { key: "button_label", label: "Button label" },
    { key: "before_image_src", label: "Before image URL" },
    { key: "after_image_src", label: "After image URL" }
];

/**
 * Edit panel for Liquid preview – form fields for Before & After block settings.
 */
export default function LiquidPreviewEditPanel({ form, onFieldChange, showHeading = true }) {
    return (
        <div className="flex flex-col w-full min-h-0">
            {showHeading && (
                <Text as="h2" variant="headingMd" className="mb-4">
                    Edit fields
                </Text>
            )}
            <Box className="flex px-1 w-full overflow-y-auto flex-1 min-h-0">
                <div className="w-full flex flex-col gap-4">
                    {FIELDS.map(({ key, label }) => (
                        <TextField
                            key={key}
                            label={label}
                            value={form[key] ?? ""}
                            onChange={(value) => onFieldChange(key, value)}
                            autoComplete="off"
                        />
                    ))}
                </div>
            </Box>
        </div>
    );
}
