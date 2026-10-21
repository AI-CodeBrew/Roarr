// (() => {
//   // Prevent multiple initializations
//   if (window.FREE_BUNDLES_SYNC_INITIALIZED) {
//     console.log("[Bundle Sync] Already initialized, skipping...");
//     return;
//   }
//   window.FREE_BUNDLES_SYNC_INITIALIZED = true;
//   console.log("[Bundle Sync] 🚀 Initializing bundle upsell sync script");

//   // Flag variables to track flow state
//   let isBuyNowFlow = false;
//   let isAddingFreeItems = false;

//   /**
//    * Get selected variant ID for a bundle item
//    * @param {number} itemIndex - Index of the bundle item
//    * @returns {string|null} - Selected variant ID or null
//    */
//   function getSelectedVariantForItem(itemIndex) {
//     const bundleBox = document.querySelector('.bundle-box');
//     if (!bundleBox) return null;

//     const variantSelect = bundleBox.querySelector(`.bundle-variant-select[data-item-index="${itemIndex}"]`);
//     if (variantSelect) {
//       return variantSelect.value;
//     }

//     // Fallback to default variant ID from data attribute
//     const itemCard = bundleBox.querySelector(`.bundle-box-upsell-item-card[data-item-index="${itemIndex}"]`);
//     if (itemCard) {
//       return itemCard.getAttribute('data-default-variant-id');
//     }

//     return null;
//   }

//   /**
//    * Get product ID from variant ID
//    * @param {string|number} variantId - The variant ID
//    * @returns {string|number|null} - Product ID or null
//    */
//   function getProductIdFromVariant(variantId) {
//     // Try to get from bundle box data attribute
//     const bundleBox = document.querySelector('.bundle-box');
//     if (bundleBox) {
//       const productId = bundleBox.getAttribute('data-product-id');
//       if (productId) return productId;
//     }

//     // Try to get from product form or variant selector
//     const variantInput = document.querySelector(`input[value="${variantId}"], select option[value="${variantId}"]`);
//     if (variantInput) {
//       const form = variantInput.closest('form');
//       if (form) {
//         const productIdInput = form.querySelector('[data-product-id]');
//         if (productIdInput) return productIdInput.getAttribute('data-product-id');
//       }
//     }

//     return null;
//   }

//   /**
//    * Fetch product free variants based on scope (product level or global)
//    * Priority: Product scope > Global scope
//    * @param {string|number} variantId - The variant ID (used to get product ID)
//    * @returns {Array|null} - Array of free variant configs or null if none found
//    */
//   function fetchProductFreeVariants(variantId) {
//     console.log(`[Bundle Sync] 🔍 Fetching free variants for variant: ${variantId}`);

//     // Get product ID from variant
//     const productId = getProductIdFromVariant(variantId);
    
//     // PRIORITY 1: Check product-specific scope first (highest priority)
//     if (productId && window.FREE_BUNDLES_PRODUCT_BUNDLES && window.FREE_BUNDLES_PRODUCT_BUNDLES[productId]) {
//       console.log(`[Bundle Sync] ✅ Found PRODUCT SCOPE bundle for product ${productId}`);
//       const config = window.FREE_BUNDLES_PRODUCT_BUNDLES[productId];
      
//       // Normalize to array format
//       let freeVariants = [];
//       if (Array.isArray(config)) {
//         freeVariants = config.map((item) => ({
//           freeVariantId: item.freeVariantId || item.variantId || item.f,
//           freeQuantity: item.freeQuantity || item.upsellQuantity || item.q || 1,
//           discountPercentage: item.discountPercentage !== undefined ? parseFloat(item.discountPercentage) : (item.d !== undefined ? parseFloat(item.d) : 100),
//         }));
//       }
      
//       console.log(`[Bundle Sync] 📊 PRODUCT SCOPE free variants:`, {
//         scope: "PRODUCT",
//         productId: productId,
//         variantId: variantId,
//         freeVariants: freeVariants,
//         count: freeVariants.length
//       });
      
//       return freeVariants;
//     }

//     // PRIORITY 2: Check global scope (fallback if no product-specific bundle)
//     if (
//       window.FREE_BUNDLES_GLOBAL_BUNDLES &&
//       window.FREE_BUNDLES_GLOBAL_BUNDLES['shop']
//     ) {
//       console.log(`[Bundle Sync] ✅ Found GLOBAL SCOPE bundle`);
//       const globalConfig = window.FREE_BUNDLES_GLOBAL_BUNDLES['shop'];

