(() => {
  // Prevent multiple initializations
  if (window.QUANTITY_DISCOUNT_BUNDLES_INITIALIZED) {
    return;
  }
  window.QUANTITY_DISCOUNT_BUNDLES_INITIALIZED = true;

  /**
   * Initialize quantity discount bundle functionality
   * This handles the "Bundle & Save" quantity discount bundles
   */
  function initQuantityDiscountBundles() {
    const bundleContainers = document.querySelectorAll(
      ".bundle-save-container"
    );

    bundleContainers.forEach((container) => {
      // Skip if already initialized
      if (container.dataset.bundleInitialized === "true") {
        return;
      }
      container.dataset.bundleInitialized = "true";

      // Get product ID and current variant from data attributes
      const productId = container.getAttribute("data-product-id");
      let currentVariantId = container.getAttribute("data-current-variant-id");

      if (!productId) {
        console.warn("[Bundle] No product ID found on bundle container");
        return;
      }

      /** Parse a displayed money string (e.g. "$200.00") into cents. */
      function parseMoneyTextToCents(text) {
        if (!text) return 0;
        const match = String(text).replace(/\s/g, "").match(/[\d,.]+/);
        if (!match) return 0;
        const raw = match[0];
        // Prefer the last separator as decimal when both , and . appear
        let normalized = raw;
        if (raw.includes(",") && raw.includes(".")) {
          normalized =
            raw.lastIndexOf(",") > raw.lastIndexOf(".")
              ? raw.replace(/\./g, "").replace(",", ".")
              : raw.replace(/,/g, "");
        } else if (raw.includes(",")) {
          normalized = /,\d{2}$/.test(raw)
            ? raw.replace(",", ".")
            : raw.replace(/,/g, "");
        }
        const dollars = parseFloat(normalized);
        if (!Number.isFinite(dollars) || dollars <= 0) return 0;
        return Math.round(dollars * 100);
      }

      /**
       * Resolve unit price in cents. On homepage the app block has no Liquid
       * `product`, so data-current-variant-price is 0 — fall back to the
       * surrounding product hero / price DOM.
       */
      function resolveVariantPrice() {
        const attrPrice = parseInt(
          container.getAttribute("data-current-variant-price") || "0",
          10
        );
        if (Number.isFinite(attrPrice) && attrPrice > 0) return attrPrice;

        const host =
          container.closest('[id^="ModernProduct-"]') ||
          container.closest(".product-split") ||
          document;

        const hostPrice = parseInt(
          host.getAttribute?.("data-product-price") || "0",
          10
        );
        if (Number.isFinite(hostPrice) && hostPrice > 0) return hostPrice;

        const variantId =
          container.getAttribute("data-current-variant-id") ||
          currentVariantId;
        const variantsRaw = host.getAttribute?.("data-variants");
        if (variantsRaw) {
          try {
            const variants = JSON.parse(variantsRaw);
            if (Array.isArray(variants) && variants.length) {
              const match =
                (variantId &&
                  variants.find((v) => {
                    const id = String(v.id || "");
                    return (
                      id === String(variantId) ||
                      id.endsWith("/" + variantId) ||
                      id.split("/").pop() === String(variantId)
                    );
                  })) ||
                variants[0];
              const cents = parseInt(match?.price, 10);
              if (Number.isFinite(cents) && cents > 0) return cents;
            }
          } catch (e) {
            /* ignore bad JSON */
          }
        }

        const priceEl = host.querySelector?.(
          ".modern-product__price, [data-price-current], .tae-product-details-price-current, .product-price, .price--current"
        );
        const fromDom = parseMoneyTextToCents(priceEl?.textContent);
        if (fromDom > 0) return fromDom;

        return 0;
      }

      let currentVariantPrice = resolveVariantPrice();
      if (currentVariantPrice > 0) {
        container.setAttribute(
          "data-current-variant-price",
          String(currentVariantPrice)
        );
      }

      // Store bundle tier data for price recalculation
      const bundleTiers = [];
      const bundleOptions = container.querySelectorAll(".bundle-option[data-quantity]");
      if (bundleOptions.length === 0) {
        return;
      }
      bundleOptions.forEach((option) => {
        const quantity = parseInt(option.getAttribute("data-quantity"));
        const discountType = option.getAttribute("data-discount-type") || "percentage";
        const buyX = discountType === "bogo" ? parseInt(option.getAttribute("data-buy-x") || "1") : null;
        const getYFree = discountType === "bogo" ? parseInt(option.getAttribute("data-get-y-free") || "1") : null;
        const priceElement = option.querySelector(".bundle-option-price");
        const originalPriceElement = option.querySelector(".bundle-option-original-price");
        // Buy 1 / standard often has no strikethrough original — still track the tier.
        if (priceElement) {
          bundleTiers.push({
            quantity: quantity,
            discountType: discountType,
            buyX: buyX,
            getYFree: getYFree,
            priceElement: priceElement,
            originalPriceElement: originalPriceElement,
            option: option
          });
        }
      });

      let selectedQuantity = null;

      // Function to calculate discounted price based on tier and variant price
      function calculateTierPrice(variantPrice, tier) {
        const discountType = tier.discountType || "percentage";
        let originalTotal;
        let discountedTotal;
        
        if (discountType === "bogo") {
          // BOGO: Buy X Get Y Free
          const buyX = tier.buyX || 1;
          const getYFree = tier.getYFree || 1;
          const totalItems = buyX + getYFree;
          originalTotal = variantPrice * totalItems; // Customer receives X + Y items
          discountedTotal = variantPrice * buyX; // Customer pays for X items only
        } else {
          // Other discount types (percentage, flat, specificPrice)
          const tierQty = tier.quantity;
          originalTotal = variantPrice * tierQty;
          discountedTotal = originalTotal;
          
          // Get discount info from the tier option
          const discountBadge = tier.option.querySelector(".bundle-option-discount");
          if (discountBadge) {
            const badgeText = discountBadge.textContent.trim();
            
            // Try to parse percentage discount
            const percentageMatch = badgeText.match(/(\d+)%\s*OFF/i);
            if (percentageMatch) {
              const discountPercent = parseFloat(percentageMatch[1]);
              discountedTotal = originalTotal * (1 - discountPercent / 100);
            } else {
              // Try to parse flat amount
              const flatMatch = badgeText.match(/flat\s*(\d+)/i);
              if (flatMatch) {
                const flatAmount = parseFloat(flatMatch[1]) * 100; // Convert to cents
                discountedTotal = originalTotal - flatAmount;
                if (discountedTotal < 0) discountedTotal = 0;
              }
            }
          }
        }
        
        return {
          original: originalTotal,
          discounted: Math.round(discountedTotal)
        };
      }

      // Function to update prices based on current variant price
      function updatePricesForVariant(variantPrice) {
        if (!variantPrice || variantPrice <= 0) return;
        
        // Use money format from container (set by Liquid | money / shop.money_format); do not maintain currency in this script
        const moneyFormat = container.getAttribute('data-money-format') || window.SHOP_MONEY_FORMAT;
        if (moneyFormat) window.SHOP_MONEY_FORMAT = moneyFormat;

        bundleTiers.forEach((tier) => {
          const prices = calculateTierPrice(variantPrice, tier);
          
          const formatMoney = (cents) => {
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
          };
          
          tier.priceElement.textContent = formatMoney(prices.discounted);
          if (tier.originalPriceElement) {
            if (prices.discounted !== prices.original) {
              tier.originalPriceElement.textContent = formatMoney(prices.original);
              tier.originalPriceElement.style.display = '';
            } else {
              tier.originalPriceElement.style.display = 'none';
            }
          } else if (prices.discounted !== prices.original) {
            // Create strikethrough original when Liquid omitted it (e.g. was $0)
            const pricing = tier.priceElement.parentElement;
            if (pricing) {
              const orig = document.createElement("div");
              orig.className = "bundle-option-original-price";
              orig.textContent = formatMoney(prices.original);
              pricing.appendChild(orig);
              tier.originalPriceElement = orig;
            }
          }
        });
      }

      // Function to find and update quantity input
      function findAndUpdateQuantity(qty) {
        console.log("[Bundle] Finding and updating quantity", qty);
        selectedQuantity = qty;

        const productForm = document.querySelector(
          'form[action*="/cart/add"], form.product-form, form[data-product-form]'
        );
        if (productForm) {
          const quantitySelectors = [
            'input[name="quantity"]',
            'select[name="quantity"]',
            "input[data-quantity-input]",
            'input[id*="quantity"]',
            'select[id*="quantity"]',
            ".quantity-input input",
            ".product-form__quantity input",
            ".tae-buy-now-quantity-input",
            "input.tae-buy-now-quantity-input",
            '[name="quantity"]',
          ];

          for (let selector of quantitySelectors) {
            const qtyInput = productForm.querySelector(selector);
            if (qtyInput) {
              qtyInput.value = qty;
              qtyInput.dispatchEvent(new Event("change", { bubbles: true }));
              qtyInput.dispatchEvent(new Event("input", { bubbles: true }));
              return true;
            }
          }
        }

        // Get current variant ID from container
        const currentVariantId = container.getAttribute("data-current-variant-id");
        if (!currentVariantId) return false;

        const variantInputs = document.querySelectorAll(
          'input[value="' +
          currentVariantId +
          '"], input[name="id"][value="' +
          currentVariantId +
          '"]'
        );
        variantInputs.forEach(function (input) {
          const form = input.closest("form");
          if (form) {
            const qtySelectors = [
              'input[name="quantity"]',
              'select[name="quantity"]',
              "input[data-quantity-input]",
              ".tae-buy-now-quantity-input",
              "input.tae-buy-now-quantity-input",
            ];
            qtySelectors.forEach(function (sel) {
              const qtyInput = form.querySelector(sel);
              if (qtyInput) {
                qtyInput.value = qty;
                qtyInput.dispatchEvent(new Event("change", { bubbles: true }));
                qtyInput.dispatchEvent(new Event("input", { bubbles: true }));
              }
            });
          }
        });

        const allQuantityInputs = document.querySelectorAll(
          'input[name="quantity"], select[name="quantity"], .tae-buy-now-quantity-input, input.tae-buy-now-quantity-input'
        );
        allQuantityInputs.forEach(function (input) {
          if (input.offsetParent !== null) {
            input.value = qty;
            input.dispatchEvent(new Event("change", { bubbles: true }));
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });

        // Also check for Buy Now button quantity inputs with dynamic data attributes (data-quantity-input-*)
        const buyNowQuantityInputs = document.querySelectorAll('input[class*="tae-buy-now-quantity-input"]');
        buyNowQuantityInputs.forEach(function (input) {
          if (input.offsetParent !== null) {
            input.value = qty;
            input.dispatchEvent(new Event("change", { bubbles: true }));
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });

        // Find inputs with data-quantity-input-* attributes (for Buy Now button with instance IDs)
        const allInputs = document.querySelectorAll('input');
        allInputs.forEach(function (input) {
          if (input.offsetParent !== null) {
            const attributes = Array.from(input.attributes);
            const hasQuantityInputAttr = attributes.some(function (attr) {
              return attr.name.startsWith('data-quantity-input-');
            });
            if (hasQuantityInputAttr) {
              input.value = qty;
              input.dispatchEvent(new Event("change", { bubbles: true }));
              input.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }
        });

        return false;
      }

      // Keep radios + data-selected in sync (CSS highlights via :checked only)
      function updateVisualStates(selectedOption) {
        const allOptions = container.querySelectorAll(".bundle-option");
        allOptions.forEach(function (opt) {
          opt.removeAttribute("data-selected");
          const r = opt.querySelector(".bundle-quantity-radio");
          if (r && opt !== selectedOption) r.checked = false;
        });

        if (selectedOption) {
          selectedOption.setAttribute("data-selected", "true");
          const selectedRadio = selectedOption.querySelector(
            ".bundle-quantity-radio"
          );
          if (selectedRadio) selectedRadio.checked = true;
        }
      }

      // Set up bundle option listeners
      const allBundleOptions = container.querySelectorAll(".bundle-option");
      allBundleOptions.forEach(function (option) {
        const radio = option.querySelector(".bundle-quantity-radio");
        const quantity = parseInt(option.getAttribute("data-quantity"));

        option.addEventListener("click", function (e) {
          if (e.target !== radio) {
            radio.checked = true;
          }
          updateQuantity(quantity, option);
        });

        radio.addEventListener("change", function () {
          if (this.checked) {
            updateQuantity(quantity, option);
          }
        });
      });

      function updateQuantity(qty, selectedOption) {
        const isSkipBundle =
          selectedOption && selectedOption.hasAttribute("data-skip-bundle");

        if (isSkipBundle) {
          selectedQuantity = 1;
          findAndUpdateQuantity(selectedQuantity);
          console.log(
            "[Bundle] Skip bundle selected, selectedQuantity set to null"
          );
        } else {
          // Check if this is a BOGO tier
          const discountType = selectedOption?.getAttribute("data-discount-type") || "percentage";
          let quantityToAdd = qty;
          
          if (discountType === "bogo") {
            // For BOGO, add buyX + getYFree items to cart
            const buyX = parseInt(selectedOption.getAttribute("data-buy-x") || "1");
            const getYFree = parseInt(selectedOption.getAttribute("data-get-y-free") || "1");
            quantityToAdd = buyX + getYFree;
            console.log(`[Bundle] BOGO selected: Buy ${buyX} Get ${getYFree} Free - adding ${quantityToAdd} items to cart`);
          }
          
          findAndUpdateQuantity(quantityToAdd);
        }

        updateVisualStates(selectedOption);

        if (qty > 0 && !isSkipBundle) {
          const currentVariantId = container.getAttribute("data-current-variant-id");
          const discountType = selectedOption?.getAttribute("data-discount-type") || "percentage";
          let finalQuantity = qty;
          
          if (discountType === "bogo") {
            const buyX = parseInt(selectedOption.getAttribute("data-buy-x") || "1");
            const getYFree = parseInt(selectedOption.getAttribute("data-get-y-free") || "1");
            finalQuantity = buyX + getYFree;
          }
          
          window.dispatchEvent(
            new CustomEvent("bundle:quantity-changed", {
              detail: { quantity: finalQuantity, variantId: currentVariantId, productId: productId },
            })
          );
        }
      }

      // Helper function to extract numeric variant ID from GID or numeric string
      function extractVariantId(variantId) {
        if (!variantId) return null;
        // If it's a GID format (gid://shopify/ProductVariant/123), extract the numeric part
        if (typeof variantId === 'string' && variantId.includes('/')) {
          const parts = variantId.split('/');
          return parts[parts.length - 1];
        }
        // If it's already numeric, return as string
        return String(variantId);
      }

      // Helper function to get full GID from numeric ID
      function getVariantGid(numericId) {
        if (!numericId) return null;
        // If it's already a GID, return as is
        if (String(numericId).includes('gid://')) {
          return numericId;
        }
        // Otherwise construct GID
        return `gid://shopify/ProductVariant/${numericId}`;
      }

      // Listen for variant changes
      function setupVariantChangeListener() {
        // Listen for variant selector changes
        const variantSelectors = [
          'select[name="id"]',
          'input[name="id"]:checked',
          '[name="id"][value]',
          'input[type="radio"][name*="variant"]',
          'select[data-variant-selector]',
          '.product-form__input--dropdown select',
          '.tae-product-details-variant-btn'
        ];

        variantSelectors.forEach((selector) => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element) => {
            element.addEventListener("change", function() {
              handleVariantChange();
            });
            // For variant buttons, listen to click events
            if (selector === '.tae-product-details-variant-btn') {
              element.addEventListener("click", function() {
                // Small delay to ensure the button's data attributes are updated
                setTimeout(() => handleVariantChange(), 50);
              });
            }
          });
        });

        // Listen for custom variant change events from product-details.js
        document.addEventListener("variantChanged", function(e) {
          console.log("[Bundle] Received variantChanged event", e.detail);
          handleVariantChange(e.detail);
        });

        // Listen for other variant change events
        document.addEventListener("variant:change", function(e) {
          handleVariantChange(e.detail);
        });

        // Listen for bundle variant detector events
        document.addEventListener("bundle:variant-changed", function(e) {
          console.log("[Bundle] Received bundle:variant-changed event", e.detail);
          handleVariantChange(e.detail);
        });

        // Listen for URL changes (variant parameter)
        let lastVariant = new URLSearchParams(window.location.search).get("variant");
        const urlObserver = new MutationObserver(() => {
          const currentVariant = new URLSearchParams(window.location.search).get("variant");
          if (currentVariant !== lastVariant) {
            lastVariant = currentVariant;
            handleVariantChange();
          }
        });
        urlObserver.observe(window, { childList: true, subtree: true });
      }

      // Handle variant change
      function handleVariantChange(variantData) {
        console.log("[Bundle] Variant changed", variantData);
        
        // Get current variant ID and price
        let newVariantId = null;
        let newVariantPrice = null;

        if (variantData) {
          newVariantId = variantData.variantId || variantData.id;
          newVariantPrice = variantData.price || variantData.variantPrice;
        } else {
          // Try to get from selected variant button (priority - most reliable)
          const selectedVariantButton = document.querySelector('.tae-product-details-variant-btn.is-selected, [data-variant-id].is-selected, [data-variant-id][aria-selected="true"]');
          if (selectedVariantButton) {
            newVariantId = selectedVariantButton.getAttribute('data-variant-id');
            const priceAttr = selectedVariantButton.getAttribute('data-variant-price');
            if (priceAttr) {
              newVariantPrice = parseInt(priceAttr);
            }
          }

          // If not found, try to get from form
          if (!newVariantId) {
            const variantInput = document.querySelector('input[name="id"]:checked, select[name="id"], input[name="id"][value]');
            if (variantInput) {
              newVariantId = variantInput.value;
            }
          }

          // Try to get price from variant selector or price display
          if (!newVariantPrice) {
            newVariantPrice = resolveVariantPrice();
          }

          if (!newVariantPrice) {
            const priceElement = document.querySelector('[data-price-current], .modern-product__price, .product-price, .price--current');
            if (priceElement) {
              newVariantPrice = parseMoneyTextToCents(priceElement.textContent);
            }
          }

          // Try to get from data attributes on variant buttons (fallback)
          if (!newVariantPrice) {
            const variantButtons = document.querySelectorAll('[data-variant-id][data-variant-price]');
            variantButtons.forEach((btn) => {
              if (btn.classList.contains('is-selected') || btn.getAttribute('aria-selected') === 'true') {
                if (!newVariantId) {
                  newVariantId = btn.getAttribute('data-variant-id');
                }
                if (!newVariantPrice) {
                  newVariantPrice = parseInt(btn.getAttribute('data-variant-price') || '0');
                }
              }
            });
          }
        }

        // Extract numeric variant ID for comparison
        const currentVariantId = container.getAttribute("data-current-variant-id");
        const currentNumericId = extractVariantId(currentVariantId);
        const newNumericId = extractVariantId(newVariantId);

        if (newVariantId && newNumericId !== currentNumericId) {
          // Update container data attributes with numeric ID (for consistency)
          container.setAttribute("data-current-variant-id", newNumericId);
          
          // Also store the full GID if we have it
          const variantGid = getVariantGid(newNumericId);
          if (variantGid) {
            container.setAttribute("data-current-variant-gid", variantGid);
          }

          if (newVariantPrice && newVariantPrice > 0) {
            container.setAttribute("data-current-variant-price", newVariantPrice);
            updatePricesForVariant(newVariantPrice);
          } else {
            console.warn("[Bundle] Could not determine variant price, prices may not update correctly");
          }

          console.log("[Bundle] Updated variant:", { 
            variantId: newVariantId, 
            numericId: newNumericId,
            price: newVariantPrice,
            previousId: currentVariantId
          });

          // Dispatch event for other components
          window.dispatchEvent(
            new CustomEvent("bundle:variant-changed", {
              detail: { 
                variantId: newNumericId, 
                variantGid: variantGid,
                price: newVariantPrice,
                productId: productId 
              },
            })
          );
        } else if (newVariantId) {
          console.log("[Bundle] Variant unchanged or already updated:", { 
            newVariantId, 
            currentVariantId,
            newNumericId,
            currentNumericId
          });
        }
      }

      // Setup variant change listener
      setupVariantChangeListener();

      // Apply prices immediately — critical when Liquid had no product (homepage).
      if (currentVariantPrice > 0) {
        updatePricesForVariant(currentVariantPrice);
      } else {
        // DOM may still be settling; retry once shortly.
        setTimeout(function () {
          const retryPrice = resolveVariantPrice();
          if (retryPrice > 0) {
            currentVariantPrice = retryPrice;
            container.setAttribute(
              "data-current-variant-price",
              String(retryPrice)
            );
            updatePricesForVariant(retryPrice);
          }
        }, 50);
      }

      // Set initial selected state
      const checkedRadio = container.querySelector(
        ".bundle-quantity-radio:checked"
      );
      if (checkedRadio) {
        const checkedOption = checkedRadio.closest(".bundle-option");
        if (checkedOption) {
          const qty = parseInt(checkedOption.getAttribute("data-quantity"));
          updateQuantity(qty, checkedOption);
        }
      }

    });
  }

  // Initialize quantity discount bundles when DOM is ready
  function initBundles() {
    initQuantityDiscountBundles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBundles);
  } else {
    initBundles();
  }

  // Also initialize when new bundle containers are added dynamically
  const bundleObserver = new MutationObserver(function () {
    initQuantityDiscountBundles();
  });

  bundleObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
