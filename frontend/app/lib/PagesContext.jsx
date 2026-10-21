import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { usePosthogAfterIdentify } from "./PosthogIdentityContext";

const PagesContext = createContext(null);

function applyStorePayloadToState(data, setters) {
  const {
    setPageCountInPaymentCycle,
    setPublishPageCountInPaymentCycle,
    setStoreDetails,
    setFreeProducts,
    setStoreDetailsFetched,
  } = setters;
  if (!data?.success || !data.store) return;
  if (data.store.is_internal) {
    setPageCountInPaymentCycle(0);
    setPublishPageCountInPaymentCycle(0);
  } else {
    setPageCountInPaymentCycle(data.products_count_after_payment);
    setPublishPageCountInPaymentCycle(data.published_products_count_after_payment);
  }
  setStoreDetails(data.store);
  setFreeProducts(data.free_products || []);
  setStoreDetailsFetched(true);
}

export function PagesProvider({ children, initialPages = [], shop, apiKey, skipInitialFetch = false }) {
  const [pages, setPages] = useState(initialPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [pageCountInPaymentCycle, setPageCountInPaymentCycle] = useState(0);
  const [publishedPageCountInPaymentCycle, setPublishPageCountInPaymentCycle] = useState(0)
  const [storeDetails, setStoreDetails] = useState(null);
  const [freeProducts, setFreeProducts] = useState([]);
  const [storeDetailsFetched, setStoreDetailsFetched] = useState(false);
  const posthog = usePosthogAfterIdentify();

  const storeSetters = useMemo(
    () => ({
      setPageCountInPaymentCycle,
      setPublishPageCountInPaymentCycle,
      setStoreDetails,
      setFreeProducts,
      setStoreDetailsFetched,
    }),
    []
  );

  const fetchStoreDetails = useCallback(async () => {
    try {
      const response = await fetch("/api/store-details", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        applyStorePayloadToState(data, storeSetters);
      } else {
        console.warn('Failed to fetch store details');
      }
    } catch (error) {
      console.error('Error fetching store details:', error);
    }
  }, [storeSetters]);

  const fetchPages = useCallback(async (limit = 100, offset = 0) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append("limit", limit.toString());
      queryParams.append("offset", offset.toString());

      // First page: one round-trip for store details + pages (Python /api/shopify/pages-bootstrap).
      if (offset === 0) {
        const response = await fetch(
          `/api/pages-bootstrap?${queryParams.toString()}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch pages");
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch pages");
        }

        applyStorePayloadToState(data, storeSetters);

        const newPages = data.data || [];
        setPages(newPages);
        return { data: newPages, pagination: data.pagination };
      }

      // Load more: pages only (store counts unchanged).
      const response = await fetch(
        `/api/generated-pages?${queryParams.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch pages");
      }

      const data = await response.json();
      if (data.success) {
        const newPages = data.data || [];
        setPages((prev) => [...prev, ...newPages]);
        return { data: newPages, pagination: data.pagination };
      }
      throw new Error(data.error || "Failed to fetch pages");
    } catch (err) {
      console.error("Error fetching pages:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeSetters]);

  const publishedPages = useMemo(() => {
    return pages.filter(page => page.published);
  }, [pages]);

  useEffect(() => {
    if (!posthog) return;
    const totalPages = (pages || []).length;
    const publishedPagesCount = (pages || []).filter(page => page.published).length;
    const enabledPagesCount = (publishedPages || []).filter(page => page.is_enabled).length;

    posthog.setPersonProperties({
      pdp_gen_count: totalPages,
      pdp_live_count: publishedPagesCount,
      pdp_kluck_toggle_on_count: enabledPagesCount,
    });

  }, [pages, posthog, publishedPages]);

  const refreshPages = useCallback(async () => {
    return await fetchPages(100, 0);
  }, [fetchPages]);

  // Initial fetch on mount - only when store is onboarded (skip when on onboarding screen)
  useEffect(() => {
    if (!hasInitialized && shop && apiKey && !skipInitialFetch) {
      setHasInitialized(true);
      fetchPages(100, 0).catch((err) => {
        console.error("Error in initial pages fetch:", err);
      });
    }
  }, [shop, apiKey, hasInitialized, skipInitialFetch, fetchPages]);

  const value = useMemo(() => ({
    pages,
    publishedPages,
    setPages,
    loading,
    error,
    fetchPages,
    refreshPages,
    storeDetails,
    pageCountInPaymentCycle,
    freeProducts,
    publishedPageCountInPaymentCycle
  }), [pages, publishedPages, loading, error, fetchPages, refreshPages, storeDetails, pageCountInPaymentCycle, publishedPageCountInPaymentCycle, freeProducts]);

  return <PagesContext.Provider value={value}>{children}</PagesContext.Provider>;
}

export function usePages() {
  const context = useContext(PagesContext);
  if (!context) {
    throw new Error("usePages must be used within a PagesProvider");
  }
  return context;
}