//       // Normalize to array format
//       let freeVariants = [];

//       if (Array.isArray(globalConfig) && globalConfig.length > 0) {
//         freeVariants = globalConfig.map((item) => ({
//           freeVariantId: item.freeVariantId || item.variantId || item.f,
//           freeQuantity: item.freeQuantity || item.upsellQuantity || item.q || 1,
//           discountPercentage:
//             item.discountPercentage !== undefined
//               ? parseFloat(item.discountPercentage)
//               : (item.d !== undefined ? parseFloat(item.d) : 100),
//         }));
//       } else if (typeof globalConfig === "object" && (globalConfig.freeVariantId || globalConfig.f)) {
//         // Single object format
//         freeVariants = [
//           {
//             freeVariantId: globalConfig.freeVariantId || globalConfig.variantId || globalConfig.f,
//             freeQuantity: globalConfig.freeQuantity || globalConfig.upsellQuantity || globalConfig.q || 1,
//             discountPercentage:
//               globalConfig.discountPercentage !== undefined
//                 ? parseFloat(globalConfig.discountPercentage)
//                 : (globalConfig.d !== undefined ? parseFloat(globalConfig.d) : 100),
//           },
//         ];
//       } else if (
//         typeof globalConfig === "object" &&
//         globalConfig.freeItems &&
//         Array.isArray(globalConfig.freeItems)
//       ) {
//         // Object with freeItems array
//         freeVariants = globalConfig.freeItems.map((item) => ({
//           freeVariantId: item.freeVariantId,
//           freeQuantity: item.freeQuantity || 1,
//           discountPercentage:
//             item.discountPercentage !== undefined
//               ? parseFloat(item.discountPercentage)
//               : 100,
//         }));
//       }

//       console.log(`[Bundle Sync] 📊 GLOBAL SCOPE free variants:`, {
//         scope: "GLOBAL",
//         variantId: variantId,
//         freeVariants: freeVariants,
//         count: freeVariants.length
//       });

//       return freeVariants;
//     } else {
//       console.log(`[Bundle Sync] ⚠️ No GLOBAL SCOPE bundle found`);
//     }

//     console.log(`[Bundle Sync] ❌ No free variants found for product ${productId || 'N/A'} (checked both PRODUCT and GLOBAL scope)`);
//     return null;
//   }

//   /**
//    * Add free item to cart
//    * @param {string|number} variantId - Variant ID to add
//    * @param {number} quantity - Quantity to add
//    * @param {object} bundleConfig - Bundle configuration
//    * @param {string|number} triggerVariantId - Trigger variant ID
//    * @returns {Promise} - Fetch response
//    */
//   async function addFreeItemToCart(variantId, quantity = 1, bundleConfig = null, triggerVariantId = null) {
//     console.log(`[Bundle Sync] ➕ Adding free item to cart:`, {
//       variantId,
//       quantity,
//       bundleConfig,
//       triggerVariantId
//     });

//     const properties = {
//       _free_bundles: "true",
//       _source: "bundle-app",
//     };

//     // Store bundle config in properties if provided
//     if (bundleConfig) {
//       properties._free_bundles_free_variant_id = bundleConfig.freeVariantId;
//       properties._free_bundles_free_quantity = bundleConfig.freeQuantity || 1;
//       properties._free_bundles_discount_percentage = (
//         bundleConfig.discountPercentage !== undefined
//           ? bundleConfig.discountPercentage
//           : 100
//       ).toString();
//     }

//     // Store trigger variant ID
//     if (triggerVariantId) {
//       properties._free_bundles_trigger_variant_id = triggerVariantId;
//     }

//     try {
//       const payload = {
//         id: variantId,
//         quantity,
//         properties,
//       };

//       console.log(`[Bundle Sync] 📤 Adding free item to cart:`, payload);
//       const response = await fetch("/cart/add.js", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const result = await response.json();
//       console.log(`[Bundle Sync] ✅ Free item added successfully:`, result);

