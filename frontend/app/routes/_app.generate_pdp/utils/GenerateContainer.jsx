import { Box } from "@shopify/polaris";

export default function GenerateContainer({ children, style, className, bottomActions }) {
  return (
    <div
      className={className}
      data-generate-container="true"
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        overflowY: "auto",
        padding: "16px 0",
        margin: "0 auto",
        boxSizing: "border-box",
        // backgroundColor: "red",
        ...style,
      }}
    >
      {children}

      {bottomActions && (
        <Box
          className="relative pt-3  left-0 right-0  z-10 pointer-events-none"
        >
          <div
            style={{
              width: "100%",
              // maxWidth: "1000px",
              margin: "0 auto",
              boxSizing: "border-box",
            }}
            className="pointer-events-auto"
          >
            {bottomActions}
          </div>
        </Box>
      )}
    </div>
  );
}