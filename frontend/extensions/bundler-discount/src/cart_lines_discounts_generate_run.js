import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

// Get all bundles from shop metafield
function getAllBundles(input) {
  try {
    const shopMetafield = input.shop?.metafield;
    if (shopMetafield?.value) {
      const bundlesData = JSON.parse(shopMetafield.value);
      const bundlesArray = bundlesData.bundles || [];
      
      // Filter active bundles only
      return bundlesArray.filter(bundle => {
        const isActive = bundle.isActive !== undefined ? bundle.isActive : true;
        return isActive;
      });
    }
  } catch (e) {
    console.error('Error parsing bundles metafield:', e);
  }
  return [];
}

// Find bundle for a specific product ID
// Returns the most recently created bundle from all applicable bundles
function findBundleForProduct(bundles, productId) {
  const applicableBundles = [];

  if (!productId) {
    // If no product ID, only return global bundles
    for (const bundle of bundles) {
      const productSelectionType = bundle.productSelectionType || (bundle.scope === 'global' ? 'global' : 'include');
      if (productSelectionType === 'global') {
        applicableBundles.push(bundle);
      }
    }
  } else {
    const productIdStr = String(productId);
    const productIdNumeric = productIdStr.split('/').pop();

    // Helper function to check if product ID matches
    function productIdMatches(pid) {
      const pidStr = String(pid);
      const pidNumeric = pidStr.split('/').pop();
      return pidStr === productIdStr || pidNumeric === productIdNumeric || pid === productId;
    }

    // Helper function to check if product ID is in bundle's productIds array
    function isProductInBundle(bundle) {
      if (!bundle.productIds || !Array.isArray(bundle.productIds)) {
        return false;
      }
      return bundle.productIds.some(pid => productIdMatches(pid));
    }

    // Find all applicable bundles (include, exclude, and global)
    for (const bundle of bundles) {
      const productSelectionType = bundle.productSelectionType || (bundle.scope === 'global' ? 'global' : 'include');
      
      if (productSelectionType === 'include' && isProductInBundle(bundle)) {
        applicableBundles.push(bundle);
      } else if (productSelectionType === 'exclude' && !isProductInBundle(bundle)) {
        applicableBundles.push(bundle);
      } else if (productSelectionType === 'global') {
        applicableBundles.push(bundle);
      }
    }
  }

  // If no applicable bundles found, return null
  if (applicableBundles.length === 0) {
    return null;
  }

  // Sort by createdAt (most recent first) and return the first one
  applicableBundles.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime; // Descending order (most recent first)
  });

  return applicableBundles[0];
}

// Build a map of upsell variants from shop bundles
// Prioritizes product-level bundles over global bundles
function getUpsellVariantMap(input) {
  const upsellVariantMap = {};
  const allBundles = getAllBundles(input);
  
  // Helper function to process bundle data and add to map
  function processBundleData(bundleData, mainProductId, isGlobal = false) {
    const bundleType = bundleData.type || (bundleData.quantityDiscountTiers ? 'discounted' : 'upselling');

    // Upselling-type bundles OR discounted bundles with upsellItems / free gifts
    const upsellItems = bundleData.upsellItems || bundleData.freeItems || null;

    if (bundleType === 'upselling' || (Array.isArray(upsellItems) && upsellItems.length > 0)) {
      if (bundleData.upsellItems && Array.isArray(bundleData.upsellItems)) {
        bundleData.upsellItems.forEach((item) => {
          const variantId = item.upsellVariantId || item.freeVariantId;
          if (variantId) {
            if (!isGlobal || !upsellVariantMap[variantId]) {
              upsellVariantMap[variantId] = {
                mainProductId: mainProductId,
                upsellQuantity: item.upsellQuantity || item.freeQuantity || 1,
                discountPercentage: item.discountPercentage !== undefined ? item.discountPercentage : 100,
                isGlobal: isGlobal,
              };
            }
          }
        });
      } else if (bundleData.freeItems && Array.isArray(bundleData.freeItems)) {
        bundleData.freeItems.forEach((item) => {
          if (item.freeVariantId) {
            if (!isGlobal || !upsellVariantMap[item.freeVariantId]) {
              upsellVariantMap[item.freeVariantId] = {
                mainProductId: mainProductId,
                upsellQuantity: item.freeQuantity || 1,
                discountPercentage: item.discountPercentage !== undefined ? item.discountPercentage : 100,
                isGlobal: isGlobal,
              };
            }
          }
        });
      } else if (bundleData.freeVariantId || bundleData.upsellVariantId) {
        const variantId = bundleData.upsellVariantId || bundleData.freeVariantId;
        if (!isGlobal || !upsellVariantMap[variantId]) {
          upsellVariantMap[variantId] = {
            mainProductId: mainProductId,
            upsellQuantity: bundleData.upsellQuantity || bundleData.freeQuantity || 1,
            discountPercentage: bundleData.discountPercentage !== undefined ? bundleData.discountPercentage : 100,
            isGlobal: isGlobal,
          };
        }
      }
    }
  }

  // Process bundles for each cart line
  // Product-specific bundles take priority over global bundles
  input.cart.lines.forEach((line) => {
    // Only process ProductVariant merchandise
    if (line.merchandise.__typename !== 'ProductVariant') {
      return;
    }

    const merch = line.merchandise;
    const productId = merch.product?.id || null;

    // Find bundle for this product (include > exclude > global priority)
    const bundle = findBundleForProduct(allBundles, productId);
    
    if (bundle) {
      const productSelectionType = bundle.productSelectionType || (bundle.scope === 'global' ? 'global' : 'include');
      const isGlobal = productSelectionType === 'global';
      processBundleData(bundle, productId, isGlobal);
    }
  });

  return upsellVariantMap;
}