//       return response;
//     } catch (error) {
//       console.error(`[Bundle Sync] ❌ Error adding free item:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Get current cart data
//    * @returns {Promise<Object>} - Cart data
//    */
//   async function getCart() {
//     try {
//       const result = await fetch("/cart.js").then((r) => r.json());
//       console.log(`[Bundle Sync] 📥 Cart fetched:`, {
//         itemCount: result.item_count,
//         items: result.items?.map(i => ({
//           variantId: i.variant_id,
//           quantity: i.quantity,
//           isFree: i.properties?._free_bundles === "true"
//         }))
//       });
//       return result;
//     } catch (error) {
//       console.error("[Bundle Sync] ❌ Error fetching cart:", error);
//       throw error;
//     }
//   }


//   /**
//    * Handle add-to-cart with bundle logic
//    * @param {string|number} variantId - Variant ID to add
//    * @param {number} quantity - Quantity to add
//    * @returns {Promise} - Promise that resolves when done
//    */
//   async function handleAddToCartWithBundle(variantId, quantity = 1) {
//     console.log(`[Bundle Sync] 🛒 Handling Add to Cart with bundle logic:`, { variantId, quantity });

//     try {
//       // Set flag to indicate this is an add-to-cart flow
//       isAddingFreeItems = true;


//       // Step 1: Fetch free variants for this product
//       const freeVariants = fetchProductFreeVariants(variantId);

//       if (freeVariants && freeVariants.length > 0) {
//         console.log(`[Bundle Sync] ✅ Found ${freeVariants.length} free variant(s) to add`);

//         // Step 2: Add each free variant to cart
//         for (let i = 0; i < freeVariants.length; i++) {
//           const freeVariant = freeVariants[i];
//           if (freeVariant && freeVariant.freeVariantId) {
//             // Check if variant selection is enabled and get selected variant
//             const bundleBox = document.querySelector('.bundle-box');
//             const allowVariantSelection = bundleBox && bundleBox.getAttribute('data-allow-variant-selection') === 'true';
//             let variantIdToAdd = freeVariant.freeVariantId;

//             if (allowVariantSelection) {
//               const selectedVariantId = getSelectedVariantForItem(i);
//               if (selectedVariantId) {
//                 variantIdToAdd = selectedVariantId;
//                 console.log(`[Bundle Sync] 🔄 Using selected variant ${variantIdToAdd} instead of default ${freeVariant.freeVariantId}`);
//               }
//             }

//             const freeQuantity = (freeVariant.freeQuantity || 1) * quantity;

//             console.log(`[Bundle Sync] 📦 Adding free variant ${i + 1}/${freeVariants.length}:`, {
//               freeVariantId: variantIdToAdd,
//               originalVariantId: freeVariant.freeVariantId,
//               freeQuantity
//             });

//             try {
//               await addFreeItemToCart(
//                 variantIdToAdd,
//                 freeQuantity,
//                 freeVariant,
//                 variantId
//               );

//               // Small delay between adding multiple items
//               if (i < freeVariants.length - 1) {
//                 // await new Promise((resolve) => setTimeout(resolve, 200));
//               }
//             } catch (error) {
//               console.error(`[Bundle Sync] ❌ Error adding free variant ${freeVariant.freeVariantId}:`, error);
//             }
//           }
//         }

//         // Wait a bit for all items to be fully added
//         // await new Promise((resolve) => setTimeout(resolve, 500));

//         // Step 4: Redirect to cart page
//         console.log(`[Bundle Sync] 🛒 Redirecting to cart page (has bundle with free items)`);
//         setTimeout(() => {
//           window.location.href = "/cart";
//         }, 300);
//         return;
//       } else {
//         console.log(`[Bundle Sync] ⚠️ No free variants found for variant ${variantId}, redirecting to cart...`);
//         // No free items, redirect to cart
//         setTimeout(() => {
//           window.location.href = "/cart";
//         }, 300);
//         return;
//       }
//     } catch (error) {
//       console.error("[Bundle Sync] ❌ Error in add-to-cart flow:", error);
//       // On error, still try to redirect to cart
//       setTimeout(() => {
//         window.location.href = "/cart";
//       }, 300);
//       throw error;
//     } finally {
//       // Reset flag
//       isAddingFreeItems = false;
//     }
//   }

