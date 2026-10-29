import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  InlineStack,
  Text,
  Spinner,
  Modal,
  ResourceList,
  ResourceItem,
  TextField,
  EmptyState,
  Select,
  Icon,
  Checkbox,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { EMPTY_STATE_IMAGE } from "../lib/emptyStateImage";

// Helper functions
const stripHtml = (html) => {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

const INITIAL_SELECTED_IDS_DELIMITER = "\u001f";

export default function ProductSelectionModal({
  open,
  onClose,
  onConfirm,
  requireDescription = false,
  maxSelectable = 1,
  /**
   * Minimum products required before Select is enabled.
   * Default: same as maxSelectable (exact count — e.g. store multi must pick 3).
   * Pass minSelectable={1} for range pickers (bundles 1–100, brand ads 1–6).
   */
  minSelectable,
  initialSelectedIds = [],
  subtitle = null,
}) {
  const resolvedMax = Math.max(1, Number(maxSelectable) || 1);
  const resolvedMin = Math.min(
    resolvedMax,
    Math.max(
      1,
      Number(minSelectable) > 0 ? Number(minSelectable) : resolvedMax,
    ),
  );

  // State
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchPageInfo, setSearchPageInfo] = useState({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Refs
  const modalScrollRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const initialSelectedIdsKey = Array.isArray(initialSelectedIds)
    ? initialSelectedIds.join(INITIAL_SELECTED_IDS_DELIMITER)
    : "";

  // Fetch products
  const fetchProducts = async (cursor = null, query = null) => {
    try {
      const params = new URLSearchParams();
      if (query) params.append("search", query);
      if (cursor) params.append("cursor", cursor);

      const queryString = params.toString();
      const url = queryString ? `/api/products?${queryString}` : "/api/products";
      
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch products");
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching products:", error);
      return { products: [], pageInfo: {} };
    }
  };

  // Load initial products when modal opens
  useEffect(() => {
    if (open) {
      loadingMoreRef.current = false;
      setIsLoading(true);
      setProducts([]);
      setPageInfo({});
      setSearchQuery("");
      setSearchBy("all");
      setSearchResults([]);
      setSearchPageInfo({});
      setSelectedItems(
        initialSelectedIdsKey
          ? initialSelectedIdsKey.split(INITIAL_SELECTED_IDS_DELIMITER)
          : []
      );
      
      fetchProducts(null, null).then((data) => {
        setProducts(data.products || []);
        setPageInfo(data.pageInfo || {});
        setIsLoading(false);
      });
    }
  }, [open, initialSelectedIdsKey]);

  // Handle search with debounce
  useEffect(() => {
    if (!open) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const query = (searchQuery || "").trim();
    if (!query) {
      setIsSearching(false);
      setSearchResults([]);
      setSearchPageInfo({});
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const data = await fetchProducts(null, query);
      setSearchResults(data.products || []);
      setSearchPageInfo(data.pageInfo || {});
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, open, searchBy]);

  // Infinite scroll
  useEffect(() => {
    if (!open || !modalScrollRef.current) return;
    const container = modalScrollRef.current;
    
    const handleScroll = () => {
      if (loadingMoreRef.current) return;

      const currentPageInfo = searchQuery?.trim() && searchResults.length > 0
        ? searchPageInfo
        : pageInfo;

      if (
        container.scrollTop + container.clientHeight >= container.scrollHeight - 100 &&
        currentPageInfo?.hasNextPage
      ) {
        loadingMoreRef.current = true;
        setLoadingMore(true);
        const cursor = currentPageInfo.endCursor;
        const query = searchQuery?.trim() || null;

        fetchProducts(cursor, query)
          .then((data) => {
            if (query) {
              setSearchResults((prev) => [...prev, ...(data.products || [])]);
              setSearchPageInfo(data.pageInfo || {});
            } else {
              setProducts((prev) => [...prev, ...(data.products || [])]);
              setPageInfo(data.pageInfo || {});
            }
          })
          .finally(() => {
            loadingMoreRef.current = false;
            setLoadingMore(false);
          });
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [open, pageInfo, searchPageInfo, searchQuery, searchResults]);

  const filteredProducts = searchQuery?.trim() && searchResults.length > 0
    ? searchResults
    : products;

  const hasMissingDescription = useCallback((product) => {
    if (!requireDescription) return false;
    const rawDescription = product.description || product.descriptionHtml || "";
    return stripHtml(rawDescription).trim() === "";
  }, [requireDescription]);

  const selectionCountOk =
    selectedItems.length >= resolvedMin &&
    selectedItems.length <= resolvedMax;

  const handleConfirm = () => {
    if (!selectionCountOk) return;

    // Resolve by ID from all loaded product lists — not only `filteredProducts`.
    // If the user picked items from search and then cleared search, those rows
    // disappear from `filteredProducts` but IDs stay in `selectedItems`; filtering
    // only the current list would drop them and multi-select could collapse to 1
    // product (often the same as a prior single selection).
    const productById = new Map();
    for (const p of products) {
      if (p?.id) productById.set(p.id, p);
    }
    for (const p of searchResults) {
      if (p?.id) productById.set(p.id, p);
    }

    const selectedProducts = selectedItems
      .map((id) => productById.get(id))
      .filter(Boolean);

    if (selectedProducts.length === 0) return;
    if (
      selectedProducts.length < resolvedMin ||
      selectedProducts.length > resolvedMax
    ) {
      return;
    }

    const validProducts = selectedProducts.filter(
      (product) => !hasMissingDescription(product)
    );

    if (validProducts.length === 0) return;
    if (
      validProducts.length < resolvedMin ||
      validProducts.length > resolvedMax
    ) {
      return;
    }

    if (resolvedMax === 1) {
      onConfirm(validProducts[0]);
    } else {
      onConfirm(validProducts);
    }

    onClose();
  };

  const footerCountLabel =
    resolvedMin === resolvedMax
      ? `${selectedItems.length}/${resolvedMax} products selected`
      : `${selectedItems.length} selected (${resolvedMin}–${resolvedMax})`;

  // --- CLEAN FOOTER FIX ---
  // Just passing InlineStack allows Polaris to wrap it in its own native Modal footer styling
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select product"
      size="fullScreen"
      footer={
        <Text as="p" tone="subdued">
          {footerCountLabel}
        </Text>
      }
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
      primaryAction={{
        content: "Select",
        disabled: !selectionCountOk,
        onAction: handleConfirm,
      }}
    >
      {subtitle ? (
        <Box padding="400" paddingBlockEnd="0">
          <div style={{ background: "#fff8e1", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 18, lineHeight: 1.3, flexShrink: 0 }} aria-hidden="true">⚠️</span>
            <Text as="p" variant="bodySm" fontWeight="semibold">
              {subtitle}
            </Text>
          </div>
        </Box>
      ) : null}
      {/* Search & Filters Section */}
      <Box padding="400" borderBlockEndWidth="025" borderColor="border">
        <InlineStack gap="400" blockAlign="center" wrap={false}>
          <div style={{ flexGrow: 1 }}>
            <TextField
              label="Search products"
              labelHidden
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search products"
              autoComplete="off"
              prefix={<Icon source={SearchIcon} />}
              clearButton
              onClearButtonClick={() => setSearchQuery("")}
            />
          </div>
          {/* <div style={{ flexShrink: 0 }}>
            <Select
              label="Search by"
              labelHidden
              options={[
                { label: "All", value: "all" },
                { label: "Product title", value: "product_title" },
                { label: "Product ID", value: "product_id" },
                { label: "Barcode", value: "barcode" },
                { label: "SKU", value: "sku" },
              ]}
              value={searchBy}
              onChange={setSearchBy}
            />
          </div> */}
        </InlineStack>
      </Box>

      {/* Resource List Section */}
      <Box 
        ref={modalScrollRef} 
        style={{ height: "calc(100vh - 220px)", maxHeight: "600px", overflowY: "auto", overflowX: "hidden" }}
      >
        {isLoading || (isSearching && searchResults.length === 0) ? (
          <Box padding="800">
            <InlineStack align="center" blockAlign="center">
              <Spinner size="large" />
            </InlineStack>
          </Box>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            heading="No products found"
            image={EMPTY_STATE_IMAGE}
          >
            <Text as="p" variant="bodySm" tone="subdued">
              {searchQuery?.trim()
                ? "Try a different search term or clear your filters."
                : "Create a product in your Shopify admin to get started."}
            </Text>
          </EmptyState>
        ) : (
          <Box paddingBlockEnd="400">
            <ResourceList
              resourceName={{ singular: "product", plural: "products" }}
              items={filteredProducts}
              // Removed `selectable` natively to remove the "Showing X products" header completely
              renderItem={(product) => {
                const firstImage = product.featuredImage?.url
                  ? { url: product.featuredImage.url, altText: product.featuredImage.altText }
                  : product.images?.edges?.[0]?.node
                  ? { url: product.images.edges[0].node.url, altText: product.images.edges[0].node.altText }
                  : null;

                const missingDescription = hasMissingDescription(product);
                const isSelected = selectedItems.includes(product.id);

                return (
                  <ResourceItem
                    id={product.id}
                    accessibilityLabel={`Select ${product.title}`}
                    disabled={missingDescription}
                    onClick={() => {
                      if (missingDescription) return;

                      setSelectedItems((prev) => {
                        const alreadySelected = prev.includes(product.id);

                        // Deselect if already selected
                        if (alreadySelected) {
                          return prev.filter((id) => id !== product.id);
                        }

                        // Single-select mode
                        if (resolvedMax === 1) {
                          return [product.id];
                        }

                        // Multi-select with limit
                        if (prev.length >= resolvedMax) {
                          return prev;
                        }

                        return [...prev, product.id];
                      });
                    }}
                  >
                    <InlineStack wrap={false} blockAlign="center" gap="400">
                      {/* Checkbox manually rendered so we control the layout */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onChange={(checked) => {
                            if (missingDescription) return;

                            setSelectedItems((prev) => {
                              const alreadySelected = prev.includes(product.id);

                              if (!checked && alreadySelected) {
                                return prev.filter((id) => id !== product.id);
                              }

                              if (checked && !alreadySelected) {
                                if (resolvedMax === 1) {
                                  return [product.id];
                                }

                                if (prev.length >= resolvedMax) {
                                  return prev;
                                }

                                return [...prev, product.id];
                              }

                              return prev;
                            });
                          }}
                          label={`Select ${product.title}`}
                          labelHidden
                        />
                      </div>
                      
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          minWidth: "40px",
                          borderRadius: "4px",
                          overflow: "hidden",
                          background: "#f1f2f4",
                          border: "1px solid #e1e3e5",
                        }}
                      >
                        {firstImage?.url ? (
                          <img
                            src={firstImage.url}
                            alt={firstImage?.altText || product.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : null}
                      </div>
                      
                      <Text as="span" variant="bodyMd" tone="base" breakWord>
                        {product.title}
                        {missingDescription && (
                          <Text as="span" variant="bodySm" tone="critical">
                            {" "} (Missing description)
                          </Text>
                        )}
                      </Text>
                    </InlineStack>
                  </ResourceItem>
                );
              }}
            />
            {loadingMore && (
              <Box padding="400">
                <InlineStack align="center" blockAlign="center">
                  <Spinner size="small" />
                </InlineStack>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Modal>
  );
}