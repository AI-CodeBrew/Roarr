export default function GenerateProgressCard({ currentStep, isLoading = false }) {
  // 4-step flow:
  // 1) Choose product
  // 2) Template Selection
  // 3) Magic + Configuration
  // 4) Push
  const total = 4;
  const clampedStep = Math.min(Math.max(Number(currentStep || 1), 1), total);
  // If currentStep is greater than total, it means all steps are complete
  const isComplete = Number(currentStep || 1) > total;
  const completedCount = isComplete ? total : Math.max(0, clampedStep - 1);
  const progressPct = total > 0 ? (completedCount / total) * 100 : 0;
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #e1e3e5",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        padding: "12px 20px",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ fontSize: "14px", whiteSpace: "nowrap" }}>
          {completedCount} of {total} steps complete
        </div>
        <div
          style={{
            flex: 1,
            height: "8px",
            backgroundColor: "#edeeef",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              backgroundColor: "black",
              backgroundImage: isLoading
                ? "linear-gradient(90deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.00) 100%)"
                : "none",
              backgroundSize: "200% 100%",
              animation: isLoading ? "roarr-progress-shimmer 1.1s linear infinite" : "none",
              transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Minimal keyframes (scoped by unique name). Uses a <style> tag for portability.
if (typeof document !== "undefined" && !document.getElementById("roarr-generate-progressbar-keyframes")) {
  const style = document.createElement("style");
  style.id = "roarr-generate-progressbar-keyframes";
  style.textContent = `
@keyframes roarr-progress-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  `.trim();
  document.head.appendChild(style);
}