//   /**
//    * Handle buy-now button click with bundle logic
//    * @param {string|number} variantId - Variant ID to add
//    * @param {number} quantity - Quantity to add
//    * @returns {Promise} - Promise that resolves when done
//    */
//   async function handleBuyNowWithBundle(variantId, quantity = 1) {
//     console.log(`[Bundle Sync] 🛒 Handling Buy Now with bundle logic:`, { variantId, quantity });

//     try {
//       // Set flag to indicate this is a buy-now flow
//       isBuyNowFlow = true;
//       isAddingFreeItems = true;

//       // Step 1: Add main item to cart
//       console.log(`[Bundle Sync] ➕ Adding main item to cart...`);
//       const addResponse = await fetch("/cart/add.js", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           id: variantId,
//           quantity: quantity
//         })
//       });

//       if (!addResponse.ok) {
//         throw new Error(`Failed to add item to cart: ${addResponse.statusText}`);
//       }

//       const addResult = await addResponse.json();
//       console.log(`[Bundle Sync] ✅ Main item added:`, addResult);


//       // Step 2: Fetch free variants for this product
//       const freeVariants = fetchProductFreeVariants(variantId);

//       if (freeVariants && freeVariants.length > 0) {
//         console.log(`[Bundle Sync] ✅ Found ${freeVariants.length} free variant(s) to add`);

//         // Step 3: Add each free variant to cart
//         for (let i = 0; i < freeVariants.length; i++) {
//           const freeVariant = freeVariants[i];
//           if (freeVariant && freeVariant.freeVariantId) {
//             // Check if variant selection is enabled and get selected variant
//             const bundleBox = document.querySelector('.bundle-box');
//             const allowVariantSelection = bundleBox && bundleBox.getAttribute('data-allow-variant-selection') === 'true';
//             let variantIdToAdd = freeVariant.freeVariantId;

//             if (allowVariantSelection) {
//               const selectedVariantId = getSelectedVariantForItem(i);
//               if (selectedVariantId) {
//                 variantIdToAdd = selectedVariantId;
//                 console.log(`[Bundle Sync] 🔄 Using selected variant ${variantIdToAdd} instead of default ${freeVariant.freeVariantId}`);
//               }
//             }

//             const freeQuantity = (freeVariant.freeQuantity || 1) * quantity;

//             console.log(`[Bundle Sync] 📦 Adding free variant ${i + 1}/${freeVariants.length}:`, {
//               freeVariantId: variantIdToAdd,
//               originalVariantId: freeVariant.freeVariantId,
//               freeQuantity
//             });

//             try {
//               await addFreeItemToCart(
//                 variantIdToAdd,
//                 freeQuantity,
//                 freeVariant,
//                 variantId
//               );

//               // Small delay between adding multiple items
//               if (i < freeVariants.length - 1) {
//               }
//             } catch (error) {
//               console.error(`[Bundle Sync] ❌ Error adding free variant ${freeVariant.freeVariantId}:`, error);
//             }
//           }
//         }


//         // Step 4: Redirect to cart page
//         console.log(`[Bundle Sync] 🛒 Redirecting to checkout page (has bundle with free items)`);
//         setTimeout(() => {
//           window.location.href = "/checkout";
//         }, 100);
//         return;
//       } else {
//         console.log(`[Bundle Sync] ⚠️ No free variants found for variant ${variantId}, redirecting to cart...`);
//         // No free items, redirect to cart
//         setTimeout(() => {
//           window.location.href = "/checkout";
//         }, 300);
//         return;
//       }
//     } catch (error) {
//       console.error("[Bundle Sync] ❌ Error in buy-now flow:", error);
//       // On error, still try to redirect to cart
//       setTimeout(() => {
//         window.location.href = "/cart";
//       }, 300);
//       throw error;
//     } finally {
//       // Reset flags
//       isBuyNowFlow = false;
//       isAddingFreeItems = false;
//     }
//   }

//   // Expose functions globally for buy-now button and add-to-cart to use
//   window.handleBuyNowWithBundle = handleBuyNowWithBundle;
//   window.handleAddToCartWithBundle = handleAddToCartWithBundle;

//   // Listen for buy-now button clicks
//   console.log(`[Bundle Sync] 🔌 Setting up Buy Now button listener...`);

//   /**
//    * Check if bundle is selected globally (without needing variant ID)
//    * @returns {boolean} - True if bundle is selected, false otherwise
//    */
//   function isBundleSelectedGlobally() {
//     // Check for any checked bundle-upsell radio button
//     const bundleRadio = document.querySelector('input.bundle-upsell-radio:checked');
    
