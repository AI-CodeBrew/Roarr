/**
 * Labels for Step-1 configure Liquid preview chrome so merchants don't
 * mistake sample content for the post–Begin Magic generated page.
 */

export function DemoPreviewBadge() {
  return null;
}

/**
 * @param {{ subject?: "product page" | "store" }} props
 */
export function DemoPreviewDisclaimer({ subject = "store" }) {
  return (
    <div
      style={{
        borderLeft: "1px solid #e1e3e5",
        borderRight: "1px solid #e1e3e5",
        borderBottom: "none",
        background: "linear-gradient(90deg, #f6f8ff, #eef3ff)",
        padding: "8px 12px",
        fontSize: "12px",
        lineHeight: 1.4,
        color: "#64748b",
        textAlign: "center",
      }}
    >
      This is a <strong style={{ fontWeight: 650, color: "#1e3a8a" }}>sample preview</strong>.
      Your actual {subject} will be generated after you{" "}
      <strong style={{ fontWeight: 650, color: "#1e3a8a" }}>Click Use Template.</strong>
    </div>
  );
}
