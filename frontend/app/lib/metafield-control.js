/**
 * Utility functions to manage the shop-level app.block_control metafield.
 * When true, Kluck theme/app extension blocks render on the storefront (credit-based billing).
 */

/**
 * Safely extract error messages from GraphQL response errors
 * @param {any} errors - Errors from GraphQL response (can be array, object, string, etc.)
 * @returns {Array<string>} Array of error messages
 */
function extractErrorMessages(errors) {
  if (!errors) {
    return [];
  }
  
  if (Array.isArray(errors)) {
    return errors.map((e) => (typeof e === 'string' ? e : e.message || JSON.stringify(e)));
  }
  
  if (typeof errors === 'string') {
    return [errors];
  }
  
  if (typeof errors === 'object') {
    // Try to extract message property
    if (errors.message) {
      return [errors.message];
    }
    // If it's an object with multiple properties, stringify it
    return [JSON.stringify(errors)];
  }
  
  return [String(errors)];
}

/**
 * Set the app.block_control metafield for the shop
 * @param {Object} admin - Shopify admin GraphQL client (optional, will use session if not provided)
 * @param {boolean} value - true to enable blocks, false to disable
 * @param {Object} session - Shopify session object (required if admin is not provided)
 * @returns {Promise<{success: boolean, errors: Array}>}
 */
export async function setRenderBlocksForShop(admin, value, session = null) {
  const valueString = value ? "true" : "false";

  // Shared, validated GraphQL operations
  const shopQuery = `#graphql
    query GetShopId {
      shop {
        id
      }
    }
  `;

  const metafieldMutation = `#graphql
    mutation SetShopRenderFlag($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          key
          namespace
          value
          createdAt
          updatedAt
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  // Branch 1: No admin client, use session + fetch
  if (!admin && session) {
    try {
      const shopDomain = session.shop;
      const accessToken = session.accessToken;
      const apiVersion = "2025-01"; // or your actual pinned version, must exist on Shopify

      // 1. Get shop ID
      const shopResponse = await fetch(
        `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({
            query: shopQuery.replace(/^#graphql\s*/m, "").trim(),
          }),
        }
      );

      const shopData = await shopResponse.json();

      if (shopData.errors || !shopData?.data?.shop?.id) {
        const errorMessages = extractErrorMessages(shopData.errors);
        return {
          success: false,
          errors: errorMessages.length > 0 
            ? errorMessages 
            : ["Could not retrieve shop ID"],
        };
      }

      const shopId = shopData.data.shop.id;

      // 2. Set metafield using the TOML-defined namespace/key
      const response = await fetch(
        `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({
            query: metafieldMutation.replace(/^#graphql\s*/m, "").trim(),
            variables: {
              metafields: [
                {
                  ownerId: shopId,
                  namespace: "app",        // MUST match [shop.metafields.app.block_control]
                  key: "block_control",    // MUST match the key in TOML
                  type: "boolean",
                  value: valueString,      // "true" or "false" as string
                },
              ],
            },
          }),
        }
      );

      const data = await response.json();

      if (data.errors) {
        return {
          success: false,
          errors: extractErrorMessages(data.errors),
        };
      }

      if (data.data?.metafieldsSet?.userErrors?.length > 0) {
        return {
          success: false,
          errors: data.data.metafieldsSet.userErrors.map((e) => e.message),
        };
      }

      return {
        success: true,
        errors: [],
      };
    } catch (error) {
      console.error("Error setting app.block_control metafield for shop:", error);
      return {
        success: false,
        errors: [error.message || "Unknown error occurred"],
      };
    }
  }

  // Branch 2: Admin client provided
  if (!admin) {
    return {
      success: false,
      errors: ["Admin client or session is required"],
    };
  }

  try {
    // 1. Get shop ID
    const shopResponse = await admin.graphql(shopQuery);
    const shopData = await shopResponse.json();

    if (shopData.errors) {
      return {
        success: false,
        errors: extractErrorMessages(shopData.errors),
      };
    }

    const shopId = shopData?.data?.shop?.id;

    if (!shopId) {
      return {
        success: false,
        errors: ["Could not retrieve shop ID"],
      };
    }

    // 2. Set metafield using TOML-defined namespace/key
    const response = await admin.graphql(metafieldMutation, {
      variables: {
        metafields: [
          {
            ownerId: shopId,
            namespace: "app",       // MUST be "app"
            key: "block_control",   // MUST be "block_control"
            type: "boolean",
            value: valueString,
          },
        ],
      },
    });

    const data = await response.json();

    if (data.errors) {
      return {
        success: false,
        errors: extractErrorMessages(data.errors),
      };
    }

    if (data.data?.metafieldsSet?.userErrors?.length > 0) {
      return {
        success: false,
        errors: data.data.metafieldsSet.userErrors.map((e) => e.message),
      };
    }

    return {
      success: true,
      errors: [],
    };
  } catch (error) {
    console.error("Error setting app.block_control metafield for shop:", error);
    return {
      success: false,
      errors: [error.message || "Unknown error occurred"],
    };
  }
}