//     if (bundleRadio) {
//       const isIncluded = bundleRadio.getAttribute('data-bundle-include') === 'true';
//       return isIncluded;
//     }
    
//     // If no radio button found, check if bundle box exists (default to selected if bundle exists)
//     const bundleBox = document.querySelector('.bundle-box');
//     if (bundleBox) {
//       // Default to true if bundle box exists but no radio buttons (backward compatibility)
//       return true;
//     }
    
//     return false;
//   }

//   /**
//    * Check if bundle is selected for a variant
//    * @param {string|number} variantId - Variant ID to check
//    * @returns {boolean} - True if bundle is selected, false otherwise
//    */
//   function checkIfBundleSelected(variantId) {
//     // Get product ID from variant
//     const productId = getProductIdFromVariant(variantId);
    
//     // Check for upselling bundle radio button - try product ID first, then variant ID
//     let bundleRadio = null;
    
//     if (productId) {
//       bundleRadio = document.querySelector(`input[name="bundle-upsell-${productId}"].bundle-upsell-radio:checked`);
//     }
    
//     // Fallback to variant ID (backward compatibility)
//     if (!bundleRadio) {
//       bundleRadio = document.querySelector(`input[name="bundle-upsell-${variantId}"].bundle-upsell-radio:checked`);
//     }
    
//     // If not found, try to find any bundle-upsell radio button (for cases where variant ID might differ)
//     if (!bundleRadio) {
//       const allBundleRadios = document.querySelectorAll('input.bundle-upsell-radio');
//       // Find the checked one
//       for (let radio of allBundleRadios) {
//         if (radio.checked) {
//           bundleRadio = radio;
//           break;
//         }
//       }
//     }
    
//     if (bundleRadio) {
//       const isIncluded = bundleRadio.getAttribute('data-bundle-include') === 'true';
//       console.log(`[Bundle Sync] Bundle selection for variant ${variantId}:`, isIncluded);
//       return isIncluded;
//     }
    
//     // If no radio button found, check if bundle box exists (default to selected if bundle exists)
//     const bundleBox = document.querySelector('.bundle-box');
//     if (bundleBox) {
//       // Default to true if bundle box exists but no radio buttons (backward compatibility)
//       console.log(`[Bundle Sync] No radio button found, defaulting to bundle selected (backward compatibility)`);
//       return true;
//     }
    
//     console.log(`[Bundle Sync] No bundle box found, bundle not selected`);
//     return false;
//   }

//   // Function to attach listeners to buy-now buttons
//   function attachBuyNowListeners() {
//     // Check if bundle is selected - if not, don't attach listeners
//     if (!isBundleSelectedGlobally()) {
//       console.log(`[Bundle Sync] ℹ️ Bundle not selected, skipping buy-now listener attachment`);
//       return;
//     }

//     // Selectors for various buy-now button types
//     const buyNowSelectors = [
//       '[class*="tae-buy-now-button-btn-"]',
//       'shopify-buy-it-now-button',
//       '[class*="shopify-payment-button"]',
//       '.shopify-payment-button',
//       'button.shopify-payment-button__button',
//       '.shopify-payment-button__button',
//       'shopify-buy-it-now-button button',
//       'shopify-buy-it-now-button .shopify-payment-button__button'
//     ];

//     // Combine all selectors
//     const selectorString = buyNowSelectors.join(', ');
//     const buyNowButtons = document.querySelectorAll(selectorString);

//     buyNowButtons.forEach((button) => {
//       // Check if listener already attached
//       if (button.dataset.bundleListenerAttached) {
//         return;
//       }
//       button.dataset.bundleListenerAttached = 'true';

//       button.addEventListener('click', async function (e) {
//         // Try multiple methods to extract variant ID
//         let variantId = this.getAttribute('data-variant-id');

//         // If not found, try to get from Shopify buy-it-now-button parent element
//         if (!variantId) {
//           const shopifyButton = this.closest('shopify-buy-it-now-button');
//           if (shopifyButton) {
//             variantId = shopifyButton.getAttribute('variant-id') ||
//               shopifyButton.getAttribute('data-variant-id');
//           }
//         }

