import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  IndexFilters,
  IndexTable,
  InlineStack,
  Pagination,
  SkeletonBodyText,
  SkeletonThumbnail,
  Text,
  Thumbnail,
  Tooltip,
  useSetIndexFiltersMode,
} from "@shopify/polaris";
import { EditIcon } from "@shopify/polaris-icons";

const itemsPerPage = 5;
const noWrapCellStyle = { whiteSpace: "nowrap" };
/** Avoid fixed minWidth so the table does not overflow the hub and draw a stray vertical edge. */
const titleCellContentStyle = {
  minWidth: 0,
  maxWidth: "min(220px, 55vw)",
  overflow: "hidden",
};

const defaultEmptyImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3C/svg%3E";

function formatTimeAgo(dateString) {
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
}

function generationBadgeProps(status) {
  const normalized = String(status || "completed").toLowerCase();
  if (["queued", "pending", "processing", "generating", "in_progress"].includes(normalized)) {
    return { tone: "attention", label: "Generating" };
  }
  if (["failed", "error"].includes(normalized)) {
    return { tone: "critical", label: "Failed" };
  }
  return { tone: "success", label: "Completed" };
}

/** Search + sort bar only (no Pushed / Draft). */
const INDEX_TABS = [{ id: "all", content: "All" }];

/**
 * @param {{
 *   onEdit?: (campaignId: string) => void;
 *   onListResolved?: (info: { count: number; error: boolean }) => void;
 * }} props
 */