// Build a map of variants with quantity discount tiers
// Prioritizes product-level bundles over global bundles
function getQuantityDiscountMap(input) {
  const quantityDiscountMap = {};
  const allBundles = getAllBundles(input);

  // Helper function to process quantity discount tiers
  function processQuantityDiscountTiers(bundleData, productId, isGlobal = false) {
    // Only process discounted bundles
    const bundleType = bundleData.type || (bundleData.quantityDiscountTiers ? 'discounted' : 'upselling');
    if (bundleType === 'discounted' && bundleData.quantityDiscountTiers && Array.isArray(bundleData.quantityDiscountTiers)) {
      // Sort tiers by quantity (ascending) to find the highest applicable tier
      const tiers = bundleData.quantityDiscountTiers
        .map((tier) => ({
          quantity: parseInt(tier.quantity) || 1,
          discountType: tier.discountType || 'percentage',
          discountPercentage: tier.discountType === 'percentage' ? (parseFloat(tier.discountPercentage || tier.discountValue || 0)) : (parseFloat(tier.discountPercentage || 0)),
          discountValue: tier.discountValue !== undefined ? parseFloat(tier.discountValue) : (tier.discountType === 'percentage' ? (parseFloat(tier.discountPercentage || 0)) : (parseFloat(tier.discountValue || 0))),
          flatAmount: tier.discountType === 'flat' ? parseFloat(tier.flatAmount || tier.discountValue || 0) : undefined,
          specificPrice: tier.discountType === 'specificPrice' ? parseFloat(tier.specificPrice || tier.discountValue || 0) : undefined,
          buyX: tier.discountType === 'bogo' ? (parseInt(tier.buyX) || 1) : undefined,
          getYFree: tier.discountType === 'bogo' ? (parseInt(tier.getYFree) || 1) : undefined,
        }))
        .sort((a, b) => a.quantity - b.quantity);

      if (tiers.length > 0 && productId) {
        // Map by product ID
        const mapKey = `product:${productId}`;
        
        // Product-level bundles take priority: only add global if not already mapped
        if (!isGlobal || !quantityDiscountMap[mapKey]) {
          quantityDiscountMap[mapKey] = {
            tiers: tiers,
            isGlobal: isGlobal,
            productId: productId,
          };
          console.log(`Mapped quantity discount for product ${mapKey} with ${tiers.length} tiers (global: ${isGlobal})`);
        }
      }
    }
  }

  // Process bundles for each cart line
  // Product-specific bundles take priority over global bundles
  input.cart.lines.forEach((line) => {
    // Only process ProductVariant merchandise
    if (line.merchandise.__typename !== 'ProductVariant') {
      return;
    }

    const merch = line.merchandise;
    const productId = merch.product?.id || null;

    // Find bundle for this product (include > exclude > global priority)
    const bundle = findBundleForProduct(allBundles, productId);
    
    if (bundle) {
      const productSelectionType = bundle.productSelectionType || (bundle.scope === 'global' ? 'global' : 'include');
      const isGlobal = productSelectionType === 'global';
      processQuantityDiscountTiers(bundle, productId, isGlobal);
    }
  });

  return quantityDiscountMap;
}