//         // If still not found, try to get from product form
//         if (!variantId) {
//           const productForm = document.querySelector('form[action*="/cart/add"]') ||
//             document.querySelector('form.product-form') ||
//             document.querySelector('form[data-product-form]');
//           if (productForm) {
//             const variantInput = productForm.querySelector('input[name="id"]') ||
//               productForm.querySelector('select[name="id"]');
//             if (variantInput) {
//               variantId = variantInput.value;
//             }
//           }
//         }

//         // If still not found, try to get from variant selector
//         if (!variantId) {
//           const variantSelector = document.querySelector('select[name="id"]') ||
//             document.querySelector('input[name="id"]:checked') ||
//             document.querySelector('[name="id"][value]');
//           if (variantSelector) {
//             variantId = variantSelector.value;
//           }
//         }

//         if (!variantId) {
//           console.warn('[Bundle Sync] ⚠️ No variant ID found on buy-now button or in product form');
//           return;
//         }

//         // Find quantity input - check multiple locations
//         let quantityInput = null;
//         const container = this.closest('.tae-buy-now-button-container');
//         if (container) {
//           quantityInput = container.querySelector('[class*="tae-buy-now-quantity-input"]');
//         }

//         // If not found in container, check product form
//         if (!quantityInput) {
//           const productForm = document.querySelector('form[action*="/cart/add"]') ||
//             document.querySelector('form.product-form') ||
//             document.querySelector('form[data-product-form]');
//           if (productForm) {
//             quantityInput = productForm.querySelector('input[name="quantity"]') ||
//               productForm.querySelector('select[name="quantity"]');
//           }
//         }

//         const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

//         // Check if bundle is selected (for upselling bundles)
//         const bundleSelected = checkIfBundleSelected(variantId);
        
//         // Check if there are free variants for this product
//         const freeVariants = fetchProductFreeVariants(variantId);

//         if (bundleSelected && freeVariants && freeVariants.length > 0) {
//           // Prevent default behavior and stop propagation
//           e.preventDefault();
//           e.stopPropagation();
//           e.stopImmediatePropagation();

//           // Mark button as handled
//           button.dataset.bundleHandled = 'true';

//           console.log(`[Bundle Sync] 🎯 Buy Now button clicked with bundle items (bundle selected)`);

//           // Handle the buy-now flow with bundle
//           try {
//             await handleBuyNowWithBundle(variantId, quantity);
//           } catch (error) {
//             console.error('[Bundle Sync] ❌ Error in buy-now bundle flow:', error);
//             // Reset flag on error so user can try again
//             delete button.dataset.bundleHandled;
//           }
//         } else {
//           if (!bundleSelected) {
//             console.log(`[Bundle Sync] ℹ️ Buy Now clicked but bundle not selected, allowing default behavior (skip bundle)`);
//           } else {
//             console.log(`[Bundle Sync] ℹ️ Buy Now clicked but no bundle items found, allowing default behavior`);
//           }
//           // Bundle not selected or no bundle items, let the default buy-now behavior proceed
//         }
//       }, true); // Use capture phase to intercept before other handlers
//     });
//   }

//   // Attach listeners once when DOM is ready (only on initial load, not on refresh)
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', attachBuyNowListeners);
//   } else {
//     attachBuyNowListeners();
//   }

//   /**
//    * Handle add-to-cart form submission with bundle logic
//    * @param {Event} e - Form submit event
//    */
//   async function handleAddToCartFormSubmit(e) {
//     const form = e.target;

//     // Only handle forms that add to cart
//     const formAction = form.getAttribute('action') || '';
//     const isCartAddForm = formAction.includes('/cart/add') ||
//       form.classList.contains('product-form') ||
//       form.hasAttribute('data-product-form');

//     if (!isCartAddForm) {
//       return; // Not an add-to-cart form, let it proceed normally
//     }

//     // Check if this form was already handled
//     if (form.dataset.bundleHandled === 'true') {
//       return; // Already handled, let it proceed
//     }

//     // Extract variant ID from form
//     const variantInput = form.querySelector('input[name="id"]') ||
//       form.querySelector('input[value][name="id"]') ||
//       form.querySelector('select[name="id"]');

//     if (!variantInput) {
//       console.log('[Bundle Sync] ⚠️ No variant ID found in form, allowing default behavior');
//       return; // No variant ID, let default behavior proceed
//     }

