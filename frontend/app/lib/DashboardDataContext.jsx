import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useSearchParams } from "react-router";

const DashboardDataContext = createContext(null);

const FALLBACK_DATA = {
  products: [],
  pageInfo: {},
  currentCursor: null,
  totalCount: 0,
  productsPerPage: 15,
  host: null,
  locales: [],
  productSource: null,
  marketPreferences: null,
};

/**
 * Hook to consume dashboard data from context.
 * Returns fallback empty data if used outside provider.
 */
export function useDashboardLoaderData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    return FALLBACK_DATA;
  }
  return context;
}

/**
 * Provider that manages dashboard data (products list, locales).
 *
 * Performance: accepts `initialData` from the parent app-data fetch so that
 * the first render uses pre-fetched locales without an extra round-trip.
 * A full products fetch is still triggered once on mount (needed for the generate
 * flow), but locales are available immediately from initialData.
 *
 * Subsequent pagination fetches (cursor changes) always hit /api/dashboard-data.
 */
export function DashboardDataProvider({ productSource, initialData, children }) {
  const [searchParams] = useSearchParams();
  const [dashboardData, setDashboardData] = useState(null);

  // Track whether we've already done the first full products fetch so we don't
  // re-fetch when unrelated search params change.
  const hasFetchedRef = useRef(false);

  const cursor = useMemo(() => searchParams.get("cursor") || "", [searchParams]);
  const host = useMemo(() => searchParams.get("host") || "", [searchParams]);

  const updateMarketPreferences = useCallback((prefs) => {
    if (!prefs) return;
    setDashboardData((prev) => ({
      ...(prev ?? FALLBACK_DATA),
      marketPreferences: prefs,
      productSource: prev?.productSource ?? productSource,
    }));
  }, [productSource]);

  // Seed locales from the parent app-data fetch as soon as it arrives.
  useEffect(() => {
    if (!initialData) return;
    setDashboardData((prev) => {
      // Don't overwrite a full fetch result that already has products
      if (prev?.products?.length) {
        // Still refresh market prefs from app-data if provided (can be stale after Preferences save;
        // updateMarketPreferences / store-flow refetch are the source of truth after that).
        return prev;
      }
      return {
        ...FALLBACK_DATA,
        locales: initialData.locales || [],
        totalCount: initialData.productsCount ?? 0,
        marketPreferences: initialData.marketPreferences || null,
        productSource,
      };
    });
  }, [initialData, productSource]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      try {
        const response = await fetch(
          `/api/dashboard-data?cursor=${encodeURIComponent(cursor)}&host=${encodeURIComponent(host)}`
        );
        if (cancelled) return;

        const data = await response.json();
        setDashboardData((prev) => ({
          ...data,
          productSource,
          marketPreferences:
            data.marketPreferences ?? prev?.marketPreferences ?? null,
        }));
        hasFetchedRef.current = true;
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDashboardData((prev) => prev ?? {
          ...FALLBACK_DATA,
          productSource,
        });
      }
    }

    // On the initial load (empty cursor), skip the fetch if we already have
    // product data from a previous fetch. Only re-fetch when the user paginates.
    if (cursor === "" && hasFetchedRef.current) return;

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [cursor, host, productSource]);

  const value = useMemo(
    () => ({
      ...(dashboardData ?? FALLBACK_DATA),
      updateMarketPreferences,
    }),
    [dashboardData, updateMarketPreferences],
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}
