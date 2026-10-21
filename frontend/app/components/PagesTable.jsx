import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, useOutletContext } from "react-router";
import { buildEmbeddedHref } from "../lib/embeddedNavigation";
import { usePages } from "../lib/PagesContext";
import {
  Box,
  BlockStack,
  Badge,
  Frame,
  IndexFilters,
  IndexTable,
  InlineStack,
  Text,
  Toast,
  Tooltip,
  useSetIndexFiltersMode,
  Modal,
  Button,
  Popover,
  ActionList,
  Spinner,
  Pagination,
  SkeletonBodyText,
  SkeletonThumbnail,
} from "@shopify/polaris";
import { EditIcon, ExternalIcon, MenuHorizontalIcon } from "@shopify/polaris-icons";

import { usePosthogAfterIdentify } from "../lib/PosthogIdentityContext";

/**
 * Toast requires Polaris {@link Frame} context. The default Frame is min-height: 100vh and
 * Frame__Main has border-inline-end — nested inside product/store hubs that causes extra
 * scroll and a stray vertical line. Scoped overrides match embedded hub behavior (Brand Ads
 * table has no Frame).
 */
const PAGES_TABLE_FRAME_HOST_CLASS = "roarr-pages-table-frame-host";
const pagesTableFrameHostStyles = (
  <style>{`
    .${PAGES_TABLE_FRAME_HOST_CLASS} .Polaris-Frame {
      min-height: 0;
      height: auto;
      width: 100%;
      margin-left: 0;
      background-color: transparent;
    }
    @media (min-width: 48em) {
      .${PAGES_TABLE_FRAME_HOST_CLASS} .Polaris-Frame {
        width: 100%;
        margin-left: 0;
      }
    }
    .${PAGES_TABLE_FRAME_HOST_CLASS} .Polaris-Frame__Main {
      border-inline-end: none;
      max-width: 100%;
    }
  `}</style>
);

/** Client-side paginated IndexTable: avoid Polaris sticky/max-height scrollbars inside hubs. */
const PAGES_TABLE_INDEX_HOST_CLASS = "roarr-pages-table-host";
const pagesTableIndexHostStyles = (
  <style>{`
    .${PAGES_TABLE_INDEX_HOST_CLASS} {
      overflow: hidden !important;
      max-height: none !important;
    }
    .${PAGES_TABLE_INDEX_HOST_CLASS} .Polaris-IndexTable__Table {
      overflow: hidden !important;
      max-height: none !important;
    }
    .${PAGES_TABLE_INDEX_HOST_CLASS} .Polaris-IndexTable__Table--sticky {
      overflow: hidden !important;
    }
  `}</style>
);

function PagesTableFrameHost({ children }) {
  return (
    <div className={PAGES_TABLE_FRAME_HOST_CLASS} style={{ minWidth: 0, maxWidth: "100%" }}>
      {pagesTableFrameHostStyles}
      {children}
    </div>
  );
}

/**
 * @param {"all" | "product" | "store"} [listFilter]
 * @param {string} [hubBasePath] — embedded path for edit / empty create (e.g. `/product-page`)
 * @param {() => void} [onEmptyCreateClick] — when set, empty-state primary action calls this instead of navigating
 * @param {boolean} [hideWhenNoHubPages] — when true on product/store hubs, render nothing if there are no pages of that type (hub shows welcome-only empty state above).
 */