//     const variantId = variantInput.value;
//     if (!variantId) {
//       console.log('[Bundle Sync] ⚠️ Empty variant ID in form, allowing default behavior');
//       return;
//     }

//     // Extract quantity from form
//     const quantitySelectors = [
//       'input[name="quantity"]',
//       'select[name="quantity"]',
//       'input[data-quantity-input]',
//       'input[id*="quantity"]',
//       'select[id*="quantity"]',
//       '.quantity-input input',
//       '.product-form__quantity input',
//       '.tae-buy-now-quantity-input',
//       'input.tae-buy-now-quantity-input',
//       '[name="quantity"]'
//     ];

//     let quantity = 1;
//     for (let selector of quantitySelectors) {
//       const qtyInput = form.querySelector(selector);
//       if (qtyInput && qtyInput.value) {
//         quantity = parseInt(qtyInput.value) || 1;
//         break;
//       }
//     }

//     console.log(`[Bundle Sync] 🔍 Intercepted add-to-cart form submission:`, {
//       variantId,
//       quantity,
//       formAction
//     });

//     // Check if bundle is selected (for upselling bundles)
//     const bundleSelected = checkIfBundleSelected(variantId);

//     // Check if there are free variants for this product
//     const freeVariants = fetchProductFreeVariants(variantId);

//     if (bundleSelected && freeVariants && freeVariants.length > 0) {
//       // Prevent default form submission
//       e.preventDefault();
//       e.stopPropagation();
//       e.stopImmediatePropagation();

//       // Mark form as handled
//       form.dataset.bundleHandled = 'true';

//       console.log(`[Bundle Sync] 🎯 Add to Cart form submitted with bundle items (bundle selected)`);

//       // Handle the add-to-cart flow with bundle
//       try {
//         await handleAddToCartWithBundle(variantId, quantity);
//       } catch (error) {
//         console.error('[Bundle Sync] ❌ Error in add-to-cart bundle flow:', error);
//         // Reset flag on error so user can try again
//         delete form.dataset.bundleHandled;
//         // Still redirect to cart on error
//         setTimeout(() => {
//           window.location.href = "/cart";
//         }, 300);
//       }
//     } else {
//       if (!bundleSelected) {
//         console.log(`[Bundle Sync] ℹ️ Add to Cart form submitted but bundle not selected, allowing default behavior (skip bundle)`);
//       } else {
//         console.log(`[Bundle Sync] ℹ️ Add to Cart form submitted but no bundle items found, allowing default behavior`);
//       }
//       // Bundle not selected or no bundle items, let the default form submission proceed
//     }
//   }

//   // Function to attach listeners to add-to-cart forms
//   function attachAddToCartFormListeners() {
//     // Check if bundle is selected - if not, don't attach listeners
//     if (!isBundleSelectedGlobally()) {
//       console.log(`[Bundle Sync] ℹ️ Bundle not selected, skipping add-to-cart listener attachment`);
//       return;
//     }

//     const cartForms = document.querySelectorAll(
//       'form[action*="/cart/add"], form.product-form, form[data-product-form]'
//     );

//     cartForms.forEach((form) => {
//       // Check if listener already attached
//       if (form.dataset.bundleFormListenerAttached) {
//         return;
//       }
//       form.dataset.bundleFormListenerAttached = 'true';

//       form.addEventListener('submit', handleAddToCartFormSubmit, true); // Use capture phase to intercept early
//     });
//   }

//   // Attach form listeners when DOM is ready
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', attachAddToCartFormListeners);
//   } else {
//     attachAddToCartFormListeners();
//   }

//   // Also watch for dynamically added forms
//   const formObserver = new MutationObserver(() => {
//     // Only attach if bundle is selected
//     if (isBundleSelectedGlobally()) {
//       attachAddToCartFormListeners();
//     }
//   });

//   formObserver.observe(document.body, {
//     childList: true,
//     subtree: true
//   });

//   // Also watch for dynamically added buy-now buttons
//   const buyNowObserver = new MutationObserver(() => {
//     // Only attach if bundle is selected
//     if (isBundleSelectedGlobally()) {
//       attachBuyNowListeners();
//     }
//   });

//   buyNowObserver.observe(document.body, {
//     childList: true,
//     subtree: true
//   });

