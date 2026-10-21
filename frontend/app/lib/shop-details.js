/**
 * Fetch shop and merchant details from Shopify GraphQL API
 * @param {Object} admin - Shopify admin GraphQL client (optional, can use session.accessToken instead)
 * @param {Object} session - Shopify session object
 * @returns {Promise<Object>} Shop and merchant details
 */
export async function fetchShopDetails(admin, session) {
  try {
    // Shop fields only (billing address omitted — not needed for app shell / analytics).
    const combinedQuery = `#graphql
      query GetShopDetails {
        shop {
          id
          name
          email
          myshopifyDomain
          plan {
            displayName
            partnerDevelopment
          }
          primaryDomain {
            url
            host
          }
          contactEmail
          currencyCode
          timezoneAbbreviation
          ianaTimezone
          createdAt
          updatedAt
        }
      }
    `;

    let data;
    if (admin) {
      const response = await admin.graphql(combinedQuery);
      data = await response.json();

      if (data.errors) {
        console.error("[SHOP_DETAILS] GraphQL errors:", JSON.stringify(data.errors, null, 2));
      }
    } else {
      const shopDomain = session.shop;
      const apiVersionFormatted = "2025-10";
      const graphqlUrl = `https://${shopDomain}/admin/api/${apiVersionFormatted}/graphql.json`;

      const cleanQuery = combinedQuery.replace(/^#graphql\s*/m, "").trim();
      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.accessToken,
        },
        body: JSON.stringify({ query: cleanQuery }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SHOP_DETAILS] GraphQL request failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      data = await response.json();

      if (data.errors) {
        console.error("[SHOP_DETAILS] GraphQL errors:", JSON.stringify(data.errors, null, 2));
      }
    }

    const shop = data?.data?.shop || null;

    if (!shop) {
      console.warn("[SHOP_DETAILS] Shop data is null.");
    }
    
    return {
      shop: {
        id: shop?.id || null,
        name: shop?.name || null,
        domain: shop?.primaryDomain?.url || shop?.myshopifyDomain || session.shop,
        myshopifyDomain: shop?.myshopifyDomain || session.shop,
        email: shop?.email || shop?.contactEmail || null,
        phone: null,
        address: null,
        currencyCode: shop?.currencyCode || null,
        timezone: shop?.ianaTimezone || shop?.timezoneAbbreviation || null,
        plan: shop?.plan?.displayName || null,
        createdAt: shop?.createdAt || null,
        updatedAt: shop?.updatedAt || null,
      }
    };
  } catch (error) {
    console.error("Error fetching shop details:", error);
    // Return basic info from session if GraphQL fails
    return {
      shop: {
        id: null,
        name: null,
        domain: session.shop,
        myshopifyDomain: session.shop,
        email: null,
        phone: null,
        address: null,
        currencyCode: null,
        timezone: null,
        plan: null,
        createdAt: null,
        updatedAt: null,
      }
    };
  }
}

