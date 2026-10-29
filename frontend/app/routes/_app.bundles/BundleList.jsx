import {
  IndexTable,
  Text,
  Box,
  BlockStack,
  InlineStack,
  IndexFilters,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import { Boxes, Edit, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { PrimaryButton, StatusPill } from "../../components/RoarrUI";

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
        <section
          className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-14 shadow-sm ring-1 ring-slate-200/70"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle size={28} className="animate-spin text-[#1e3a8a]" aria-hidden />
          <p className="m-0 text-sm text-slate-500">Loading bundles…</p>
        </section>
      );
    }
    return (
      <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-200/70">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1e40af] ring-1 ring-inset ring-blue-100">
            <Boxes size={26} aria-hidden />
          </span>
          <h3 className="m-0 mt-4 text-lg font-bold tracking-tight text-slate-900">
            Create your first bundle
          </h3>
          <p className="m-0 mt-1.5 text-sm leading-relaxed text-slate-500">
            Use bundles to increase average order value with quantity discounts and upsell offers on
            your products.
          </p>
          {onCreate ? (
            <PrimaryButton className="mt-5" onClick={onCreate}>
              <Plus size={16} aria-hidden />
              Create bundle
            </PrimaryButton>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
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
                        <StatusPill tone={bundle.isActive ? "success" : "neutral"}>
                          {bundle.isActive ? "Published" : "Draft"}
                        </StatusPill>

                        <label className="relative inline-flex h-6 w-11 items-center">
                          <input
                            type="checkbox"
                            checked={bundle.isActive || false}
                            aria-label={`${bundle.isActive ? "Unpublish" : "Publish"} ${bundle.name}`}
                            onChange={(e) => {
                              if (isAuthenticating) return;
                              if (onToggleStatus) {
                                onToggleStatus(bundle, e.target.checked);
                              }
                            }}
                            disabled={isLoading || isAuthenticating}
                            className="peer sr-only"
                          />
                          <span className="h-6 w-11 cursor-pointer rounded-full bg-slate-300 transition-colors peer-checked:bg-[#1e3a8a] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1e3a8a] peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
                          <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                        </label>
                      </InlineStack>
                    </div>
                  </IndexTable.Cell>
                  <IndexTable.Cell className="align-middle">
                    <StatusPill tone={bundle.type === "discounted" ? "info" : "neutral"}>
                      {bundle.type === "discounted"
                        ? "Quantity Discount"
                        : "Bundles"}
                    </StatusPill>
                  </IndexTable.Cell>
                  <IndexTable.Cell className="align-middle">
                    <InlineStack gap="100">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg bg-white p-1.5 text-slate-500 ring-1 ring-inset ring-slate-200 transition hover:bg-blue-50 hover:text-[#1e40af] hover:ring-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
                        className="inline-flex items-center justify-center rounded-lg bg-white p-1.5 text-slate-500 ring-1 ring-inset ring-slate-200 transition hover:bg-red-50 hover:text-red-600 hover:ring-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
      </section>
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
