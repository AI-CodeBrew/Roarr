import {
  IndexTable,
  Text,
  Badge,
  Box,
  Card,
  BlockStack,
  InlineStack,
  IndexFilters,
  useSetIndexFiltersMode,
  LegacyCard,
  EmptyState,
  Spinner,
} from "@shopify/polaris";
import { Edit, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";

export default function BundleList({
  bundles,
  products,
  onEdit,
  onDelete,
  onToggleStatus,
  isLoading,
  isAuthenticating,
  onCreate,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [queryValue, setQueryValue] = useState("");
  const [sortSelected, setSortSelected] = useState(["updated_at desc"]);
  const { mode, setMode } = useSetIndexFiltersMode();

  const getProductTitles = (productIds, productSelectionType) => {
    if (productSelectionType === "global") {
      return "All Products";
    }
    if (!productIds || productIds.length === 0) {
      return "No products";
    }
    const productTitles = productIds
      .map(productId => {
        const product = products.find((p) => p.id === productId);
        return product ? product.title : null;
      })
      .filter(Boolean);
    
    if (productTitles.length === 0) return "Unknown products";
    if (productTitles.length === 1) return productTitles[0];
    if (productTitles.length <= 3) return productTitles.join(", ");
    return `${productTitles.slice(0, 2).join(", ")} and ${productTitles.length - 2} more`;
  };

  const getProductSelectionLabel = (bundle) => {
    const productSelectionType = bundle.productSelectionType || (bundle.scope === "global" ? "global" : "include");
    
    if (productSelectionType === "global") {
      return "All Products";
    } else if (productSelectionType === "include") {
      if (!bundle.productIds || bundle.productIds.length === 0) {
        return "No products selected";
      }
      const count = bundle.productIds.length;
      return count === 1 
        ? "Applies to 1 product"
        : `Applies to ${count} products`;
    } else if (productSelectionType === "exclude") {
      if (!bundle.productIds || bundle.productIds.length === 0) {
        return "No products excluded";
      }
      const count = bundle.productIds.length;
      return count === 1
        ? "Excludes 1 product"
        : `Excludes ${count} products`;
    }
    return "Unknown selection type";
  };

  const handleMenuAction = (bundle, action) => {
    if (action === "edit") {
      onEdit(bundle);
    } else if (action === "delete") {
      onDelete(bundle);
    }
  };

  // Filter bundles based on active tab and search query
  const filteredBundles = useMemo(() => {
    return bundles.filter((bundle) => {
      // Filter by tab
      if (activeTab === "published" && !bundle.isActive) return false;
      if (activeTab === "draft" && bundle.isActive) return false;

      // Filter by search query
      if (queryValue.trim()) {
        const query = queryValue.toLowerCase();
        const nameMatch = bundle.name?.toLowerCase().includes(query);
        const descMatch = bundle.description?.toLowerCase().includes(query);
        const productSelectionType = bundle.productSelectionType || (bundle.scope === "global" ? "global" : "include");
        const productMatch = getProductTitles(bundle.productIds, productSelectionType)
          .toLowerCase()
          .includes(query);
        return nameMatch || descMatch || productMatch;
      }

      return true;
    });
  }, [bundles, activeTab, queryValue, products]);

  // Sort bundles
  const sortedBundles = useMemo(() => {
    const [sortField, sortDir] = sortSelected[0].split(" ");
    const dir = sortDir === "desc" ? -1 : 1;

    const getTime = (dateStr) => {
      if (!dateStr) return 0;
      return new Date(dateStr).getTime();
    };

    return [...filteredBundles].sort((a, b) => {
      if (sortField === "updated_at") {
        return (getTime(a.updatedAt) - getTime(b.updatedAt)) * dir;
      }
      if (sortField === "created_at") {
        return (getTime(a.createdAt) - getTime(b.createdAt)) * dir;
      }
      if (sortField === "name") {
        return (a.name || "").localeCompare(b.name || "") * dir;
      }
      return 0;
    });
  }, [filteredBundles, sortSelected]);

  const tabs = [
    { id: "all", content: "All" },
    { id: "published", content: "Published" },
    { id: "draft", content: "Draft" },
  ];

  const sortOptions = [
    { label: "Last edited", value: "updated_at desc", directionLabel: "Newest first" },
    { label: "Last edited", value: "updated_at asc", directionLabel: "Oldest first" },
    { label: "Created", value: "created_at desc", directionLabel: "Newest first" },
    { label: "Created", value: "created_at asc", directionLabel: "Oldest first" },
    { label: "Name", value: "name asc", directionLabel: "A-Z" },
    { label: "Name", value: "name desc", directionLabel: "Z-A" },
  ];

  const selectedTabIndex = tabs.findIndex((tab) => tab.id === activeTab);

  const handleTabChange = (selectedTabIndex) => {
    setActiveTab(tabs[selectedTabIndex].id);
  };

  if (bundles.length === 0) {
    if (isLoading) {
      return (
        <LegacyCard sectioned>
          <Box
            paddingBlockStart="800"
            paddingBlockEnd="800"
            paddingInlineStart="400"
            paddingInlineEnd="400"
          >
            <BlockStack gap="500" inlineAlign="center">
              <Spinner accessibilityLabel="Loading bundles" size="large" />
              <Text as="p" variant="bodyMd" tone="subdued">
                Loading bundles…
              </Text>
            </BlockStack>
          </Box>
        </LegacyCard>
      );
    }
    return (
      <Box paddingBlockStart="800">
        <LegacyCard sectioned>
          <EmptyState
            heading="Create your first bundle"
            action={
              onCreate
                ? {
                    content: "Create bundle",
                    onAction: onCreate,
                  }
                : undefined
            }
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>
              Use bundles to increase average order value with quantity discounts and upsell offers on your
              products.
            </p>
          </EmptyState>
        </LegacyCard>
      </Box>
    );
  }

  return (
    <>
      <Card roundedAbove="sm" padding="0">
        <Box background="bg-surface" className="my-4 overflow-hidden">
        <IndexFilters
          tabs={tabs}
          hideFilters={true}
          selected={selectedTabIndex}
          onSelect={(selectedTabIndex) => {
            if (isAuthenticating) return;
            handleTabChange(selectedTabIndex);
          }}
          queryValue={queryValue}
          queryPlaceholder="Search bundles"
          onQueryChange={(value) => {
            if (isAuthenticating) return;
            setQueryValue(value);
          }}
          onQueryClear={() => {
            if (isAuthenticating) return;
            setQueryValue("");
          }}
          sortOptions={sortOptions}
          sortSelected={sortSelected}
          onSort={(sortSelected) => {
            if (isAuthenticating) return;
            setSortSelected(sortSelected);
          }}
          filters={[]}
          appliedFilters={[]}
          mode={mode}
          setMode={setMode}
          canCreateNewView={false}
          cancelAction={{
            onAction: () => {
              if (isAuthenticating) return;
              setQueryValue("");
              setSortSelected(["updated_at desc"]);
            },
            disabled: isLoading || isAuthenticating,
            loading: isLoading || isAuthenticating,
          }}
        />

        <Box padding={sortedBundles.length > 0 ? "0" : "600"}>
          <IndexTable
            resourceName={{ singular: "bundle", plural: "bundles" }}
            itemCount={sortedBundles.length}
            selectable={false}
            headings={[
              { title: "Bundle Name" },
              { title: "Last Edited" },
              { title: "Status" },
              { title: "Bundle Type" },
              { title: "Action" },
            ]}
          >
            {sortedBundles.map((bundle, index) => {
              const lastEdited = bundle.updatedAt
                ? formatTimeAgo(new Date(bundle.updatedAt))
                : "Just now";

              return (
                <IndexTable.Row
                  id={bundle.id}
                  key={bundle.id}
                  position={index}
                  className="border-b border-gray-200 last:border-b-0 transition-colors hover:bg-gray-50"
                >
                  <IndexTable.Cell className="align-middle">
                    <BlockStack gap="050">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {bundle.name}
                      </Text>
                      <Text as="span" variant="bodySm" tone="subdued">
                        {getProductSelectionLabel(bundle)}
                      </Text>
                    </BlockStack>
                  </IndexTable.Cell>
                  <IndexTable.Cell className="align-middle">
                    <Text as="span" variant="bodySm" tone="subdued">
                      {lastEdited}
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell className="align-middle">
                    <div className="flex w-full items-center justify-start">
                      <InlineStack gap="200" align="center">
                        <Badge tone={bundle.isActive ? "success" : "subdued"}>
                          {bundle.isActive ? "Published" : "Draft"}
                        </Badge>

                        <label className="relative inline-flex h-6 w-11 items-center">
                          <input
                            type="checkbox"
                            checked={bundle.isActive || false}
                            onChange={(e) => {
                              if (isAuthenticating) return;
                              if (onToggleStatus) {
                                onToggleStatus(bundle, e.target.checked);
                              }
                            }}
                            disabled={isLoading || isAuthenticating}
                            className="peer sr-only"
                          />
                          <span className="h-6 w-11 cursor-pointer rounded-full bg-gray-300 transition-colors peer-checked:bg-emerald-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
                          <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                        </label>
                      </InlineStack>
                    </div>
                  </IndexTable.Cell>
                  <IndexTable.Cell className="align-middle">
                    <Badge tone={bundle.type === "discounted" ? "info" : "success"}>
                      {bundle.type === "discounted"
                        ? "Quantity Discount"
                        : "Bundles"}
                    </Badge>
                  </IndexTable.Cell>
                  <IndexTable.Cell className="align-middle">
                    <InlineStack gap="100">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded border border-gray-300 bg-transparent p-1.5 text-gray-500 transition hover:border-gray-400 hover:bg-gray-100 hover:text-gray-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          if (isAuthenticating) return;
                          handleMenuAction(bundle, "edit");
                        }}
                        aria-label="Edit bundle"
                        title="Edit"
                        disabled={isLoading || isAuthenticating}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded border border-gray-300 bg-transparent p-1.5 text-gray-500 transition hover:border-gray-400 hover:bg-gray-100 hover:text-gray-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          if (isAuthenticating) return;
                          handleMenuAction(bundle, "delete");
                        }}
                        aria-label="Delete bundle"
                        title="Delete"
                        disabled={isLoading || isAuthenticating}
                      >
                        <Trash2 size={16} />
                      </button>
                    </InlineStack>
                  </IndexTable.Cell>
                </IndexTable.Row>
              );
            })}
          </IndexTable>
        </Box>
        </Box>
      </Card>
    </>
  );
}

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - date;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours}hr${diffInHours > 1 ? 's' : ''} ago`;
  } else {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return diffInMinutes > 0 ? `${diffInMinutes}min ago` : "Just now";
  }
}
