import { authenticate } from "../shopify.server";

/**
 * List storefront themes for the shop (Admin GraphQL).
 * GET /app/api/store-themes
 */
export async function loader({ request }) {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(`#graphql
      query StoreThemesList {
        themes(first: 50) {
          nodes {
            id
            name
            role
          }
        }
      }
    `);

    const json = await response.json();

    if (json.errors?.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: json.errors[0]?.message || "GraphQL error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const nodes = json.data?.themes?.nodes ?? [];
    const themes = nodes.map((node) => ({
      id: String(node.id.split("/").pop()),
      name: node.name?.trim() || "Untitled theme",
      role: node.role,
    }));

    return new Response(JSON.stringify({ success: true, themes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