export default function PagesTable({
  listFilter = "all",
  hubBasePath,
  onEmptyCreateClick,
  hideWhenNoHubPages = false,
}) {
  /** "Product page" and "Entire store" hubs already filter by type — column is redundant. */
  const showGenerationTypeColumn = listFilter === "all";
  const showProductPageColumn = listFilter !== "store";
  const pagesTableHeadings = useMemo(
    () => [
      { id: "title", title: "Title" },
      ...(showGenerationTypeColumn
        ? [{ id: "generation-type", title: "Generation Type" }]
        : []),
      { id: "status", title: "Status" },
      { id: "ai-generation", title: "AI Generation" },
      { id: "last-updated", title: "Last Updated" },
      ...(showProductPageColumn
        ? [{ id: "product-page", title: <div style={{ display: "block", textAlign: "center" }}>Product page</div> }]
        : []),
      { id: "action", title: <div style={{ display: "block", textAlign: "center" }}>Action</div> },
    ],
    [showGenerationTypeColumn, showProductPageColumn],
  );
  const pagesTableColumnCount = pagesTableHeadings.length;
  const posthog = usePosthogAfterIdentify();
  const navigate = useNavigate();
  const { isAuthenticating } = useOutletContext() || {};
  const { pages: contextPages, loading: contextLoading, error: contextError, fetchPages } = usePages();
  // const { pages: contextPages, loading: contextLoadingOriginal, error: contextError, fetchPages } = usePages();
  // const contextLoading = true;
  const fullscreenButtonRef = useRef(null);
  const closeFullscreenButtonRef = useRef(null);
  const SwitchToggle = ({ checked, disabled, loading, onToggle, ariaLabel }) => {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        aria-pressed={!!checked}
        disabled={!!disabled || !!loading}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled || loading) return;
          onToggle?.(!checked, e);
        }}
        className={[
          "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full p-0.5 transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-[#008060] focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "bg-[#008060]" : "bg-slate-200",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transition-all duration-150",
            checked ? "right-0.5 left-auto" : "left-0.5 right-auto",
          ].join(" ")}
        >
          {loading ? (
            <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
          ) : null}
        </span>
      </button>
    );
  };

  const [activeTab, setActiveTab] = useState("all");
  const [queryValue, setQueryValue] = useState("");
  const [sortSelected, setSortSelected] = useState(["updated_at desc"]);
  const [allPages, setAllPages] = useState([]);
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState({});
  const [editLoadingId, setEditLoadingId] = useState(null);
  const [openActionsMenuId, setOpenActionsMenuId] = useState(null);
  const [togglingEnabled, setTogglingEnabled] = useState({});
  const [toggleSuccessToast, setToggleSuccessToast] = useState(null);
  const { mode, setMode } = useSetIndexFiltersMode();
  const [searchParams] = useSearchParams();
  const hasProcessedProductIdRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const noWrapCellStyle = { whiteSpace: "nowrap" };
  const titleCellContentStyle = {
    minWidth: 0,
    maxWidth: "min(220px, 55vw)",
    overflow: "hidden",
  };

  /** Home preview / API may store image as a string URL or `{ src }`. */
  const resolveHomeImageUrl = (value) => {
    if (value == null) return null;
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (typeof value === "object" && value.src && typeof value.src === "string" && value.src.trim().length > 0) {
      return value.src.trim();
    }
    return null;
  };

  const getStoreTemplatePack = (page) => {
    const raw =
      page?.generation_data?.storeTemplatePack ||
      page?.generation_data?.store_template_pack ||
      page?.storeTemplatePack ||
      page?.store_template_pack ||
      "classic";
    const pack = String(raw || "classic").trim().toLowerCase();
    return pack === "cinematic" || pack === "amour" ? pack : "classic";
  };

  const getStoreProductTemplateLabel = (page) => {
    const raw =
      page?.selectedTemplate ??
      page?.selected_template ??
      page?.generation_data?.selectedTemplate ??
      page?.generation_data?.selected_template ??
      null;
    const n = Number(raw);
    if (n === 2) return "Vibe";
    if (n === 1) return "Sleek";
    return null;
  };

  const getStoreHasPremiumPdps = (page) => {
    const premiumIds =
      page?.generation_data?.premiumProductIds ||
      page?.generation_data?.premium_product_ids ||
      page?.premiumProductIds ||
      page?.premium_product_ids ||
      null;
    return Array.isArray(premiumIds) && premiumIds.length > 0;
  };

  const getStoreMarketType = (page) => {
    const raw =
      page?.market_type ||
      page?.marketType ||
      page?.generation_data?.market_type ||
      page?.generation_data?.marketType ||
      "";
    const key = String(raw || "").trim().toLowerCase();
    return key === "cod" || key === "prepaid" ? key : null;
  };

  /** Multi product uses banner_image_1 (first hero slide); classic uses feature_image; cinematic pack uses banner_image (16:9 hero). */
  const getStoreListThumbnailUrl = (page) => {
    const images = page?.generation_data?.home_page?.images || {};
    return (
      resolveHomeImageUrl(images.banner_image_1) ||
      resolveHomeImageUrl(images.feature_image) ||
      resolveHomeImageUrl(images.feature_image_1) ||
      resolveHomeImageUrl(images.banner_image) ||
      resolveHomeImageUrl(images.banner_image_mobile) ||
      resolveHomeImageUrl(images.product_story_image) ||
      resolveHomeImageUrl(images.circle_feature_image) ||
      null
    );
  };

  /** List subtitle: store type + theme combo (matches configure cards). */
  const getStoreListSubtitle = (page) => {
    const mode =
      page?.mode ||
      page?.generation_data?.mode?.type ||
      page?.generation_data?.mode ||
      "";
    const modeKey = typeof mode === "string" ? mode : "";
    const isMulti =
      modeKey === "multi_product" ||
      modeKey === "multi" ||
      page?.store_type === "multi";
    const pack = getStoreTemplatePack(page);
    const productTemplate = getStoreProductTemplateLabel(page);
    const market = getStoreMarketType(page);

    if (isMulti) {
      return "Multi Product - Swift";
    }
    return "Single Product - Swift";
  };

  const getGenerationTypeLabel = (page) => {
    if (page?.generation_type !== "store") {
      return "Product Page";
    }
    return "Entire Store";
  };

  // Use context pages directly
  useEffect(() => {
    if (contextPages) {
      setAllPages(contextPages);
    }
  }, [contextPages]);

  // Fetch additional pages when offset changes (pagination)
  useEffect(() => {
    async function loadMorePages() {
      if (offset === 0) {
        return;
      }

      try {
        setIsLoadingMore(true);
        const result = await fetchPages(limit, offset);
        if (result) {
          const newPages = result.data || [];
          setAllPages((prev) => [...prev, ...newPages]);
          setPagination(result.pagination || null);
        }
      } catch (err) {
        console.error("Error fetching more pages:", err);
      } finally {
        setIsLoadingMore(false);
      }
    }

    if (offset > 0) {
      loadMorePages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, limit]);

  // Helper function to populate navigation data from a page object
  const populateNavigationDataFromPage = (page) => {
    const productId = page.product_id || page.productId;
    const productTitle = page.product_title || "";
    const storedTemplate = page.selectedTemplate ?? page.selected_template ?? page.template;
    const template =
      storedTemplate == 3 || storedTemplate == "3" || storedTemplate == "template_3"
        ? 3
        : storedTemplate == 1 || storedTemplate == "template_1"
          ? 1
          : 2;
    const productDescription = page.product_description || "";
    const category = page.category || "general";

    if (!page.published && page.step !== undefined) {
      if (page.step === '1') {
        const productImages = page.generation_data?.images?.product_images
          ? Object.values(page.generation_data.images.product_images)
          : [];

        const generationStatus = page.generation_status || "pending";
        const isFailed = generationStatus.toLowerCase() === "failed" || generationStatus.toLowerCase() === "error";
        const isInProgress = generationStatus.toLowerCase() === "in_progress" ||
          generationStatus.toLowerCase() === "processing" ||
          generationStatus.toLowerCase() === "generating";

        return {
          productId,
          productTitle,
          productDescription,
          category,
          productImages,
          template,
          pageId: page.PK,
          autoStartMagic: false,
          checkStatusOnly: isInProgress,
          showFailedError: isFailed,
        };
      }

      if (page.step === '2' || page.step === '3') {
        return {
          productId,
          productTitle,
          productDescription,
          category,
          template,
          pageId: page.PK,
          initialStep: 2,
          generationData: page.generation_data || null,
        };
      }
    }

    return {
      productId,
      productTitle,
      productDescription,
      category,
      pageId: page.PK,
    };
  };

  // Handle productId from searchParams and navigate accordingly
  useEffect(() => {
    if (hasProcessedProductIdRef.current || !allPages || allPages.length === 0) {
      return;
    }

    const pageIdFromUrl = searchParams.get("pageId");
    if (!pageIdFromUrl) {
      return;
    }

    const matchingPage = allPages.find(page => {
      const pageId = page.PK;
      return pageId === pageIdFromUrl;
    });

    if (matchingPage) {
      hasProcessedProductIdRef.current = true;
      const navData = populateNavigationDataFromPage(matchingPage);

      sessionStorage.setItem("generateProductData", JSON.stringify(navData));
      navigate(
        buildEmbeddedHref("/", searchParams, searchParams.get("shop"))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPages, searchParams, navigate]);

  const storePdpParentId = (page) =>
    page?.source_store_page_id ||
    (typeof page?.PK === "string" && page.PK.includes("::store-pdp::")
      ? page.PK.split("::store-pdp::")[0]
      : null);

  const hubForPage = (page) => {
    if (storePdpParentId(page) || page?.generation_type === "store") return "/entire-store";
    return (
      hubBasePath ||
      (listFilter === "product"
        ? "/product-page"
        : listFilter === "store"
          ? "/entire-store"
          : "/product-page")
    );
  };

  const handleRowClick = async (page) => {
    if (!page.published && page.step !== undefined) {
      const shop = searchParams.get("shop");
      const hub = hubForPage(page);
      const parentId = storePdpParentId(page);
      const extra =
        page?.generation_type === "store" || parentId
          ? { pageId: parentId || page.PK, entireStore: 1 }
          : { pageId: page.PK };
      navigate(buildEmbeddedHref(hub, searchParams, shop, extra));
      return;
    }

    setSelectedPage(page);
    setIsPreviewOpen(true);
  };
  const [src, setSrc] = useState(null);

  const handleNavigateToEdit = (page) => {
    setEditLoadingId(page.PK);
    const shop = searchParams.get("shop");
    const hub = hubForPage(page);
    const parentId = storePdpParentId(page);
    if (page?.generation_type === "store" || parentId) {
      navigate(
        buildEmbeddedHref(hub, searchParams, shop, {
          pageId: parentId || page.PK,
          entireStore: 1,
        })
      );
      return;
    }
    navigate(buildEmbeddedHref(hub, searchParams, shop, { pageId: page.PK }));
  };

  useEffect(() => {
    if (src) {
      fullscreenButtonRef.current.click();
    }
  }, [src]);

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedPage(null);
  };

  const handleOpenPreviewLink = async (e, page) => {
    e?.stopPropagation?.();
    const pageId = page.PK;

    setLoadingLinks((prev) => ({ ...prev, [pageId]: true }));

    try {
      const themeIdRaw = page.theme_id ?? null;
      const storeSlug = page?.user_id?.replace?.(".myshopify.com", "");
      const isEntireStore = page?.generation_type === "store";
      let themeId =
        themeIdRaw != null && String(themeIdRaw).trim() !== ""
          ? String(themeIdRaw).trim()
          : null;
      if (themeId?.includes("gid://shopify/")) {
        themeId = themeId.split("/").pop() || null;
      }

      // Entire store: open theme editor only (no previewPath). Product pages need the API
      // so previewPath targets that product + Roarr template in the editor.
      if (isEntireStore && themeId && storeSlug) {
        const url = `https://admin.shopify.com/store/${storeSlug}/themes/${themeId}/editor`;
        window.open(url);
      } else {
        const response = await fetch(
          `/api/generate-preview-link?page_id=${pageId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to generate preview link");
        }

        const data = await response.json();
        if (data.success && data.preview_link) {
          window.open(data.preview_link);
        } else {
          throw new Error(data.error || "Failed to generate preview link");
        }
      }
    } catch (err) {
      console.error("Error generating preview link:", err);
      alert(`Failed to open preview link: ${err.message}`);
    } finally {
      setLoadingLinks((prev) => ({ ...prev, [pageId]: false }));
    }
  };

  const handleToggleEnabled = async (e, page, nextEnabled) => {
    e.stopPropagation();

    if (!page?.published || storePdpParentId(page)) {
      return;
    }

    const pageId = page.PK;
    const hasOriginalContent = !!(page?.original_content || page?.originalContent);
    const prevEnabled =
      typeof page?.is_enabled === "boolean"
        ? page.is_enabled
        : typeof page?.isEnabled === "boolean"
          ? page.isEnabled
          : true; // published + missing field => enabled by default

    // If page is already enabled but has no original snapshot, we can't restore.
    if (prevEnabled === true && nextEnabled === false && !hasOriginalContent) {
      return;
    }

    setTogglingEnabled((prev) => ({ ...prev, [pageId]: true }));

    // Optimistic UI update
    setAllPages((prev) =>
      prev.map((p) => (p.PK === pageId ? { ...p, is_enabled: !!nextEnabled } : p)),
    );

    posthog?.capture('pdp_toggle_changed', {
      pdp_id: pageId,
      toggle_state: nextEnabled ? 'on' : 'off',
    })


    try {
      const endpoint = nextEnabled
        ? "/api/publish-generated-content"
        : "/api/restore-original-content";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: pageId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update enabled status");
      }

      const data = await response.json().catch(() => ({}));
      if (!data?.success) {
        throw new Error(data?.error || "Failed to update enabled status");
      }

      setToggleSuccessToast(
        nextEnabled
          ? "Roarr version is now applied on the product page."
          : "Product page reverted to the original version.",
      );
    } catch (err) {
      console.error("Error updating enabled status:", err);

      // Rollback optimistic update
      setAllPages((prev) =>
        prev.map((p) => (p.PK === pageId ? { ...p, is_enabled: !!prevEnabled } : p)),
      );

      alert(`Failed to update enabled status: ${err.message}`);
    } finally {
      setTogglingEnabled((prev) => ({ ...prev, [pageId]: false }));
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";

    const now = new Date();
    const diffMs = now - date;
    if (diffMs < 0) return "Just now";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) {
      return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    }
    if (diffDays < 30) {
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    }
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
    }
    return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  };

  const tabs = [
    { id: "all", content: "All" },
    { id: "published", content: "Pushed" },
    { id: "draft", content: "Draft" },
  ];

  const selectedTabIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeTab),
  );

  const sortOptions = [
    { label: "Updated", value: "updated_at asc", directionLabel: "Ascending" },
    { label: "Updated", value: "updated_at desc", directionLabel: "Descending" },
    { label: "Created", value: "created_at asc", directionLabel: "Ascending" },
    { label: "Created", value: "created_at desc", directionLabel: "Descending" },
    { label: "Title", value: "title asc", directionLabel: "A-Z" },
    { label: "Title", value: "title desc", directionLabel: "Z-A" },
  ];

  const handleTabChange = (selectedTabIndex) => {
    const selectedTab = tabs[selectedTabIndex];
    setActiveTab(selectedTab.id);
    setOffset(0);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  // Reset to first page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [queryValue, sortSelected, activeTab]);

  const hubScopedPages = useMemo(
    () =>
      allPages.filter((page) => {
        if (listFilter === "product") return page?.generation_type !== "store";
        if (listFilter === "store") return page?.generation_type === "store";
        return true;
      }),
    [allPages, listFilter],
  );

  // Client-side filtering and sorting
  const filteredPages = allPages
    .filter((page) => {
      if (activeTab === "published") return !!page.published;
      if (activeTab === "draft") return !page.published;
      return true;
    })
    .filter((page) => {
      if (listFilter === "product") return page?.generation_type !== "store";
      if (listFilter === "store") return page?.generation_type === "store";
      return true;
    })
    .filter((page) => {
      const q = queryValue.trim().toLowerCase();
      if (!q) return true;
      const title = (page.product_title || "Untitled Page").toLowerCase();
      const category = (page.category || "").toLowerCase();
      const description = (page.product_description || "").toLowerCase();
      return title.includes(q) || category.includes(q) || description.includes(q);
    });

  const sortedPages = [...filteredPages].sort((a, b) => {
    const selected = sortSelected?.[0] || "updated_at desc";
    const [field, direction] = selected.split(" ");
    const dir = direction === "asc" ? 1 : -1;

    const getTime = (v) => (v ? new Date(v).getTime() : 0);
    const getTitle = (p) => (p.product_title || "Untitled Page").toLowerCase();

    if (field === "updated_at") return (getTime(a.updated_at) - getTime(b.updated_at)) * dir;
    if (field === "created_at") return (getTime(a.created_at) - getTime(b.created_at)) * dir;
    if (field === "title") return getTitle(a).localeCompare(getTitle(b)) * dir;
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedPages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPages = sortedPages.slice(startIndex, endIndex);


  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top of table when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show complete skeleton when loading
  if (contextLoading) {
    return (
      <Box
        background="bg-surface"
        borderWidth="025"
        borderColor="border"
        borderRadius="300"
        className="min-w-0 max-w-full overflow-hidden shadow-sm ring-1 ring-black/5"
      >


        {/* Skeleton for IndexFilters */}
        <Box>
          <div style={{ borderBottom: '1px solid #e1e3e5' }}>
            <Box paddingInline="300" paddingBlock="400">
              <BlockStack gap="200">
                {/* Skeleton for search and sort */}
                <InlineStack align="space-between" blockAlign="center">
                  <Box minWidth="160px">
                    <SkeletonBodyText lines={1} />
                  </Box>
                  <Box minWidth="140px">
                    <SkeletonBodyText lines={1} />
                  </Box>
                </InlineStack>
              </BlockStack>
            </Box>
          </div>
        </Box>

        {/* Skeleton for table */}
        <Box maxWidth="100%" minWidth={0} overflowX="hidden" className={PAGES_TABLE_INDEX_HOST_CLASS}>
          {pagesTableIndexHostStyles}
          <IndexTable
            resourceName={{ singular: "page", plural: "pages" }}
            itemCount={5}
            selectable={false}
            headings={pagesTableHeadings}
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <IndexTable.Row
                id={`skeleton-${index}`}
                key={`skeleton-${index}`}
                position={index}
              >
                <IndexTable.Cell>
                  <InlineStack gap="200" blockAlign="center">
                    <SkeletonThumbnail size="small" />
                    <BlockStack gap="100">
                      <SkeletonBodyText lines={1} />
                      <SkeletonBodyText lines={1} />
                    </BlockStack>
                  </InlineStack>
                </IndexTable.Cell>
                {showGenerationTypeColumn ? (
                  <IndexTable.Cell>
                    <SkeletonBodyText lines={1} />
                  </IndexTable.Cell>
                ) : null}
                {showProductPageColumn ? (
                  <IndexTable.Cell>
                    <SkeletonBodyText lines={1} />
                  </IndexTable.Cell>
                ) : null}
                <IndexTable.Cell>
                  <SkeletonBodyText lines={1} />
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <SkeletonBodyText lines={1} />
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <SkeletonBodyText lines={1} />
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <SkeletonBodyText lines={1} />
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
            <IndexTable.Row id="skeleton-pagination-footer" position={5}>
              <IndexTable.Cell colSpan={pagesTableColumnCount}>
                <InlineStack align="space-between" blockAlign="center" gap="300" wrap>
                  <Box minWidth="150px">
                    <SkeletonBodyText lines={1} />
                  </Box>
                  <InlineStack gap="200">
                    <Box minWidth="40px">
                      <SkeletonBodyText lines={1} />
                    </Box>
                    <Box minWidth="40px">
                      <SkeletonBodyText lines={1} />
                    </Box>
                  </InlineStack>
                </InlineStack>
              </IndexTable.Cell>
            </IndexTable.Row>
          </IndexTable>
        </Box>
      </Box>
    );
  }

  const hubHidesTableChrome =
    hideWhenNoHubPages &&
    (listFilter === "product" || listFilter === "store") &&
    hubScopedPages.length === 0 &&
    !contextLoading;

  if (hubHidesTableChrome) {
    if (contextError) {
      return (
        <PagesTableFrameHost>
          <Frame>
            <Box
              background="bg-surface"
              borderWidth="025"
              borderColor="border"
              borderRadius="300"
              padding="400"
            >
              <Text as="p" variant="bodyMd" tone="critical">
                Error: {contextError}
              </Text>
            </Box>
          </Frame>
        </PagesTableFrameHost>
      );
    }
    return null;
  }

  const toggleToastMarkup = toggleSuccessToast ? (
    <Toast content={toggleSuccessToast} onDismiss={() => setToggleSuccessToast(null)} />
  ) : null;

  return (
    <PagesTableFrameHost>
      <Frame>
        {toggleToastMarkup}
        <Box
          background="bg-surface"
          borderWidth="025"
          borderColor="border"
          borderRadius="300"
          className="mb-4 min-w-0 max-w-full overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5"
        >
      {/* <s-app-window id="app-window" src={src}></s-app-window> */}

      {/* <s-button
        ref={fullscreenButtonRef}
        command="--show"
        commandFor="app-window"
        className='hidden'
      />
      <s-button ref={closeFullscreenButtonRef} command="--hide" commandFor="app-window" className='hidden'></s-button> */}

      <IndexFilters
        tabs={tabs}
        hideFilters={true}
        selected={selectedTabIndex}
        onSelect={handleTabChange}
        queryValue={queryValue}
        queryPlaceholder="Search"
        onQueryChange={setQueryValue}
        onQueryClear={() => setQueryValue("")}
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        onSort={setSortSelected}
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
          disabled: isAuthenticating,
          loading: isAuthenticating,
        }}
      />

      <Box
        padding={sortedPages.length > 0 ? "0" : "600"}
        minHeight={sortedPages.length > 0 ? undefined : "300px"}
      >
        <BlockStack gap="300" align={sortedPages.length > 0 ? "stretch" : "center"}>
          {contextError ? (
            <Box>
              <Text as="p" variant="bodyMd" tone="critical">Error: {contextError}</Text>
            </Box>
          ) : sortedPages.length === 0 ? (
            <>
              <div
                style={{
                  marginBottom: "16px",
                  position: "relative",
                }}
              >
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="20"
                    y="30"
                    width="80"
                    height="90"
                    rx="4"
                    fill="#f3f4f6"
                    opacity="0.5"
                  />
                  <rect
                    x="15"
                    y="25"
                    width="80"
                    height="90"
                    rx="4"
                    fill="#f9fafb"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <rect
                    x="20"
                    y="30"
                    width="70"
                    height="20"
                    rx="2"
                    fill="#f97316"
                  />
                  <line
                    x1="20"
                    y1="60"
                    x2="90"
                    y2="60"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <line
                    x1="20"
                    y1="75"
                    x2="85"
                    y2="75"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <line
                    x1="20"
                    y1="90"
                    x2="80"
                    y2="90"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <line
                    x1="20"
                    y1="105"
                    x2="75"
                    y2="105"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <s-heading style={{ marginBottom: "12px", textAlign: "center" }}>
                No page found!
              </s-heading>
              <s-paragraph
                color="subdued"
                style={{
                  textAlign: "center",
                  maxWidth: "500px",
                  marginBottom: "20px",
                }}
              >
                Start building your page with our pre-made templates that save
                you tons of time & effort
              </s-paragraph>

              <Button
                variant="primary"
                disabled={isAuthenticating}
                onClick={() => {
                  if (onEmptyCreateClick) {
                    onEmptyCreateClick();
                    return;
                  }
                  const shop = searchParams.get("shop");
                  navigate(buildEmbeddedHref(hubBasePath || "/product-page", searchParams, shop));
                }}
              >
                {isAuthenticating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Spinner size="small" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  "Create a new page"
                )}
              </Button>
            </>
          ) : (
            <>
              <Box maxWidth="100%" minWidth={0} overflowX="hidden" className={PAGES_TABLE_INDEX_HOST_CLASS}>
              {pagesTableIndexHostStyles}
              <IndexTable
                resourceName={{ singular: "page", plural: "pages" }}
                itemCount={sortedPages.length}
                selectable={false}
                headings={pagesTableHeadings}
              >
                {paginatedPages.map((page, index) => {
                  const defaultEmptyImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3C/svg%3E";

                  const storeBannerUrl = getStoreListThumbnailUrl(page);
                  const productImage =
                    page.generation_type === "store" && storeBannerUrl
                      ? storeBannerUrl
                      : page.generation_data?.images?.product_images?.product_image_1 ||
                      page.generation_data?.images?.product_images?.product_image_2 ||
                      defaultEmptyImage;

                  const updatedDate = formatTimeAgo(page.updated_at);

                  const title = page.product_title || "Untitled Page";

                  const generationStatus = page.generation_status || "completed";

                  const getGenerationStatusTone = (status) => {
                    const statusLower = (status || "").toLowerCase();
                    if (statusLower === "completed" || statusLower === "done" || statusLower === "success") {
                      return "success";
                    } else if (statusLower === "pending" || statusLower === "queued" || statusLower === "waiting") {
                      return "info";
                    } else if (statusLower === "processing" || statusLower === "in_progress" || statusLower === "generating") {
                      return "attention";
                    } else if (statusLower === "failed" || statusLower === "error") {
                      return "critical";
                    }
                    return "info";
                  };

                  const formatGenerationStatus = (status) => {
                    if (!status) return "Completed";
                    return status
                      .split("_")
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(" ");
                  };

                  const isLinkLoading = loadingLinks[page.PK] || false;
                  const isPublished = !!page.published && !storePdpParentId(page);
                  const hasOriginalContent = !!(page.original_content || page.originalContent);
                  const enabledValue = isPublished
                    ? (typeof page?.is_enabled === "boolean"
                      ? page.is_enabled
                      : typeof page?.isEnabled === "boolean"
                        ? page.isEnabled
                        : true)
                    : false;
                  const isToggling = togglingEnabled[page.PK] || false;
                  const toggleDisabled =
                    !isPublished ||
                    isToggling ||
                    isAuthenticating ||
                    // If enabled but no original snapshot, disabling isn't supported
                    (isPublished && enabledValue === true && !hasOriginalContent);

                  return (
                    <IndexTable.Row
                      id={page.PK}
                      key={page.PK}
                      position={startIndex + index}
                    >
                      <IndexTable.Cell>
                        <div style={noWrapCellStyle}>
                          <InlineStack gap="200" blockAlign="center" wrap={false}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                overflow: "hidden",
                                flexShrink: 0,
                                background: "#f3f4f6",
                                border: "1px solid #e1e3e5",
                              }}
                            >
                              <img
                                src={productImage}
                                alt={title}
                                width={40}
                                height={40}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  objectPosition: "center center",
                                  display: "block",
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = defaultEmptyImage;
                                }}
                              />
                            </div>
                            <div style={titleCellContentStyle}>
                              <BlockStack gap="100">
                                {page.generation_type === "store" ? (
                                  <>
                                    <InlineStack gap="200" blockAlign="center" wrap={false}>
                                      <Text as="span" variant="bodyMd" fontWeight="semibold" truncate>
                                        Entire Store
                                      </Text>
                                      {page.is_free ? (
                                        <Badge tone="success">Free</Badge>
                                      ) : null}
                                    </InlineStack>
                                    <Text as="span" variant="bodySm" tone="subdued" truncate>
                                      {getStoreListSubtitle(page)}
                                    </Text>
                                  </>
                                ) :
                                  <>
                                    <InlineStack gap="200" blockAlign="center" wrap={false}>
                                      <Text as="span" variant="bodyMd" fontWeight="semibold" truncate>
                                        {title.length > 50 ? `${title.slice(0, 50)}…` : title}
                                      </Text>
                                      {page.is_free ? (
                                        <Badge tone="success">Free</Badge>
                                      ) : null}
                                    </InlineStack>
                                    {page.product_description ? (
                                      <Text as="span" variant="bodySm" tone="subdued" truncate>
                                        {page.product_description.length > 40
                                          ? `${page.product_description.slice(0, 40)}…`
                                          : page.product_description}
                                      </Text>
                                    ) : null}</>}

                              </BlockStack>
                            </div>
                          </InlineStack>
                        </div>
                      </IndexTable.Cell>
                      {showGenerationTypeColumn ? (
                        <IndexTable.Cell>
                          <div style={noWrapCellStyle}>
                            <Badge tone={page.generation_type === "store" ? "attention" : "info"}>
                              {getGenerationTypeLabel(page)}
                            </Badge>
                          </div>
                        </IndexTable.Cell>
                      ) : null}
                      <IndexTable.Cell>
                        <div style={noWrapCellStyle}>
                          <Badge tone={page.published ? "magic" : "attention"}>
                            {page.published ? "Pushed" : "Draft"}
                          </Badge>
                        </div>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <div style={noWrapCellStyle}>
                          <Badge tone={getGenerationStatusTone(generationStatus)}>
                            {formatGenerationStatus(generationStatus)}
                          </Badge>
                        </div>
                      </IndexTable.Cell>

                      <IndexTable.Cell>
                        <div style={noWrapCellStyle}>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {updatedDate}
                          </Text>
                        </div>
                      </IndexTable.Cell>
                      {showProductPageColumn ? (
                      <IndexTable.Cell>
                        <div
                          style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", whiteSpace: "nowrap", width: "100%", }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isPublished ? (
                            <Tooltip content="Publish page to choose what appears on your product page">
                              <InlineStack gap="200" blockAlign="center">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  —
                                </Text>
                                <span style={{ display: "inline-block" }}>
                                  <SwitchToggle
                                    checked={false}
                                    disabled={true}
                                    loading={false}
                                    ariaLabel="Product page (publish first)"
                                    onToggle={() => { }}
                                  />
                                </span>
                                <Text as="span" variant="bodySm" tone="subdued">
                                  —
                                </Text>
                              </InlineStack>
                            </Tooltip>
                          ) : (
                            <Tooltip
                              content={
                                enabledValue === true
                                  ? !hasOriginalContent
                                    ? "Not supported for this page"
                                    : "Revert product page to original"
                                  : "Apply Roarr version on product page"
                              }
                              disabled={!(enabledValue === true && !hasOriginalContent)}
                            >
                              <InlineStack gap="200" blockAlign="center" align="center">
                                <Text as="span" variant="bodySm" tone={!enabledValue ? "success" : "subdued"}>
                                  Original
                                </Text>
                                <span className="inline-block">
                                  <SwitchToggle
                                    checked={!!enabledValue}
                                    disabled={toggleDisabled}
                                    loading={isToggling}
                                    ariaLabel={enabledValue ? "Product page: Roarr (toggle to show Original)" : "Product page: Original (toggle to show Roarr)"}
                                    onToggle={(nextChecked, e) =>
                                      handleToggleEnabled(e, page, nextChecked)
                                    }
                                  />
                                </span>
                                <Text as="span" variant="bodySm" tone={enabledValue ? "success" : "subdued"}>
                                  Roarr
                                </Text>
                              </InlineStack>
                            </Tooltip>
                          )}
                        </div>
                      </IndexTable.Cell>
                      ) : null}
                      <IndexTable.Cell>
                        <div
                          style={{
                            ...noWrapCellStyle,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          <Popover
                            active={openActionsMenuId === page.PK}
                            preferredAlignment="right"
                            onClose={() => setOpenActionsMenuId(null)}
                            activator={
                              <Button
                                variant="plain"
                                icon={MenuHorizontalIcon}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionsMenuId((prev) => (prev === page.PK ? null : page.PK));
                                }}
                                accessibilityLabel="Open row actions"
                              />
                            }
                          >
                            <ActionList
                              items={[
                                {
                                  content: "Edit & Preview",
                                  icon: ExternalIcon,
                                  disabled: !page.published || isLinkLoading || isAuthenticating,
                                  onAction: () => {
                                    setOpenActionsMenuId(null);
                                    if (isAuthenticating || !page.published) return;
                                    handleOpenPreviewLink(undefined, page);
                                  },
                                },
                                {
                                  content: "Edit generation",
                                  icon: EditIcon,
                                  disabled: editLoadingId === page.PK || isAuthenticating,
                                  onAction: () => {
                                    setOpenActionsMenuId(null);
                                    if (isAuthenticating) return;
                                    handleNavigateToEdit(page);
                                  },
                                },
                              ]}
                            />
                          </Popover>
                        </div>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  );
                })}
                {sortedPages.length > itemsPerPage ? (
                  <IndexTable.Row
                    id="pagination-footer"
                    position={startIndex + paginatedPages.length}
                  >
                    <IndexTable.Cell colSpan={pagesTableColumnCount}>
                      <InlineStack align="space-between" blockAlign="center" gap="300" wrap>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Showing {startIndex + 1} to {Math.min(endIndex, sortedPages.length)} of{" "}
                          {sortedPages.length} {sortedPages.length === 1 ? "page" : "pages"}
                        </Text>
                        <Pagination
                          hasPrevious={currentPage > 1 && !isAuthenticating}
                          onPrevious={() => {
                            if (!isAuthenticating && currentPage > 1) {
                              handlePageChange(currentPage - 1);
                            }
                          }}
                          hasNext={currentPage < totalPages && !isAuthenticating}
                          onNext={() => {
                            if (!isAuthenticating && currentPage < totalPages) {
                              handlePageChange(currentPage + 1);
                            }
                          }}
                        />
                      </InlineStack>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                ) : null}
              </IndexTable>
              </Box>

              {/* Legacy "Load more" for server-side pagination (if needed) */}
              {pagination && pagination.has_more && (
                <Box paddingBlockStart="300">
                  <BlockStack gap="200" align="center">
                    <s-button
                      variant="secondary"
                      onClick={() => setOffset(offset + limit)}
                      disabled={isLoadingMore || isAuthenticating}
                    >
                      {isAuthenticating || isLoadingMore ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Spinner size="small" />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        "Load more"
                      )}
                    </s-button>
                  </BlockStack>
                </Box>
              )}
            </>
          )}
        </BlockStack>
      </Box>

      {/* Preview Modal */}
      <Modal
        open={isPreviewOpen}
        onClose={handleClosePreview}
        title={selectedPage?.product_title || "Page Preview"}
        primaryAction={
          !selectedPage?.published
            ? {
              content: isAuthenticating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Spinner size="small" />
                  <span>Loading...</span>
                </div>
              ) : "Edit & Publish",
              onAction: () => {
                if (isAuthenticating) return;
                handleClosePreview();
                const shop = searchParams.get("shop");
                const hub = hubForPage(selectedPage);
                const extra =
                  selectedPage?.generation_type === "store"
                    ? { pageId: selectedPage.PK, entireStore: 1 }
                    : { pageId: selectedPage.PK };
                navigate(buildEmbeddedHref(hub, searchParams, shop, extra));
              },
              disabled: isAuthenticating,
            }
            : undefined
        }
        secondaryActions={[
          {
            content: "Close",
            onAction: () => {
              if (isAuthenticating) return;
              handleClosePreview();
            },
            disabled: isAuthenticating,
          },
        ]}
        size="large"
      >
        <Modal.Section>
          <BlockStack gap="300">
            <BlockStack gap="200">
              <InlineStack gap="200" wrap>
                <Badge tone={selectedPage?.published ? "success" : "attention"}>
                  {selectedPage?.published ? "Pushed" : "Draft"}
                </Badge>
                {selectedPage?.category && (
                  <Badge tone="info">{selectedPage.category}</Badge>
                )}
              </InlineStack>
              {selectedPage?.updated_at && (
                <Text as="span" variant="bodySm" tone="subdued">
                  Last updated: {new Date(selectedPage.updated_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              )}
            </BlockStack>

            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" fontWeight="semibold">
                Product Details
              </Text>
              <Box
                background="bg-surface"
                borderWidth="025"
                borderColor="border"
                borderRadius="300"
                padding="400"
              >
                <BlockStack gap="300">
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
                      Title
                    </Text>
                    <Text as="p" variant="bodyMd">
                      {selectedPage?.product_title || "—"}
                    </Text>
                  </BlockStack>
                  {selectedPage?.product_description && (
                    <BlockStack gap="100">
                      <Text as="span" variant="bodySm" fontWeight="semibold" tone="subdued">
                        Description
                      </Text>
                      <Text as="p" variant="bodyMd">
                        {selectedPage.product_description}
                      </Text>
                    </BlockStack>
                  )}
                </BlockStack>
              </Box>
            </BlockStack>

            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" fontWeight="semibold">
                Product Images
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "12px",
                }}
              >
                {selectedPage?.generation_data?.images?.product_images ? (
                  Object.values(
                    selectedPage.generation_data.images.product_images
                  )
                    .slice(0, 5)
                    .map((imageUrl, idx) => (
                      <img
                        key={idx}
                        src={imageUrl}
                        alt={`Product ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "150px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #e1e3e5",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ))
                ) : (
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23f3f4f6'/%3E%3C/svg%3E"
                    alt="No product images"
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #e1e3e5",
                    }}
                  />
                )}
              </div>
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>
        </Box>
      </Frame>
    </PagesTableFrameHost>
  );
}
