import React, { useState, useEffect, useRef, useCallback } from "react";
import { Text, Spinner, Modal, EmptyState } from "@shopify/polaris";
import { Check, ImageOff, Info, Search, X } from "lucide-react";
import { EMPTY_STATE_IMAGE } from "../lib/emptyStateImage";
const getProductImage = (product) => {
  if (product?.featuredImage?.url) {
    return { url: product.featuredImage.url, altText: product.featuredImage.altText };
  }
  const node = product?.images?.edges?.[0]?.node;
  return node ? { url: node.url, altText: node.altText } : null;
};


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
  const [loadError, setLoadError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

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
      if (!response.ok) {
        console.error("Error fetching products:", response.status);
        return { products: [], pageInfo: {}, failed: true, status: response.status };
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching products:", error);
      return { products: [], pageInfo: {}, failed: true };
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
      setLoadError(null);
      setSelectedItems(
        initialSelectedIdsKey
          ? initialSelectedIdsKey.split(INITIAL_SELECTED_IDS_DELIMITER)
          : []
      );

      fetchProducts(null, null).then((data) => {
        setProducts(data.products || []);
        setPageInfo(data.pageInfo || {});
        setLoadError(data.failed ? { status: data.status } : null);
        setIsLoading(false);
      });
    }
  }, [open, initialSelectedIdsKey, reloadCount]);

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
      ? `${selectedItems.length}/${resolvedMax} selected`
      : `${selectedItems.length} selected (${resolvedMin}–${resolvedMax})`;

  const modalTitle =
    resolvedMax === 1
      ? "Select a product"
      : resolvedMin === resolvedMax
        ? `Select ${resolvedMax} products`
        : `Select up to ${resolvedMax} products`;

  const toggleProduct = (product) => {
    if (hasMissingDescription(product)) return;
    setSelectedItems((prev) => {
      // Deselect if already selected
      if (prev.includes(product.id)) {
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
  };

  // Selected products (for the footer thumbnails), looked up across everything loaded so far.
  const loadedById = new Map();
  for (const p of products) if (p?.id) loadedById.set(p.id, p);
  for (const p of searchResults) if (p?.id) loadedById.set(p.id, p);
  const selectedPreview = selectedItems.map((id) => loadedById.get(id)).filter(Boolean);

  const limitReached = resolvedMax > 1 && selectedItems.length >= resolvedMax;
  const showSkeleton = isLoading || (isSearching && searchResults.length === 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      size="fullScreen"
      footer={
        <div className="flex items-center gap-3">
          {selectedPreview.length > 0 ? (
            <span className="flex -space-x-2" aria-hidden>
              {selectedPreview.slice(0, 5).map((product) => {
                const image = getProductImage(product);
                return (
                  <span
                    key={product.id}
                    className="h-8 w-8 overflow-hidden rounded-lg bg-slate-100 ring-2 ring-white"
                  >
                    {image?.url ? (
                      <img src={image.url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                );
              })}
            </span>
          ) : null}
          <span className="text-sm font-medium text-slate-600">{footerCountLabel}</span>
        </div>
      }
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
      primaryAction={{
        content: "Select",
        disabled: !selectionCountOk,
        onAction: handleConfirm,
      }}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 pb-4 pt-4 sm:px-5">
        {subtitle ? (
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 px-3.5 py-2.5 ring-1 ring-inset ring-blue-100">
            <Info size={16} aria-hidden className="mt-0.5 flex-none text-[#1e40af]" />
            <p className="m-0 text-[13px] leading-relaxed text-slate-700">{subtitle}</p>
          </div>
        ) : null}
        <div className="relative">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            autoComplete="off"
            className="h-11 w-full rounded-xl border-0 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]"
          />
          {searchQuery ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-slate-200/70 p-0 text-slate-600 transition hover:bg-slate-300"
            >
              <X size={13} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {/* Product grid */}
      <div
        ref={modalScrollRef}
        className="bg-slate-50/60"
        style={{ height: "calc(100vh - 260px)", maxHeight: "620px", overflowY: "auto", overflowX: "hidden" }}
      >
        {showSkeleton ? (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                <div className="aspect-square w-full bg-slate-100" />
                <div className="flex flex-col gap-2 p-2.5">
                  <span className="h-3 w-4/5 rounded-full bg-slate-100" />
                  <span className="h-3 w-1/2 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError && filteredProducts.length === 0 ? (
          <EmptyState
            heading="We couldn't load your products"
            image={EMPTY_STATE_IMAGE}
            action={{
              content: "Try again",
              onAction: () => setReloadCount((count) => count + 1),
            }}
          >
            <Text as="p" variant="bodySm" tone="subdued">
              {loadError.status
                ? `Something went wrong (error ${loadError.status}). Try again, or contact support if this keeps happening.`
                : "Check your connection and try again."}
            </Text>
          </EmptyState>
        ) : filteredProducts.length === 0 ? (
          <EmptyState heading="No products found" image={EMPTY_STATE_IMAGE}>
            <Text as="p" variant="bodySm" tone="subdued">
              {searchQuery?.trim()
                ? "Try a different search term or clear your filters."
                : "Create a product in your Shopify admin to get started."}
            </Text>
          </EmptyState>
        ) : (
          <>
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5 lg:grid-cols-4">
              {filteredProducts.map((product) => {
                const image = getProductImage(product);
                const missingDescription = hasMissingDescription(product);
                const isSelected = selectedItems.includes(product.id);
                const blocked = missingDescription || (limitReached && !isSelected);
                return (
                  <li key={product.id} className="min-w-0">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Select ${product.title}`}
                      disabled={blocked}
                      onClick={() => toggleProduct(product)}
                      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl border-0 bg-white p-0 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] ${
                        isSelected
                          ? "ring-2 ring-[#1e40af] shadow-[0_10px_24px_-14px_rgba(30,64,175,0.7)]"
                          : "ring-1 ring-slate-200 hover:shadow-md hover:ring-blue-300"
                      } ${blocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    >
                      <span className="relative block aspect-square w-full overflow-hidden bg-slate-100">
                        {image?.url ? (
                          <img
                            src={image.url}
                            alt={image.altText || product.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-slate-300">
                            <ImageOff size={28} aria-hidden />
                          </span>
                        )}
                        <span
                          aria-hidden
                          className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ${
                            isSelected
                              ? "bg-[#1e40af] text-white"
                              : "bg-white/90 ring-1 ring-inset ring-slate-300"
                          }`}
                        >
                          {isSelected ? <Check size={14} strokeWidth={3} /> : null}
                        </span>
                      </span>
                      <span className="flex flex-1 flex-col gap-0.5 p-2.5">
                        <span className="line-clamp-2 text-[13px] font-medium leading-snug text-slate-900">
                          {product.title}
                        </span>
                        {missingDescription ? (
                          <span className="text-xs text-red-600">Missing description</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {loadingMore ? (
              <div className="flex justify-center pb-5">
                <Spinner size="small" />
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