// Find the highest applicable discount tier based on quantity
function getApplicableDiscountTier(quantity, tiers) {
  // Tiers should be sorted by quantity ascending
  // Find the highest tier where quantity >= tier.quantity
  let applicableTier = null;

  for (let i = tiers.length - 1; i >= 0; i--) {
    if (quantity >= tiers[i].quantity) {
      applicableTier = tiers[i];
      break;
    }
  }

  return applicableTier;
}

export function cartLinesDiscountsGenerateRun(input) {
  console.log('cartLinesDiscountsGenerateRun');

  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );
  console.log('hasProductDiscountClass', hasProductDiscountClass);
  if (!hasProductDiscountClass) {
    return { operations: [] };
  }

  // Get upsell variant map to identify which items should be discounted (for upselling bundles)
  const upsellVariantMap = getUpsellVariantMap(input);
  console.log('upsellVariantMap', upsellVariantMap);

  // Get quantity discount map (for discounted bundles)
  const quantityDiscountMap = getQuantityDiscountMap(input);
  console.log('quantityDiscountMap', quantityDiscountMap);

  if (Object.keys(upsellVariantMap).length === 0 && Object.keys(quantityDiscountMap).length === 0) {
    console.log('No bundle configurations found. Returning empty operations.');
    return { operations: [] };
  }

  // Build a map of main variant IDs to their quantities in the cart
  const mainVariantQuantities = new Map();
  // Also build a map of product IDs to their total quantities (for product-level bundles)
  const mainProductQuantities = new Map();
  input.cart.lines.forEach((line) => {
    if (line.merchandise.__typename === 'ProductVariant') {
      const merch = line.merchandise;
      const lineQty = line.quantity || 1;
      const variantId = merch.id;
      const productId = merch.product?.id || null;
      
      // Track variant quantities
      const currentVariantQty = mainVariantQuantities.get(variantId) || 0;
      mainVariantQuantities.set(variantId, currentVariantQty + lineQty);
      
      // Track product quantities (sum all variants of the same product)
      if (productId) {
        const currentProductQty = mainProductQuantities.get(productId) || 0;
        mainProductQuantities.set(productId, currentProductQty + lineQty);
      }
    }
  });

  const operations = [];
  const upsellBundleLines = [];
  const quantityDiscountLines = [];

  // Find all cart lines that should be discounted (have _free_bundles property and are in upsellVariantMap)
  input.cart.lines.forEach((line) => {
    // Only process ProductVariant merchandise
    if (line.merchandise.__typename !== 'ProductVariant') {
      return;
    }

    const merch = line.merchandise;
    const variantId = merch.id;

    // Check if this is an upsell variant (exists in our upsellVariantMap)
    const upsellVariantInfo = upsellVariantMap[variantId];

    if (!upsellVariantInfo) {
      return;
    }

    // Check if it has the _free_bundles property indicating it was added by our script
    // Access the aliased attribute from GraphQL query
    const freeBundlesAttr = line.freeBundlesAttribute;
    const hasFreeBundlesProperty = freeBundlesAttr?.key === '_free_bundles' &&
      freeBundlesAttr?.value === 'true';

    // Check if the main product is still in the cart
    // For global bundles, check if any product exists
    // For product-level bundles, check if ANY variant of that product exists
    let mainProductQty = 0;
    let mainProductExists = false;
    
    if (upsellVariantInfo.isGlobal) {
      // For global bundles, sum up all product quantities in cart
      mainProductQuantities.forEach((qty) => {
        mainProductQty += qty;
      });
      mainProductExists = mainProductQty > 0;
    } else if (upsellVariantInfo.mainProductId) {
      // For product-level bundles, check if ANY variant of that product is in cart
      mainProductQty = mainProductQuantities.get(upsellVariantInfo.mainProductId) || 0;
      mainProductExists = mainProductQty > 0;
      console.log(`Product-level bundle check: product ${upsellVariantInfo.mainProductId} has ${mainProductQty} total quantity across all variants`);
    }

    // Only apply discount if:
    // 1. It's an upsell variant (in our map), AND
    // 2. It has the _free_bundles property (added by our script), AND
    // 3. The main product is still in the cart (or any product for global bundles)
    if (hasFreeBundlesProperty && mainProductExists) {
      // Calculate eligible quantity: main product quantity * upsell quantity per main item
      const eligibleQuantity = mainProductQty * upsellVariantInfo.upsellQuantity;
      const lineQuantity = line.quantity || 1;

      // Only apply discount if line quantity is within eligible quantity
      // If user added more than eligible, don't discount (extra quantities should be full price)
      if (lineQuantity <= eligibleQuantity) {
        upsellBundleLines.push({
          line,
          eligibleQuantity: lineQuantity, // Discount entire line since it's within eligible
          discountPercentage: upsellVariantInfo.discountPercentage,
        });
        console.log(`Found upsell bundle item ${variantId} - will apply ${upsellVariantInfo.discountPercentage}% discount to ${lineQuantity} items (eligible: ${eligibleQuantity}, main product ${upsellVariantInfo.mainProductId || 'all'} qty: ${mainProductQty}, upsell qty per: ${upsellVariantInfo.upsellQuantity})`);
      } else {
        // Line quantity exceeds eligible - don't apply discount (user added extra, should pay full price)
        console.log(`Skipping discount for upsell bundle item ${variantId} - quantity ${lineQuantity} exceeds eligible quantity ${eligibleQuantity}. Extra items will be at full price.`);
      }
    } else if (hasFreeBundlesProperty && !mainProductExists) {
      console.log(`Skipping upsell bundle item ${variantId} - main product ${upsellVariantInfo.mainProductId || 'all'} is not in cart`);
    }
  });

  // Process quantity discount bundles
  input.cart.lines.forEach((line) => {
    // Only process ProductVariant merchandise
    if (line.merchandise.__typename !== 'ProductVariant') {
      return;
    }

    const merch = line.merchandise;
    const variantId = merch.id;
    const productId = merch.product?.id || null;

    // Check if this product has quantity discount tiers
    let discountInfo = null;
    if (productId) {
      discountInfo = quantityDiscountMap[`product:${productId}`];
    }
    
    if (!discountInfo || !discountInfo.tiers || discountInfo.tiers.length === 0) {
      return;
    }

    const tiers = discountInfo.tiers;

    // Get the total quantity: sum all variants of the product
    let totalQuantity = 0;
    if (productId) {
      totalQuantity = mainProductQuantities.get(productId) || 0;
      console.log(`Product-level quantity discount: product ${productId} has ${totalQuantity} total quantity across all variants`);
    }

    if (totalQuantity === 0) {
      return;
    }

    // Find the highest applicable tier based on total quantity
    const applicableTier = getApplicableDiscountTier(totalQuantity, tiers);

    if (applicableTier) {
      // Calculate discount percentage based on discount type
      let discountPercentage = 0;
      const discountType = applicableTier.discountType || 'percentage';
      // Get unit price from cart line cost (amountPerQuantity)
      const unitPrice = parseFloat(line.cost?.amountPerQuantity?.amount || 0);
      const tierQuantity = applicableTier.quantity || 1;
      const originalTotal = unitPrice * tierQuantity;

      if (discountType === 'percentage') {
        discountPercentage = parseFloat(applicableTier.discountPercentage || applicableTier.discountValue || 0);
      } else if (discountType === 'flat') {
        const flatAmount = parseFloat(applicableTier.flatAmount || applicableTier.discountValue || 0);
        if (originalTotal > 0) {
          discountPercentage = (flatAmount / originalTotal) * 100;
        }
      } else if (discountType === 'specificPrice') {
        const specificPrice = parseFloat(applicableTier.specificPrice || applicableTier.discountValue || 0);
        if (originalTotal > 0) {
          discountPercentage = ((originalTotal - specificPrice) / originalTotal) * 100;
        }
      } else if (discountType === 'bogo') {
        // Buy X Get Y Free: calculate equivalent percentage based on buyX and getYFree
        const buyX = applicableTier.buyX || 1;
        const getYFree = applicableTier.getYFree || 1;
        const totalItems = buyX + getYFree;
        
        if (totalItems > 0) {
          // Discount percentage = (free items / total items) * 100
          // Example: Buy 1 Get 1 Free = (1 / 2) * 100 = 50%
          // Example: Buy 2 Get 1 Free = (1 / 3) * 100 = 33.33%
          // Example: Buy 1 Get 3 Free = (3 / 4) * 100 = 75%
          discountPercentage = (getYFree / totalItems) * 100;
        } else {
          discountPercentage = 0;
        }
      } else {
        discountPercentage = 0;
      }

      // Ensure discount percentage is within valid range
      discountPercentage = Math.min(100, Math.max(0, discountPercentage));

      if (discountPercentage > 0) {
        quantityDiscountLines.push({
          line,
          discountPercentage: discountPercentage,
        });
        const logMessage = discountType === 'bogo' 
          ? `Found quantity discount for variant ${variantId} - quantity ${totalQuantity} qualifies for ${discountPercentage.toFixed(2)}% discount (tier: ${tierQuantity}+, type: ${discountType}, Buy ${applicableTier.buyX || 1} Get ${applicableTier.getYFree || 1} Free)`
          : `Found quantity discount for variant ${variantId} - quantity ${totalQuantity} qualifies for ${discountPercentage.toFixed(2)}% discount (tier: ${tierQuantity}+, type: ${discountType})`;
        console.log(logMessage);
      }
    } else {
      console.log(`Variant ${variantId} quantity ${totalQuantity} does not meet any discount tier requirements`);
    }
  });

  // Build discount candidates for all discount types
  const allDiscountCandidates = [];

  // Add upsell bundle discount candidates
  if (upsellBundleLines.length > 0) {
    const upsellCandidates = upsellBundleLines.map(({ line, eligibleQuantity, discountPercentage }) => {
      // Clamp discount percentage between 0 and 100
      const clampedDiscount = Math.max(0, Math.min(100, discountPercentage));
      const lineQuantity = line.quantity || 1;

      // At this point, lineQuantity should be <= eligibleQuantity (we filtered above)
      // So we can safely apply discount to the entire line
      console.log(`Applying ${clampedDiscount}% discount to ${lineQuantity} items for upsell bundle item ${line.id} (eligible: ${eligibleQuantity})`);

      return {
        message: clampedDiscount === 100
          ? 'FREE - Upsell Item'
          : `${clampedDiscount}% OFF - Upsell Item`,
        targets: [
          {
            cartLine: {
              id: line.id,
            },
          },
        ],
        value: {
          percentage: {
            value: clampedDiscount,
          },
        },
      };
    });

    allDiscountCandidates.push(...upsellCandidates);
  }

  // Add quantity discount candidates
  if (quantityDiscountLines.length > 0) {
    const quantityCandidates = quantityDiscountLines.map(({ line, discountPercentage }) => {
      // Clamp discount percentage between 0 and 100
      const clampedDiscount = Math.max(0, Math.min(100, discountPercentage));
      const lineQuantity = line.quantity || 1;

      console.log(`Applying ${clampedDiscount}% quantity discount to ${lineQuantity} items for variant ${line.id}`);

      return {
        message: `${clampedDiscount}% OFF - Quantity Discount`,
        targets: [
          {
            cartLine: {
              id: line.id,
            },
          },
        ],
        value: {
          percentage: {
            value: clampedDiscount,
          },
        },
      };
    });

    allDiscountCandidates.push(...quantityCandidates);
  }

  // Apply all discounts in a single operation
  if (allDiscountCandidates.length > 0) {
    operations.push({
      productDiscountsAdd: {
        candidates: allDiscountCandidates,
        selectionStrategy: ProductDiscountSelectionStrategy.All,
      },
    });
  }

  console.log(`Applied discounts to ${upsellBundleLines.length} upselling bundle items and ${quantityDiscountLines.length} quantity discount items`);

  return {
    operations,
  };
}