export default function BrandAdsCampaignsTable({ onEdit, onListResolved }) {
  const { isAuthenticating } = useOutletContext() || {};
  const { mode, setMode } = useSetIndexFiltersMode();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [queryValue, setQueryValue] = useState("");
  const [sortSelected, setSortSelected] = useState(["updated_at desc"]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editLoadingId, setEditLoadingId] = useState(null);

  const sortOptions = [
    { label: "Updated", value: "updated_at asc", directionLabel: "Ascending" },
    { label: "Updated", value: "updated_at desc", directionLabel: "Descending" },
    { label: "Created", value: "created_at asc", directionLabel: "Ascending" },
    { label: "Created", value: "created_at desc", directionLabel: "Descending" },
    { label: "Title", value: "title asc", directionLabel: "A-Z" },
    { label: "Title", value: "title desc", directionLabel: "Z-A" },
  ];

  const fetchCampaigns = useCallback(async () => {
    setError("");
    setLoading(true);
    let count = 0;
    let hadError = false;
    try {
      const res = await fetch("/api/brand-dna-campaigns", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || "Failed to load campaigns");
      }
      const list = json?.data?.campaigns;
      const nextRows = Array.isArray(list) ? list : [];
      count = nextRows.length;
      setRows(nextRows);
    } catch (e) {
      hadError = true;
      setError(e?.message || "Failed to load campaigns");
      setRows([]);
      count = 0;
    } finally {
      setLoading(false);
      onListResolved?.({ count, error: hadError });
    }
  }, [onListResolved]);

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    setCurrentPage(1);
  }, [queryValue, sortSelected]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const q = queryValue.trim().toLowerCase();
      if (!q) return true;
      const idea = (row.idea_title || "").toLowerCase();
      const product = (row.product_title || "").toLowerCase();
      const brand = (row.brand_name || "").toLowerCase();
      return idea.includes(q) || product.includes(q) || brand.includes(q);
    });
  }, [rows, queryValue]);

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    const selected = sortSelected?.[0] || "updated_at desc";
    const [field, direction] = selected.split(" ");
    const dir = direction === "asc" ? 1 : -1;

    const getTime = (v) => (v ? new Date(v).getTime() : 0);
    const getTitle = (r) => (r.idea_title || "").toLowerCase();

    list.sort((a, b) => {
      if (field === "updated_at")
        return (getTime(a.updated_at) - getTime(b.updated_at)) * dir;
      if (field === "created_at")
        return (getTime(a.created_at) - getTime(b.created_at)) * dir;
      if (field === "title") return getTitle(a).localeCompare(getTitle(b)) * dir;
      return 0;
    });
    return list;
  }, [filteredRows, sortSelected]);

  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleEditClick = async (e, row) => {
    e.stopPropagation();
    if (isAuthenticating || !row?.campaign_id) return;
    setEditLoadingId(row.campaign_id);
    try {
      await onEdit?.(String(row.campaign_id));
    } finally {
      setEditLoadingId(null);
    }
  };

  const tableHeadings = [
    { id: "title", title: "Title" },
    { id: "ai-generation", title: "AI Generation" },
    { id: "last-updated", title: "Last Updated" },
    {
      id: "action",
      title: <div style={{ display: "block", textAlign: "center" }}>Action</div>,
    },
  ];

  if (loading) {
    return (
      <Card roundedAbove="sm" padding="0">
        <Box background="bg-surface" className="max-w-full min-w-0 overflow-hidden">
          <Box>
          <div style={{ borderBottom: "1px solid #e1e3e5" }}>
            <Box paddingInline="300" paddingBlock="400">
              <BlockStack gap="200">
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

          <Box>
          <IndexTable
            resourceName={{ singular: "campaign", plural: "campaigns" }}
            itemCount={5}
            selectable={false}
            headings={tableHeadings}
          >
            {Array.from({ length: 5 }).map((_, index) => (
              <IndexTable.Row id={`camp-sk-${index}`} key={`camp-sk-${index}`} position={index}>
                <IndexTable.Cell>
                  <InlineStack gap="200" blockAlign="center">
                    <SkeletonThumbnail size="small" />
                    <BlockStack gap="100">
                      <SkeletonBodyText lines={1} />
                      <SkeletonBodyText lines={1} />
                    </BlockStack>
                  </InlineStack>
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
          </IndexTable>
          </Box>

          <Box>
          <div style={{ borderTop: "1px solid #e1e3e5" }}>
            <Box paddingInline="400" paddingBlock="400">
              <InlineStack align="space-between" blockAlign="center">
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
            </Box>
          </div>
          </Box>
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card roundedAbove="sm" padding="0">
        <Box background="bg-surface" padding="400" className="max-w-full min-w-0">
          <Text as="p" variant="bodyMd" tone="critical">
            {error}
          </Text>
          <Box paddingBlockStart="300">
            <Button onClick={() => void fetchCampaigns()}>Retry</Button>
          </Box>
        </Box>
      </Card>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <Box className="max-w-full min-w-0 mb-4">
      <Card roundedAbove="sm" padding="0">
        <Box background="bg-surface" className="max-w-full min-w-0 overflow-hidden">
        <IndexFilters
          tabs={INDEX_TABS}
          hideFilters={true}
          selected={0}
          onSelect={() => {}}
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

        <Box padding="0">
          <BlockStack gap="300" align="stretch">
            {sortedRows.length === 0 ? (
              <Box paddingBlock="600" paddingInline="400">
                <Text as="p" variant="bodyMd" tone="subdued" alignment="center">
                  No campaigns match your search.
                </Text>
              </Box>
            ) : (
              <>
                <Box maxWidth="100%" overflowX="hidden" className="roarr-brandads-table-host">
                  <style>{`
                    /* BrandAds is client-side paginated; prevent internal scrolling/scrollbars. */
                    .roarr-brandads-table-host {
                      overflow: hidden !important;
                      max-height: none !important;
                    }
                    .roarr-brandads-table-host .Polaris-IndexTable__Table {
                      overflow: hidden !important;
                      max-height: none !important;
                    }
                    .roarr-brandads-table-host .Polaris-IndexTable__Table--sticky {
                      overflow: hidden !important;
                    }
                    .roarr-brandads-table-host .Polaris-IndexTable__StickyTableHeader {
                      position: static !important;
                      top: auto !important;
                      inset-block-start: auto !important;
                      z-index: auto !important;
                    }
                  `}</style>
                  <IndexTable
                    resourceName={{ singular: "campaign", plural: "campaigns" }}
                    itemCount={sortedRows.length}
                    selectable={false}
                    headings={tableHeadings}
                  >
                    {paginatedRows.map((row, index) => {
                      const thumb =
                        typeof row.image_url === "string" && row.image_url.trim()
                          ? row.image_url.trim()
                          : defaultEmptyImage;
                      const title = row.idea_title || "Untitled campaign";
                      const subtitle = row.product_title || row.brand_name || "";
                      const updatedDate = formatTimeAgo(row.updated_at || row.created_at);
                      const cid = String(row.campaign_id);
                      const generationBadge = generationBadgeProps(row.generation_status);

                      return (
                        <IndexTable.Row id={cid} key={cid} position={startIndex + index}>
                          <IndexTable.Cell>
                            <div style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
                              <InlineStack gap="200" blockAlign="center" wrap={false}>
                                <Thumbnail source={thumb} alt={title} size="small" />
                                <div style={titleCellContentStyle}>
                                  <BlockStack gap="100">
                                    <InlineStack gap="200" blockAlign="center" wrap={false}>
                                      <Text as="span" variant="bodyMd" fontWeight="semibold" truncate>
                                        {title.length > 50 ? `${title.slice(0, 50)}…` : title}
                                      </Text>
                                    </InlineStack>
                                    {subtitle ? (
                                      <Text as="span" variant="bodySm" tone="subdued" truncate>
                                        {subtitle.length > 40 ? `${subtitle.slice(0, 40)}…` : subtitle}
                                      </Text>
                                    ) : null}
                                  </BlockStack>
                                </div>
                              </InlineStack>
                            </div>
                          </IndexTable.Cell>
                          <IndexTable.Cell>
                            <div style={noWrapCellStyle}>
                              <Badge tone={generationBadge.tone}>
                                {generationBadge.label}
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
                          <IndexTable.Cell>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: "100%",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Tooltip content="Edit">
                                <Button
                                  variant="plain"
                                  icon={EditIcon}
                                  onClick={(e) => void handleEditClick(e, row)}
                                  loading={editLoadingId === row.campaign_id || isAuthenticating}
                                  disabled={editLoadingId === row.campaign_id || isAuthenticating}
                                  accessibilityLabel="Edit campaign"
                                />
                              </Tooltip>
                            </div>
                          </IndexTable.Cell>
                        </IndexTable.Row>
                      );
                    })}
                    {sortedRows.length > itemsPerPage ? (
                      <IndexTable.Row
                        id="pagination-footer"
                        position={startIndex + paginatedRows.length}
                      >
                        <IndexTable.Cell colSpan={tableHeadings.length}>
                          <InlineStack align="space-between" blockAlign="center" gap="300" wrap>
                            <Text as="p" variant="bodySm" tone="subdued">
                              Showing {startIndex + 1} to {Math.min(endIndex, sortedRows.length)} of{" "}
                              {sortedRows.length}{" "}
                              {sortedRows.length === 1 ? "campaign" : "campaigns"}
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

              </>
            )}
          </BlockStack>
        </Box>
        </Box>
      </Card>
    </Box>
  );
}