//   // Watch for radio button changes to attach/detach listeners dynamically
//   function setupRadioButtonListeners() {
//     const bundleRadios = document.querySelectorAll('input.bundle-upsell-radio');
    
//     bundleRadios.forEach((radio) => {
//       // Remove existing listener if any
//       radio.removeEventListener('change', handleRadioButtonChange);
//       // Add new listener
//       radio.addEventListener('change', handleRadioButtonChange);
//     });
//   }

//   function handleRadioButtonChange() {
//     const bundleSelected = isBundleSelectedGlobally();
//     console.log(`[Bundle Sync] 🔄 Radio button changed, bundle selected: ${bundleSelected}`);
    
//     if (bundleSelected) {
//       // Bundle is now selected, attach listeners
//       attachBuyNowListeners();
//       attachAddToCartFormListeners();
//     } else {
//       // Bundle is not selected, remove listeners by clearing flags
//       // Note: We can't actually remove event listeners, but we can mark them as inactive
//       // The click handlers will check bundle selection anyway, so this is mainly for performance
//       console.log(`[Bundle Sync] ℹ️ Bundle deselected, listeners will be skipped on next attachment`);
//     }
//   }

//   // Setup radio button listeners when DOM is ready
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', setupRadioButtonListeners);
//   } else {
//     setupRadioButtonListeners();
//   }

//   // Watch for dynamically added radio buttons
//   const radioObserver = new MutationObserver(() => {
//     setupRadioButtonListeners();
//   });

//   radioObserver.observe(document.body, {
//     childList: true,
//     subtree: true
//   });

//   // Log available data structures on initialization
//   console.log(`[Bundle Sync] 📊 Available data structures:`, {
//     hasProductScope: !!(window.FREE_BUNDLES_FREE_VARIANTS),
//     hasGlobalScope: !!(window.FREE_BUNDLES_GLOBAL_BUNDLES),
//     productScopeKeys: window.FREE_BUNDLES_FREE_VARIANTS ? Object.keys(window.FREE_BUNDLES_FREE_VARIANTS) : [],
//     globalScopeKeys: window.FREE_BUNDLES_GLOBAL_BUNDLES ? Object.keys(window.FREE_BUNDLES_GLOBAL_BUNDLES) : []
//   });

//   // Make function available globally for testing
//   window.fetchProductFreeVariants = fetchProductFreeVariants;

//   // Initialize variant selector listeners
//   function initVariantSelectors() {
//     const bundleBox = document.querySelector('.bundle-box');
//     if (!bundleBox) return;

//     const allowVariantSelection = bundleBox.getAttribute('data-allow-variant-selection') === 'true';
//     if (!allowVariantSelection) return;

//     const variantSelects = bundleBox.querySelectorAll('.bundle-variant-select');
//     variantSelects.forEach((select) => {
//       // Skip if already initialized
//       if (select.dataset.variantListenerAttached === 'true') return;
//       select.dataset.variantListenerAttached = 'true';

//       select.addEventListener('change', function() {
//         const itemIndex = this.getAttribute('data-item-index');
//         const selectedVariantId = this.value;
//         const itemCard = bundleBox.querySelector(`.bundle-box-upsell-item-card[data-item-index="${itemIndex}"]`);
        
//         console.log(`[Bundle Sync] 🔄 Variant changed for item ${itemIndex}:`, {
//           selectedVariantId,
//           itemCard: !!itemCard
//         });

//         // Update the variant display if needed
//         if (itemCard) {
//           const variantDisplay = itemCard.querySelector('.bundle-box-upsell-item-variant');
//           const selectedOption = this.options[this.selectedIndex];
//           if (variantDisplay && selectedOption) {
//             variantDisplay.textContent = selectedOption.text;
//           }
//         }
//       });
//     });
//   }

//   // Initialize variant selectors when DOM is ready
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initVariantSelectors);
//   } else {
//     initVariantSelectors();
//   }

//   // Watch for dynamically added variant selectors
//   const variantSelectorObserver = new MutationObserver(() => {
//     initVariantSelectors();
//   });

//   variantSelectorObserver.observe(document.body, {
//     childList: true,
//     subtree: true
//   });

//   console.log(`[Bundle Sync] ✅ Bundle upsell sync script initialized`);
// })();
