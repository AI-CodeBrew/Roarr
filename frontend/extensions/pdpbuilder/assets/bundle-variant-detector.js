/**
 * Bundle Variant Detector
 * Uses comprehensive variant selector patterns from pumper.js to detect variant changes
 * and update bundle displays accordingly
 */
(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.BUNDLE_VARIANT_DETECTOR_INITIALIZED) {
    return;
  }
  window.BUNDLE_VARIANT_DETECTOR_INITIALIZED = true;

  // Variant selector patterns from pumper.js
  const VARIANT_SELECTOR_PATTERNS = [
    // Direct variant selectors
    'select[name="id"]',
    'input[name="id"]',
    'input[type="radio"][name^="options"]',
    '[data-variant-id]',
    '[data-product-variant]',
    '[name="id"][value]',
    'input[type="radio"][name*="variant"]',
    'select[data-variant-selector]',
    '.product-form__input--dropdown select',
    '.tae-product-details-variant-btn',
    // Additional patterns from pumper.js default_variants_tags
    '.variant-wrapper select',
    '.variant-picker__form select',
    '.variant-option__select-wrapper select',
    '.product-variant__container input',
    '.option-selectors input',
    'options-selection fieldset input',
    'variant-picker__option-values input',
    '.product__selectors fieldset input',
    '.product-form__option-selector input',
    '.product-form__option input',
    '.form__selectors input',
    '.swatch_options input',
    'variant-radios fieldset input',
    'variant-selects fieldset input',
    '.product-form__input.product-form__input--pills input',
    '.product-form__input--dropdown select',
    'variant-button input',
    '.block-swatch-list input',
    'variant-selection select',
    'block-variant-picker fieldset input',
    'product-variant-selector input',
    '.swatch-items-wrapper input',
    '.swatch.selectors input',
    '.variant-wrapper fieldset input',
    'product-variants select',
    '.radio-wrapper.js.product-form__item fieldset input',
    'fieldset .variant-picker__option-values input',
    'fieldset select',
    '.product-form__controls-group select',
    '.selector-wrapper select',
    '.product-option-selector input',
    '.option-selector input',
    '.variant-input-wrap input',
    '.radio__fieldset input',
    '.product-form__option input',
    '.product__option select',
    '.swatch-options input',
    '.product-options select',
    '.single-option-selector',
    '.f8pr-variant-selection select',
    '.best-custom-product-options select',
    '.ProductForm__Variants input',
    'variant-radios-detail fieldset input',
    'variant-picker fieldset input',
    'div[data-product-option] fieldset input',
    '.selector-wrapper .single-option-radio input'
  ];

  // Variant parent containers to watch for clicks
  const VARIANT_CLICK_SELECTORS = [
    '[data-variant-id]',
    '[data-product-variant]',
    '[data-option-value]',
    '.swatch',
    '.variant-input',
    '.variant-option',
    '.product-option',
    '.color-swatch',
    '.option-selector__btns button',
    '.m-product-option--content',
    '.block-swatch',
    '.swatch-element',
    '.variant-picker__option-values label',
    '.product-form__input label'
  ];

  /**
   * Get current selected variant ID from various sources
   */
  function getCurrentVariantId() {
    console.log('[Bundle Variant Detector] Getting current variant ID...');

    // Try to get from select[name="id"]
    const variantSelect = document.querySelector('select[name="id"]');
    if (variantSelect && variantSelect.value) {
      console.log('[Bundle Variant Detector] Found variant ID from select[name="id"]:', variantSelect.value);
      return variantSelect.value;
    }

    // Try to get from checked radio input[name="id"]
    const variantRadio = document.querySelector('input[name="id"]:checked');
    if (variantRadio && variantRadio.value) {
      console.log('[Bundle Variant Detector] Found variant ID from input[name="id"]:checked:', variantRadio.value);
      return variantRadio.value;
    }

    // Try to get from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const variantParam = urlParams.get('variant');
    if (variantParam) {
      console.log('[Bundle Variant Detector] Found variant ID from URL parameter:', variantParam);
      return variantParam;
    }

    // Try to get from product-details selected variant button (handles custom variant selector)
    const selectedVariantBtn = document.querySelector('.tae-product-details-variant-btn.is-selected');
    if (selectedVariantBtn) {
      const variantId = selectedVariantBtn.getAttribute('data-variant-id');
      if (variantId) {
        console.log('[Bundle Variant Detector] Found variant ID from product-details selected button:', variantId);
        return variantId;
      }
    }

    // Try to get from data attributes (first matching element)
    const variantElement = document.querySelector('[data-variant-id]');
    if (variantElement) {
      const variantId = variantElement.getAttribute('data-variant-id');
      console.log('[Bundle Variant Detector] Found variant ID from data-variant-id attribute:', variantId);
      return variantId;
    }

    // Try to get from product form
    const productForm = document.querySelector('form[action*="/cart/add"]');
    if (productForm) {
      const formVariantInput = productForm.querySelector('input[name="id"]:checked, select[name="id"]');
      if (formVariantInput && formVariantInput.value) {
        console.log('[Bundle Variant Detector] Found variant ID from product form:', formVariantInput.value);
        return formVariantInput.value;
      }
    }

    // Try to get from Shopify theme variant object
    if (window.Shopify && window.Shopify.variants) {
      const selectedVariant = window.Shopify.variants.find(v => v.selected);
      if (selectedVariant) {
        console.log('[Bundle Variant Detector] Found variant ID from Shopify.variants:', selectedVariant.id);
        return String(selectedVariant.id);
      }
    }

    console.warn('[Bundle Variant Detector] Could not find variant ID from any source');
    return null;
  }

  // Cache for product data to avoid repeated fetches
  let productDataCache = null;
  let productHandleCache = null;

  /**
   * Get variant price from Shopify product data
   * Now fetches from product JSON endpoint if needed
   */
  async function getVariantPrice(variantId) {
    if (!variantId) {
      console.warn('[Bundle Variant Detector] getVariantPrice called without variantId');
      return null;
    }

    console.log('[Bundle Variant Detector] Getting price for variant:', variantId);

    // Try to get from Shopify theme variant object
    if (window.Shopify && window.Shopify.variants) {
      const variant = window.Shopify.variants.find(v => String(v.id) === String(variantId));
      if (variant && variant.price) {
        console.log('[Bundle Variant Detector] Found variant price from Shopify.variants:', variant.price);
        return variant.price;
      }
    }

    // Try to get from variant element data attributes
    const variantElement = document.querySelector(`[data-variant-id="${variantId}"], [value="${variantId}"]`);
    if (variantElement) {
      const price = variantElement.getAttribute('data-price') || variantElement.getAttribute('data-variant-price');
      if (price) {
        const priceInt = parseInt(price);
        console.log('[Bundle Variant Detector] Found variant price from element data attribute:', priceInt);
        return priceInt;
      }
    }

    // Try to get from product JSON cache
    if (productDataCache) {
      const variant = productDataCache.variants?.find(v => String(v.id) === String(variantId));
      if (variant && variant.price) {
        console.log('[Bundle Variant Detector] Found variant price from cached productData:', variant.price);
        return variant.price;
      }
    }

    // Try to get from window.productJson
    if (window.productJson) {
      const variant = window.productJson.variants?.find(v => String(v.id) === String(variantId));
      if (variant && variant.price) {
        console.log('[Bundle Variant Detector] Found variant price from productJson:', variant.price);
        return variant.price;
      }
    }

    // Fetch from product JSON endpoint
    try {
      // Get product handle from BUNDLE_DATA or try to extract from page
      let productHandle = null;

      if (window.BUNDLE_DATA && window.BUNDLE_DATA.productHandle) {
        productHandle = window.BUNDLE_DATA.productHandle;
        console.log('[Bundle Variant Detector] Using product handle from BUNDLE_DATA:', productHandle);
      } else {
        // Try to extract from URL or page
        const urlMatch = window.location.pathname.match(/\/products\/([^\/]+)/);
        if (urlMatch) {
          productHandle = urlMatch[1];
          console.log('[Bundle Variant Detector] Extracted product handle from URL:', productHandle);
        } else {
          // Try to get from meta tag or data attribute
          const productHandleMeta = document.querySelector('meta[property="product:handle"], [data-product-handle]');
          if (productHandleMeta) {
            productHandle = productHandleMeta.getAttribute('content') || productHandleMeta.getAttribute('data-product-handle');
            console.log('[Bundle Variant Detector] Found product handle from meta/data:', productHandle);
          }
        }
      }

      if (!productHandle) {
        console.warn('[Bundle Variant Detector] Could not determine product handle, cannot fetch product data');
        return null;
      }

      // Use cached product data if handle matches
      if (productHandleCache === productHandle && productDataCache) {
        console.log('[Bundle Variant Detector] Using cached product data for handle:', productHandle);
        const variant = productDataCache.variants?.find(v => String(v.id) === String(variantId));
        if (variant && variant.price) {
          console.log('[Bundle Variant Detector] Found variant price from cached product data:', variant.price);
          return variant.price;
        }
      }

      // Fetch product data from JSON endpoint
      console.log('[Bundle Variant Detector] Fetching product data from /products/' + productHandle + '.js');
      const response = await fetch('/products/' + productHandle + '.js');

      if (!response.ok) {
        console.error('[Bundle Variant Detector] Failed to fetch product data:', response.status, response.statusText);
        return null;
      }

      const productData = await response.json();
      console.log('[Bundle Variant Detector] Successfully fetched product data:', productData);

      // Cache the product data
      productDataCache = productData;
      productHandleCache = productHandle;

      // Find the selected variant
      const selectedVariant = productData.variants?.find(v => String(v.id) === String(variantId));

      if (selectedVariant) {
        console.log('[Bundle Variant Detector] Found variant in product data:', selectedVariant);
        console.log('[Bundle Variant Detector] Variant price (raw):', selectedVariant.price, 'Type:', typeof selectedVariant.price);

        if (selectedVariant.price) {
          // Shopify product JSON returns price in cents as a number
          const price = typeof selectedVariant.price === 'number' ? selectedVariant.price : parseInt(selectedVariant.price);
          console.log('[Bundle Variant Detector] Found variant price from fetched product data:', price, 'cents');
          return price;
        } else {
          console.warn('[Bundle Variant Detector] Variant found but has no price property');
        }
      } else {
        console.warn('[Bundle Variant Detector] Variant not found in fetched product data. Variant ID:', variantId);
        console.log('[Bundle Variant Detector] Available variant IDs:', productData.variants?.map(v => ({ id: v.id, title: v.title })));
      }
    } catch (error) {
      console.error('[Bundle Variant Detector] Error fetching product data:', error);
      return null;
    }

    console.warn('[Bundle Variant Detector] Could not find variant price for variant:', variantId);
    return null;
  }

  /**
   * Ensure money format is loaded from DOM (container data-money-format from Liquid).
   * This script does not maintain currency; formatting uses only the money format string.
   */
  function ensureMoneyFormatFromDom() {
    const container = document.querySelector('.bundle-save-container');
    if (!container) return;
    const format = container.getAttribute('data-money-format');
    if (format) window.SHOP_MONEY_FORMAT = format;
  }

  /**
   * Format price in cents using shop money format from Liquid (same as | money).
   * Uses only data-money-format; does not maintain or use currency in this script.
   */
  function formatMoney(cents) {
    if (typeof cents !== 'number') {
      console.warn('[Bundle Variant Detector] formatMoney called with non-number:', cents);
      return '';
    }

    ensureMoneyFormatFromDom();

    const amount = (cents / 100).toFixed(2);
    const amountNoDecimals = String(Math.round(cents / 100));

    const format = window.SHOP_MONEY_FORMAT;
    if (format && typeof format === 'string') {
      const formatted = format
        .replace(/\{\{\s*amount\s*\}\}/gi, amount)
        .replace(/\{\{\s*amount_no_decimals\s*\}\}/gi, amountNoDecimals)
        .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/gi, amount.replace('.', ','))
        .replace(/\{\{\s*amount_with_space_separator\s*\}\}/gi, amount.replace('.', ' '));
      if (formatted !== format) return formatted;
    }

    if (window.Shopify && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(cents);
    }

    return amount;
  }

  /**
   * Set price element content. If the formatted string contains HTML (from shop
   * money format e.g. <span class="money">), render as HTML so it displays
   * correctly instead of showing raw tags as text. Source is trusted (shop settings).
   */
  function setPriceContent(el, formattedPrice) {
    if (!el || formattedPrice == null || formattedPrice === '') return;
    const hasHtml = /<[^>]+>/.test(formattedPrice) || /&lt;|&gt;|&amp;/.test(formattedPrice);
    if (hasHtml) {
      el.innerHTML = formattedPrice;
    } else {
      el.textContent = formattedPrice;
    }
  }

  /**
   * Update bundle pricing when variant changes
   */
  function updateBundlePricing(variantId, variantPrice) {
    if (!variantPrice) {
      console.warn('[Bundle Variant Detector] No variant price found for variant:', variantId);
      return;
    }

    console.log('[Bundle Variant Detector] Updating bundle pricing for variant:', variantId, 'Price:', variantPrice);

    // Update bundle-save-container (discounted bundles)
    const bundleContainers = document.querySelectorAll('.bundle-save-container');
    console.log('[Bundle Variant Detector] Found', bundleContainers.length, 'bundle-save-container(s)');

    bundleContainers.forEach((container, index) => {
      const currentVariantId = container.getAttribute('data-current-variant-id');
      const bundleId = container.getAttribute('data-bundle-id');

      console.log(`[Bundle Variant Detector] Processing bundle container ${index + 1} (bundle ID: ${bundleId}, current variant: ${currentVariantId})`);

      // Update data attributes
      container.setAttribute('data-current-variant-id', variantId);
      container.setAttribute('data-current-variant-price', variantPrice);
      console.log(`[Bundle Variant Detector] Updated container ${index + 1} data attributes`);

      // Update pricing for each bundle option
      const bundleOptions = container.querySelectorAll('.bundle-option[data-quantity]');
      console.log(`[Bundle Variant Detector] Found ${bundleOptions.length} bundle option(s) in container ${index + 1}`);

      bundleOptions.forEach((option, optIndex) => {
        const quantity = parseInt(option.getAttribute('data-quantity') || '1');
        const discountType = option.getAttribute('data-discount-type') || 'percentage';
        const buyX = parseInt(option.getAttribute('data-buy-x') || '1');
        const getYFree = parseInt(option.getAttribute('data-get-y-free') || '1');

        console.log(`[Bundle Variant Detector] Processing option ${optIndex + 1}: qty=${quantity}, type=${discountType}, buyX=${buyX}, getYFree=${getYFree}`);

        let originalTotal = variantPrice * quantity;
        let discountedTotal = originalTotal;

        // Calculate discounted price based on discount type
        const discountBadge = option.querySelector('.bundle-option-discount');
        if (discountBadge) {
          const badgeText = discountBadge.textContent.trim();
          console.log(`[Bundle Variant Detector] Discount badge text: "${badgeText}"`);

          if (discountType === 'bogo') {
            // BOGO: Buy X Get Y Free
            const totalItems = buyX + getYFree;
            originalTotal = variantPrice * totalItems;
            discountedTotal = variantPrice * buyX;
            console.log(`[Bundle Variant Detector] BOGO calculation: originalTotal=${originalTotal}, discountedTotal=${discountedTotal}`);
          } else if (discountType === 'percentage') {
            // Percentage discount
            const percentageMatch = badgeText.match(/(\d+)%\s*OFF/i);
            if (percentageMatch) {
              const discountPercent = parseFloat(percentageMatch[1]);
              discountedTotal = originalTotal * (1 - discountPercent / 100);
              console.log(`[Bundle Variant Detector] Percentage calculation: ${discountPercent}% off, discountedTotal=${discountedTotal}`);
            }
          } else if (discountType === 'flat') {
            // Flat amount discount
            const flatMatch = badgeText.match(/flat\s*(\d+)/i);
            if (flatMatch) {
              const flatAmount = parseFloat(flatMatch[1]) * 100; // Convert to cents
              discountedTotal = originalTotal - flatAmount;
              if (discountedTotal < 0) discountedTotal = 0;
              console.log(`[Bundle Variant Detector] Flat discount calculation: ${flatAmount} off, discountedTotal=${discountedTotal}`);
            }
          } else if (discountType === 'specificPrice') {
            // Specific price
            const priceMatch = badgeText.match(/\$?(\d+\.?\d*)/);
            if (priceMatch) {
              discountedTotal = parseFloat(priceMatch[1]) * 100;
              console.log(`[Bundle Variant Detector] Specific price calculation: discountedTotal=${discountedTotal}`);
            }
          }
        }

        // Update price elements
        const priceElement = option.querySelector('.bundle-option-price');
        const originalPriceElement = option.querySelector('.bundle-option-original-price');

        if (priceElement) {
          const formattedPrice = formatMoney(discountedTotal);
          setPriceContent(priceElement, formattedPrice);
          console.log(`[Bundle Variant Detector] Updated option ${optIndex + 1} price to: ${formattedPrice}`);
        } else {
          console.warn(`[Bundle Variant Detector] Price element not found for option ${optIndex + 1}`);
        }

        if (originalPriceElement) {
          if (discountedTotal !== originalTotal) {
            setPriceContent(originalPriceElement, formatMoney(originalTotal));
            originalPriceElement.style.display = '';
          } else {
            originalPriceElement.style.display = 'none';
          }
        }
      });
    });

    // Update bundle-box (upselling bundles) - mainly update data attributes
    const bundleBoxes = document.querySelectorAll('.bundle-box');
    console.log('[Bundle Variant Detector] Found', bundleBoxes.length, 'bundle-box(es)');

    bundleBoxes.forEach((box, index) => {
      const bundleId = box.getAttribute('data-bundle-id');
      box.setAttribute('data-current-variant-id', variantId);
      console.log(`[Bundle Variant Detector] Updated bundle-box ${index + 1} (bundle ID: ${bundleId}) variant ID to: ${variantId}`);
    });

    console.log('[Bundle Variant Detector] Completed bundle pricing update for variant:', variantId);
  }

  /**
   * Handle variant change
   */
  async function handleVariantChange(event) {
    console.log('[Bundle Variant Detector] Variant change detected', event ? '(triggered by event)' : '(manual trigger)');

    // Small delay to ensure DOM is updated
    setTimeout(async () => {
      console.log('[Bundle Variant Detector] Processing variant change after delay...');

      const variantId = getCurrentVariantId();
      if (!variantId) {
        console.warn('[Bundle Variant Detector] Could not determine variant ID - aborting update');
        return;
      }

      console.log('[Bundle Variant Detector] Fetching variant price for variant:', variantId);
      const variantPrice = await getVariantPrice(variantId);

      if (variantPrice) {
        console.log('[Bundle Variant Detector] Variant ID and price found, updating bundles...');
        updateBundlePricing(variantId, variantPrice);
      } else {
        console.warn('[Bundle Variant Detector] Could not determine variant price for variant:', variantId, '- skipping bundle update');
      }

      // Dispatch custom event for other scripts
      const eventDetail = { variantId, variantPrice };
      console.log('[Bundle Variant Detector] Dispatching bundle:variant-changed event:', eventDetail);
      window.dispatchEvent(new CustomEvent('bundle:variant-changed', {
        detail: eventDetail
      }));
    }, 50);
  }

  /**
   * Setup variant change listeners
   */
  function setupVariantListeners() {
    console.log('[Bundle Variant Detector] Setting up variant listeners...');
    console.log('[Bundle Variant Detector] Total variant selector patterns:', VARIANT_SELECTOR_PATTERNS.length);
    console.log('[Bundle Variant Detector] Total variant click selectors:', VARIANT_CLICK_SELECTORS.length);

    let totalSelectorsFound = 0;
    let totalListenersAdded = 0;

    // 1. Listen for change events on variant selectors
    VARIANT_SELECTOR_PATTERNS.forEach((selector, index) => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          totalSelectorsFound += elements.length;
          console.log(`[Bundle Variant Detector] Found ${elements.length} element(s) for selector ${index + 1}: "${selector}"`);
        }

        elements.forEach((element, elIndex) => {
          try {
            // Don't clone/replace product-details variant buttons - they have their own handlers
            // and we listen for variantChanged event. Cloning would break their functionality.
            const isProductDetailsButton = selector === '.tae-product-details-variant-btn';
            const targetElement = isProductDetailsButton ? element : (() => {
              const newElement = element.cloneNode(true);
              element.parentNode.replaceChild(newElement, element);
              return newElement;
            })();

            // Add change listener
            targetElement.addEventListener('change', (e) => {
              console.log(`[Bundle Variant Detector] Change event on selector "${selector}" element ${elIndex + 1}`);
              handleVariantChange(e);
            });
            totalListenersAdded++;

            // For variant buttons, also listen to click events
            if (selector.includes('button') || selector.includes('btn')) {
              targetElement.addEventListener('click', (e) => {
                console.log(`[Bundle Variant Detector] Click event on selector "${selector}" element ${elIndex + 1}`);
                handleVariantChange(e);
              });
              totalListenersAdded++;
            }
          } catch (elError) {
            console.warn(`[Bundle Variant Detector] Error adding listener to element ${elIndex + 1} of selector "${selector}":`, elError);
          }
        });
      } catch (e) {
        console.warn(`[Bundle Variant Detector] Error processing selector "${selector}":`, e.message);
      }
    });

    console.log(`[Bundle Variant Detector] Added ${totalListenersAdded} listener(s) to ${totalSelectorsFound} element(s)`);

    // 2. Listen for clicks on variant containers (delegated)
    let clickListenersAdded = 0;
    VARIANT_CLICK_SELECTORS.forEach((selector, index) => {
      try {
        document.addEventListener('click', (e) => {
          const clickedElement = e.target.closest(selector);
          if (clickedElement) {
            console.log(`[Bundle Variant Detector] Click detected on variant container: "${selector}"`);
            handleVariantChange(e);
          }
        }, true);
        clickListenersAdded++;
      } catch (e) {
        console.warn(`[Bundle Variant Detector] Error setting up click listener for selector "${selector}":`, e.message);
      }
    });
    console.log(`[Bundle Variant Detector] Added ${clickListenersAdded} delegated click listener(s)`);

    // 3. Listen for URL changes (variant parameter)
    let lastVariant = new URLSearchParams(window.location.search).get('variant');
    console.log('[Bundle Variant Detector] Initial URL variant parameter:', lastVariant);

    const urlObserver = new MutationObserver(() => {
      const currentVariant = new URLSearchParams(window.location.search).get('variant');
      if (currentVariant !== lastVariant) {
        console.log('[Bundle Variant Detector] URL variant parameter changed from', lastVariant, 'to', currentVariant);
        lastVariant = currentVariant;
        handleVariantChange();
      }
    });
    urlObserver.observe(document, { childList: true, subtree: true });
    console.log('[Bundle Variant Detector] URL mutation observer setup complete');

    // 4. Listen for popstate (browser back/forward)
    window.addEventListener('popstate', (e) => {
      console.log('[Bundle Variant Detector] Popstate event detected (browser navigation)');
      handleVariantChange(e);
    });
    console.log('[Bundle Variant Detector] Popstate listener added');

    // 5. Intercept history.pushState and history.replaceState
    ['pushState', 'replaceState'].forEach(fn => {
      const orig = history[fn];
      history[fn] = function () {
        console.log(`[Bundle Variant Detector] History.${fn} called`);
        const ret = orig.apply(this, arguments);
        handleVariantChange();
        return ret;
      };
    });
    console.log('[Bundle Variant Detector] History API interceptors setup complete');

    // 6. Listen for custom variant change events
    const customEvents = ['variantChanged', 'variant:change', 'shopify:variant:change'];
    customEvents.forEach(eventName => {
      document.addEventListener(eventName, (e) => {
        console.log(`[Bundle Variant Detector] Custom event "${eventName}" received:`, e.detail);
        handleVariantChange(e);
      });
    });
    console.log(`[Bundle Variant Detector] Custom event listeners added for: ${customEvents.join(', ')}`);

    // 7. Listen for Shopify theme variant change events
    if (window.Shopify && window.Shopify.onVariantChange) {
      const originalOnVariantChange = window.Shopify.onVariantChange;
      window.Shopify.onVariantChange = function (variant) {
        console.log('[Bundle Variant Detector] Shopify.onVariantChange called with variant:', variant);
        if (originalOnVariantChange) {
          originalOnVariantChange.call(this, variant);
        }
        handleVariantChange();
      };
      console.log('[Bundle Variant Detector] Shopify.onVariantChange interceptor setup complete');
    } else {
      console.log('[Bundle Variant Detector] Shopify.onVariantChange not available');
    }

    console.log('[Bundle Variant Detector] Variant listeners setup complete');
    console.log('[Bundle Variant Detector] Summary:', {
      selectorPatterns: VARIANT_SELECTOR_PATTERNS.length,
      clickSelectors: VARIANT_CLICK_SELECTORS.length,
      elementsFound: totalSelectorsFound,
      listenersAdded: totalListenersAdded + clickListenersAdded
    });
  }

  /**
   * Initialize variant detector
   */
  function init() {
    console.log('[Bundle Variant Detector] Initializing...');
    console.log('[Bundle Variant Detector] Document ready state:', document.readyState);
    console.log('[Bundle Variant Detector] Window.Shopify available:', !!window.Shopify);
    console.log('[Bundle Variant Detector] Window.productJson available:', !!window.productJson);
    console.log('[Bundle Variant Detector] Window.BUNDLE_DATA available:', !!window.BUNDLE_DATA);

    if (window.BUNDLE_DATA) {
      console.log('[Bundle Variant Detector] BUNDLE_DATA:', window.BUNDLE_DATA);
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      console.log('[Bundle Variant Detector] DOM still loading, waiting for DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[Bundle Variant Detector] DOMContentLoaded fired, setting up listeners...');
        setupVariantListeners();
        // Initial check
        console.log('[Bundle Variant Detector] Running initial variant check...');
        handleVariantChange();
      });
    } else {
      console.log('[Bundle Variant Detector] DOM already ready, setting up listeners immediately...');
      setupVariantListeners();
      // Initial check
      console.log('[Bundle Variant Detector] Running initial variant check...');
      handleVariantChange();
    }
  }

  // Start initialization
  console.log('[Bundle Variant Detector] Script loaded, starting initialization...');
  init();
  console.log('[Bundle Variant Detector] Initialization function called');
})();
