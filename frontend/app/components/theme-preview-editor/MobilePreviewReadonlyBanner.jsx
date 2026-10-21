import { Banner } from "@shopify/polaris";

/**
 * Shown on narrow viewports when template / product preview editors are in read-only mode.
 */
export default function MobilePreviewReadonlyBanner({ variant = "store" }) {
  const isProduct = variant === "product";
  return (
    <div className="rounded-lg overflow-hidden">
      <Banner tone="info" title="Desktop is recommended for editing">
        <p>
          {isProduct
            ? "On mobile you can preview only. Use desktop for the best editing experience, including sections, save, and publish controls."
            : "On mobile you can preview only. Use desktop for the best editing experience, including sections, theme settings, save, and publish controls."}
        </p>
      </Banner>
    </div>
  );
}
