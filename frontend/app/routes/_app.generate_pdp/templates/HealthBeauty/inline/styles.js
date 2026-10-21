/**
 * Global styles for Template1Inline
 */

export const globalStyles = `
  .health-beauty-template-1-inline [class*="overflow-x-auto"]::-webkit-scrollbar {
    display: none;
  }
  @media (min-width: 768px) {
    .header-height-md { height: 48px !important; }
    .grid-cols-md-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .grid-cols-md-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .grid-cols-md-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    .px-md-6 { padding-left: 24px !important; padding-right: 24px !important; }
    .py-md-4 { padding-top: 16px !important; padding-bottom: 16px !important; }
    .py-md-6 { padding-top: 24px !important; padding-bottom: 24px !important; }
    .gap-md-6 { gap: 24px !important; }
    .gap-md-8 { gap: 32px !important; }
    .text-md-sm { font-size: 14px !important; }
    .text-md-md { font-size: 16px !important; }
    .text-md-lg { font-size: 18px !important; }
    .text-md-xl { font-size: 20px !important; }
    .text-md-2xl { font-size: 24px !important; }
    .mb-md-4 { margin-bottom: 16px !important; }
    .mb-md-6 { margin-bottom: 24px !important; }
    .mt-md-6 { margin-top: 24px !important; }
    .w-md-16 { width: 64px !important; }
    .h-md-16 { height: 64px !important; }
    .w-md-20 { width: 80px !important; }
    .h-md-20 { height: 80px !important; }
    .w-md-24 { width: 96px !important; }
    .h-md-24 { height: 96px !important; }
    .w-md-32 { width: 128px !important; }
    .border-md-6 { border-width: 6px !important; }
    .pb-md-8 { padding-bottom: 32px !important; }
    .gap-md-4 { gap: 16px !important; }
    .order-tracking-line { display: block !important; }
  }
  @media (min-width: 1024px) {
    .grid-cols-lg-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .grid-cols-lg-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .grid-cols-lg-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
    .px-lg-8 { padding-left: 32px !important; padding-right: 32px !important; }
    .text-lg-sm { font-size: 14px !important; }
    .text-lg-2xl { font-size: 24px !important; }
  }
  @media (max-width: 767px) {
    .hb-preview-mobile .loved-by-mobile-carousel {
      display: block !important;
    }
    .hb-preview-mobile .loved-by-desktop-grid {
      display: none !important;
    }
    .hb-preview-mobile .real-reviews-mobile-carousel {
      display: block !important;
    }
    .hb-preview-mobile .real-reviews-desktop-grid {
      display: none !important;
    }
  }
  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-scroll {
    animation: scroll 30s linear infinite;
    display: flex;
  }

  /* Inline editing hover UI */
  .hb-editable-wrap {
    position: relative;
  }
  .hb-editable-overlay {
    position: absolute;
    /* draw inside so parent borders/overflow don't hide it */
    inset: 3px;
    border: 2px dashed #60a5fa;
    border-radius: 10px;
    background: rgba(59, 130, 246, 0.14);
    opacity: 0;
    transition: opacity 120ms ease;
    pointer-events: none;
    z-index: 20;
  }
  .hb-editable-badge {
    position: absolute;
    /* keep badge inside so it doesn't get clipped */
    top: 8px;
    left: 8px;
    background: #3b82f6;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
    opacity: 0;
    transition: opacity 120ms ease;
    pointer-events: none;
    line-height: 1;
    z-index: 21;
  }
  .hb-editable-wrap:hover .hb-editable-overlay,
  .hb-editable-wrap:hover .hb-editable-badge {
    opacity: 1;
  }
`;

