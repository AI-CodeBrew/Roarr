// Polaris EmptyState always renders its image (it shows a skeleton until the image loads).
// A transparent inline SVG keeps the layout without hosting an image anywhere.
export const EMPTY_STATE_IMAGE =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E";
