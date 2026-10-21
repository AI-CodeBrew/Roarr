export default function UpsellItemsSection({ 
  upsellItems, 
  variants, 
  onAdd, 
  onRemove, 
  onUpdate 
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <s-text><strong>Upsell Items</strong></s-text>
        <s-button
          type="button"
          variant="secondary"
          onClick={onAdd}
        >
          + Add Upsell Item
        </s-button>
      </div>

      {upsellItems.length === 0 ? (
        <div style={{ padding: "16px", background: "#f9f9f9", borderRadius: "4px", textAlign: "center", color: "#666" }}>
          No upsell items added. Click "Add Upsell Item" to add one.
        </div>
      ) : (
        upsellItems.map((item, index) => (
          <div
            key={index}
            style={{
              padding: "16px",
              marginTop: index > 0 ? "12px" : "0",
              border: "1px solid #ddd",
              borderRadius: "8px",
              background: "#fafafa",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <s-text><strong>Upsell Item #{index + 1}</strong></s-text>
              {upsellItems.length > 1 && (
                <s-button
                  type="button"
                  variant="tertiary"
                  onClick={() => onRemove(index)}
                >
                  Remove
                </s-button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>Upsell Variant</span>
                <select
                  value={item.upsellVariantId}
                  onChange={(e) => onUpdate(index, "upsellVariantId", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  <option value="">Select variant...</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.product.title} - {v.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={item.upsellQuantity}
                  onChange={(e) => onUpdate(index, "upsellQuantity", parseInt(e.target.value) || 1)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </div>

              <div>
                <span style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>Discount %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={item.discountPercentage}
                  onChange={(e) => onUpdate(index, "discountPercentage", parseFloat(e.target.value) || 100)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
          </div>
        ))
      )}

      <span style={{ fontSize: "12px", marginTop: "8px", display: "block", color: "#666" }}>
        Add multiple upsell items with different discount percentages. 100% = Free item, less than 100% = Discounted item.
      </span>
    </div>
  );
}

