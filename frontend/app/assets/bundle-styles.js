/**
 * Bundle Styles - Injects CSS variables for bundle UI from data attributes
 */
(function () {
  const DEFAULT_PRIMARY = { r: 163, g: 78, b: 78 };
  const DEFAULT_BADGE = { r: 245, g: 158, b: 11 };

  function hexToRgb(hex, fallback) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? {
          r: parseInt(m[1], 16),
          g: parseInt(m[2], 16),
          b: parseInt(m[3], 16),
        }
      : fallback || DEFAULT_PRIMARY;
  }

  function initDiscountedBundles() {
    const containers = document.querySelectorAll(
      '.bundle-save-container[data-bundle-type="discounted"]'
    );
    containers.forEach((container) => {
      const primaryColor =
        container.getAttribute('data-primary-color') || '#a34e4e';
      const badgeColor =
        container.getAttribute('data-most-popular-badge-color') || '#F59E0B';
      const cornerRoundness =
        parseInt(container.getAttribute('data-corner-roundness'), 10) || 9;
      const breathingSpace =
        parseInt(container.getAttribute('data-breathing-space'), 10) || 14;

      const rgb = hexToRgb(primaryColor, DEFAULT_PRIMARY);
      const badgeRgb = hexToRgb(badgeColor, DEFAULT_BADGE);

      container.style.setProperty('--bundle-primary-color', primaryColor);
      container.style.setProperty(
        '--bundle-primary-color-rgb',
        `${rgb.r},${rgb.g},${rgb.b}`
      );
      container.style.setProperty(
        '--bundle-corner-roundness',
        `${cornerRoundness}px`
      );
      container.style.setProperty(
        '--bundle-breathing-space',
        `${breathingSpace}px`
      );
      container.style.setProperty(
        '--bundle-most-popular-badge-color',
        badgeColor
      );
      container.style.setProperty(
        '--bundle-most-popular-badge-color-rgb',
        `${badgeRgb.r},${badgeRgb.g},${badgeRgb.b}`
      );

      if (window.BUNDLE_DATA) {
        window.BUNDLE_DATA.bundles.push({
          id: container.getAttribute('data-bundle-id'),
          type: 'discounted',
          productId: container.getAttribute('data-product-id'),
          variantId: container.getAttribute('data-current-variant-id'),
          variantPrice: parseInt(
            container.getAttribute('data-current-variant-price') || '0',
            10
          ),
          styleSettings: {
            primaryColor,
            cornerRoundness,
            breathingSpace,
            mostPopularBadgeColor: badgeColor,
          },
        });
      }
    });
  }

  function initUpsellingBundles() {
    const containers = document.querySelectorAll(
      '.bundle-box[data-bundle-type="upselling"]'
    );
    containers.forEach((container) => {
      const primaryColor =
        container.getAttribute('data-primary-color') || '#a34e4e';
      const rgb = hexToRgb(primaryColor, DEFAULT_PRIMARY);

      container.style.setProperty('--bundle-primary-color', primaryColor);
      container.style.setProperty(
        '--bundle-primary-color-rgb',
        `${rgb.r},${rgb.g},${rgb.b}`
      );

      if (window.BUNDLE_DATA) {
        window.BUNDLE_DATA.bundles.push({
          id: container.getAttribute('data-bundle-id'),
          type: 'upselling',
          productId: container.getAttribute('data-product-id'),
          variantId: container.getAttribute('data-current-variant-id'),
          variantPrice: parseInt(
            container.getAttribute('data-current-variant-price') || '0',
            10
          ),
        });
      }
    });
  }

  function init() {
    initDiscountedBundles();
    initUpsellingBundles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
