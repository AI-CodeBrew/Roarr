/**
 * Background function to check and create bundler-discount if needed.
 * Ensures the automatic app discount for quantity bundles exists and is active.
 */

export async function ensureBundlerDiscount(admin) {
  console.log(
    "[BundlerDiscount] Starting background check for bundler-discount",
  );

  try {
    const checkDiscountQuery = `#graphql
      query getAutomaticAppDiscounts {
        discountNodes(first: 200) {
          edges {
            node {
              id
              discount {
                __typename
                ... on DiscountAutomaticApp {
                  title
                  startsAt
                  endsAt
                  status
                  appDiscountType {
                    description
                    functionId
                  }
                  combinesWith {
                    orderDiscounts
                    productDiscounts
                    shippingDiscounts
                  }
                }
              }
            }
          }
        }
      }
    `;

    const checkDiscountResponse = await admin.graphql(checkDiscountQuery);
    const checkDiscountJson = await checkDiscountResponse.json();
    const discountNodes = checkDiscountJson.data?.discountNodes?.edges || [];

    console.log(
      `[BundlerDiscount] Found ${discountNodes.length} discount nodes`,
    );

    // Match on the function's description, not the title: the title changed when the
    // app was renamed, and a title match would create a second discount.
    const expectedDescription = "bundler-discount";
    let bundlerDiscount = null;
    let bundlerDiscountNodeId = null;
    let bundlerDiscountExists = false;

    discountNodes.forEach((edge, index) => {
      const discount = edge.node?.discount;
      if (discount?.__typename === "DiscountAutomaticApp") {
        const description = discount.appDiscountType?.description;

        if (description === expectedDescription) {
          bundlerDiscount = discount;
          bundlerDiscountNodeId = edge.node.id;
          console.log(
            `[BundlerDiscount] Found bundler-discount at index ${index}:`,
            {
              id: edge.node.id,
              title: discount.title,
              description: discount.appDiscountType?.description,
              functionId: discount.appDiscountType?.functionId,
              status: discount.status,
              startsAt: discount.startsAt,
              endsAt: discount.endsAt,
            },
          );
          if (discount.status === "ACTIVE") {
            bundlerDiscountExists = true;
            console.log(
              "[BundlerDiscount] ✓ bundler-discount exists and is ACTIVE",
            );
          } else {
            console.log(
              `[BundlerDiscount] ⚠ bundler-discount exists but status is ${discount.status} (not ACTIVE)`,
            );
          }
        }
      }
    });

    if (!bundlerDiscountExists) {
      if (bundlerDiscount && bundlerDiscountNodeId) {
        console.log(
          `[BundlerDiscount] Discount exists but is not active (status: ${bundlerDiscount.status}). Updating to make it active...`,
        );

        const updateDiscountMutation = `#graphql
          mutation DiscountAutomaticAppUpdate(
            $id: ID!
            $automaticAppDiscount: DiscountAutomaticAppInput!
          ) {
            discountAutomaticAppUpdate(
              id: $id
              automaticAppDiscount: $automaticAppDiscount
            ) {
              automaticAppDiscount {
                discountId
                status
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const updateVariables = {
          id: bundlerDiscountNodeId,
          automaticAppDiscount: {
            startsAt: "2026-01-01T00:00:00Z",
            endsAt: null,
          },
        };

        console.log(
          "[BundlerDiscount] Updating discount with variables:",
          JSON.stringify(updateVariables, null, 2),
        );
        const updateDiscountResponse = await admin.graphql(
          updateDiscountMutation,
          { variables: updateVariables },
        );
        const updateDiscountJson = await updateDiscountResponse.json();

        if (
          updateDiscountJson.data?.discountAutomaticAppUpdate?.userErrors
            ?.length > 0
        ) {
          console.error(
            "[BundlerDiscount] ✗ Error updating discount:",
            JSON.stringify(
              updateDiscountJson.data.discountAutomaticAppUpdate.userErrors,
              null,
              2,
            ),
          );
        } else {
          const discountId =
            updateDiscountJson.data?.discountAutomaticAppUpdate
              ?.automaticAppDiscount?.discountId;
          const status =
            updateDiscountJson.data?.discountAutomaticAppUpdate
              ?.automaticAppDiscount?.status;
          console.log(
            "[BundlerDiscount] ✓ Successfully updated bundler-discount:",
            { discountId, status, endsAt: null },
          );
        }
      } else {
        console.log(
          "[BundlerDiscount] bundler-discount not found. Creating new discount...",
        );

        const createDiscountMutation = `#graphql
          mutation DiscountAutomaticAppCreate(
            $automaticAppDiscount: DiscountAutomaticAppInput!
          ) {
            discountAutomaticAppCreate(
              automaticAppDiscount: $automaticAppDiscount
            ) {
              automaticAppDiscount {
                discountId
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const variables = {
          automaticAppDiscount: {
            title: "roarr bundler-discount",
            functionHandle: "bundler-discount",
            discountClasses: ["PRODUCT"],
            startsAt: "2026-01-01T00:00:00Z",
            endsAt: null,
          },
        };

        console.log(
          "[BundlerDiscount] Creating discount with variables:",
          JSON.stringify(variables, null, 2),
        );
        const createDiscountResponse = await admin.graphql(
          createDiscountMutation,
          { variables },
        );
        const createDiscountJson = await createDiscountResponse.json();

        if (
          createDiscountJson.data?.discountAutomaticAppCreate?.userErrors
            ?.length > 0
        ) {
          console.error(
            "[BundlerDiscount] ✗ Error creating discount:",
            JSON.stringify(
              createDiscountJson.data.discountAutomaticAppCreate.userErrors,
              null,
              2,
            ),
          );
        } else {
          const discountId =
            createDiscountJson.data?.discountAutomaticAppCreate
              ?.automaticAppDiscount?.discountId;
          console.log(
            "[BundlerDiscount] ✓ Successfully created bundler-discount with ID:",
            discountId,
          );
        }
      }
    } else {
      console.log(
        "[BundlerDiscount] ✓ bundler-discount already exists and is active. No action needed.",
      );
    }
  } catch (error) {
    console.error(
      "[BundlerDiscount] ✗ Error in background discount check/creation:",
      {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    );
  }

  console.log("[BundlerDiscount] Background check completed");
}