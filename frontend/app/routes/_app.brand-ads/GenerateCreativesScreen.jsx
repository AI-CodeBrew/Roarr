import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Icon,
  InlineStack,
  LegacyCard,
  Modal,
  Page,
  Spinner,
  Text,
  TextField,
} from "@shopify/polaris";
import { EditIcon } from "@shopify/polaris-icons";
import { CreditConfirmationModal } from "../../components/CreditConfirmationModal";
import { useCredits } from "../../lib/CreditsContext";
import { hasEnoughCredits, resolveFeatureCost, shopSkipsCreditGates } from "../../lib/credits";
import { buildProductsPayload, listProductImageUrls } from "./dnaHelpers.js";
import { CreditWalletWidget } from "../../components/CreditWalletWidget";
import { useViewportBelowMd } from "../../hooks/useViewportBelowMd.js";
import { usePages } from "../../lib/PagesContext.jsx";

const ASPECT = "9:16";

function isHttpUrl(url) {
  if (!url) return false;
  return /^https?:\/\//i.test(String(url));
}

/** Normalize API envelope — Python and proxies may nest differently. */
function extractCreativesList(json) {
  if (!json || typeof json !== "object") return [];
  const wrapped = json.data !== undefined ? json.data : json;
  const raw =
    wrapped?.creatives ??
    wrapped?.Creatives ??
    (Array.isArray(wrapped) ? wrapped : null);
  return Array.isArray(raw) ? raw : [];
}

function extractCampaignId(json) {
  if (!json || typeof json !== "object") return null;
  const wrapped = json.data !== undefined ? json.data : json;
  const cid = wrapped?.campaign_id ?? wrapped?.campaignId ?? null;
  if (cid == null || cid === "") return null;
  return String(cid);
}

function isCampaignInFlight(status) {
  const s = String(status || "").toLowerCase();
  return ["queued", "pending", "processing", "generating", "in_progress"].includes(s);
}

/** Read raster payload from one creative (snake_case + camelCase). */
function parseCreativeImagePayload(c) {
  if (!c || typeof c !== "object") return { b64: null, mime: "image/png", url: null };
  const directUrl = c.image_url ?? c.imageUrl ?? c.url ?? null;
  if (typeof directUrl === "string" && directUrl.trim()) {
    return { b64: null, mime: "image/png", url: directUrl.trim() };
  }
  const raw =
    c.image_b64 ??
    c.imageB64 ??
    c.image_base64 ??
    c.imageBase64 ??
    null;
  if (raw == null || raw === "") return { b64: null, mime: "image/png" };
  let mime = String(
    c.image_mime_type ?? c.imageMimeType ?? "image/png",
  )
    .split(";")[0]
    .trim();
  if (!mime.startsWith("image/")) mime = "image/png";
  const clean = String(raw).replace(/\s/g, "");
  return { b64: clean.length ? clean : null, mime, url: null };
}

/** Build display URLs (Blob preferred — avoids huge data: URLs and CSP edge cases). */
function useCreativeDisplayUrls(creatives) {
  const displayUrls = useMemo(() => {
    const list = Array.isArray(creatives) ? creatives : [];
    return list.map((c) => {
      const { b64, mime, url } = parseCreativeImagePayload(c);
      if (url) return url;
      if (!b64) return null;
      try {
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return URL.createObjectURL(new Blob([bytes], { type: mime }));
      } catch {
        try {
          return `data:${mime};base64,${b64}`;
        } catch {
          return null;
        }
      }
    });
  }, [creatives]);

  useEffect(() => {
    const urls = displayUrls;
    return () => {
      urls.forEach((u) => {
        if (u && typeof u === "string" && u.startsWith("blob:")) {
          URL.revokeObjectURL(u);
        }
      });
    };
  }, [displayUrls]);

  return displayUrls;
}

export default function GenerateCreativesScreen({ session, onBack, onRestart }) {
  const isMobileLayout = useViewportBelowMd();
  const { refresh: refreshCredits } = useCredits();
  const { storeDetails } = usePages() || {};
  const [, setSearchParams] = useSearchParams();
  const [creatives, setCreatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generationPercentage, setGenerationPercentage] = useState(0);
  const [regenerateIndex, setRegenerateIndex] = useState(null);
  const [regeneratePrompt, setRegeneratePrompt] = useState("");
  const [regenerateSubmitting, setRegenerateSubmitting] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");
  const [regeneratePreviewUrl, setRegeneratePreviewUrl] = useState(null);
  const [applyCreativeSubmitting, setApplyCreativeSubmitting] = useState(false);
  const [regenerateSaveError, setRegenerateSaveError] = useState("");
  const [selectedReferenceIndex, setSelectedReferenceIndex] = useState(0);
  const [regenSlideIndex, setRegenSlideIndex] = useState(0);
  const [thumbnailsPerPage, setThumbnailsPerPage] = useState(6);
  const [addingToProduct, setAddingToProduct] = useState(false);
  const [addToProductMessage, setAddToProductMessage] = useState("");
  const [addToProductError, setAddToProductError] = useState("");
  const [regenCreditConfirmOpen, setRegenCreditConfirmOpen] = useState(false);
  const fetchStartedRef = useRef(false);

  const brandDna = session?.brandDna;
  const product = session?.campaignAnchorProduct;
  const idea = session?.selectedCampaignIdea;

  const hasSavedCreatives =
    Array.isArray(session?.initialCreatives) && session.initialCreatives.length > 0;

  const [generatedCampaignId, setGeneratedCampaignId] = useState(null);

  const sessionOk = useMemo(() => {
    if (!product || !idea || typeof idea !== "object") return false;
    if (hasSavedCreatives) return true;
    return Boolean(brandDna && typeof brandDna === "object");
  }, [brandDna, product, idea, hasSavedCreatives]);

  const campaignIdForPersistence =
    (session?.savedCampaignId && String(session.savedCampaignId)) ||
    generatedCampaignId;

  const persistCampaignIdInUrl = useCallback(
    (campaignId) => {
      if (!campaignId) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("campaignId", String(campaignId));
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  const productPayload = useMemo(() => {
    if (!product) return null;
    const list = buildProductsPayload([product]);
    return list[0] || null;
  }, [product]);

  const ideaPayload = useMemo(() => {
    if (!idea) return null;
    return {
      title: idea.title ?? "",
      description: idea.description ?? "",
      strategy: idea.strategy ?? "",
    };
  }, [idea]);

  const fetchCampaignById = useCallback(async (campaignId) => {
    const res = await fetch(
      `/api/brand-dna-campaigns?campaignId=${encodeURIComponent(campaignId)}`,
      { credentials: "include" },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      throw new Error(json?.error || "Failed to load campaign status");
    }
    return json?.data ?? null;
  }, []);

  const pollCampaignGenerationStatus = useCallback(
    async (campaignId) => {
      if (!campaignId) return;
      persistCampaignIdInUrl(campaignId);
      setGeneratedCampaignId(String(campaignId));
      setLoading(true);
      setError("");

      const startedAt = Date.now();
      const maxWaitMs = 10 * 60 * 1000;
      const pollIntervalMs = 5000;

      while (Date.now() - startedAt <= maxWaitMs) {
        const campaign = await fetchCampaignById(campaignId);
        const status = String(campaign?.generation_status || "").toLowerCase();
        const pct = Number(campaign?.generation_percentage);
        if (Number.isFinite(pct)) {
          setGenerationPercentage(Math.min(100, Math.max(0, pct)));
        }

        if (
          status === "completed" ||
          status === "done" ||
          status === "success" ||
          (Array.isArray(campaign?.creatives) &&
            campaign.creatives.length > 0 &&
            !isCampaignInFlight(status))
        ) {
          setCreatives(Array.isArray(campaign?.creatives) ? campaign.creatives.slice(0, 3) : []);
          setGenerationPercentage(100);
          setLoading(false);
          return;
        }

        if (status === "failed" || status === "error") {
          throw new Error(campaign?.generation_error || "Generation failed");
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }

      throw new Error("Generation timed out. Please try again.");
    },
    [fetchCampaignById, persistCampaignIdInUrl],
  );

  const fetchCreatives = useCallback(async () => {
    if (hasSavedCreatives) {
      return;
    }
    if (campaignIdForPersistence) {
      try {
        await pollCampaignGenerationStatus(campaignIdForPersistence);
      } catch (e) {
        setError(e?.message || "Generation failed");
        setCreatives([]);
        setLoading(false);
      }
      return;
    }
    if (!sessionOk || !productPayload || !ideaPayload) {
      setLoading(false);
      setError(
        "Missing Brand DNA, product, or campaign idea. Go back and complete the previous steps.",
      );
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/brand-dna-generate-creatives", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dna: brandDna,
          product: productPayload,
          idea: ideaPayload,
          count: 3,
          aspect_ratio: ASPECT,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json?.success === false) {
        throw new Error(json?.error || "Failed to generate creatives");
      }
      const cid = extractCampaignId(json);
      if (cid) {
        setGeneratedCampaignId(cid);
        persistCampaignIdInUrl(cid);
      }
      if (response.status === 202 && cid) {
        await pollCampaignGenerationStatus(cid);
        return;
      }
      const list = extractCreativesList(json);
      setCreatives(list.slice(0, 3));
      setGenerationPercentage(100);
    } catch (e) {
      setError(e?.message || "Failed to generate creatives");
      setCreatives([]);
    } finally {
      setLoading(false);
    }
  }, [
    hasSavedCreatives,
    campaignIdForPersistence,
    pollCampaignGenerationStatus,
    sessionOk,
    productPayload,
    ideaPayload,
    brandDna,
    persistCampaignIdInUrl,
  ]);

  useEffect(() => {
    if (hasSavedCreatives && Array.isArray(session?.initialCreatives)) {
      setCreatives(session.initialCreatives.slice(0, 3));
      setLoading(false);
      setGenerationPercentage(100);
      setError("");
      if (session?.savedCampaignId) persistCampaignIdInUrl(session.savedCampaignId);
      return undefined;
    }
    if (!sessionOk) {
      setLoading(false);
      return undefined;
    }
    if (fetchStartedRef.current) return undefined;
    fetchStartedRef.current = true;
    fetchCreatives();
    return undefined;
  }, [
    hasSavedCreatives,
    session?.initialCreatives,
    session?.savedCampaignId,
    sessionOk,
    fetchCreatives,
    persistCampaignIdInUrl,
  ]);

  const closeRegenerateModal = () => {
    setRegenCreditConfirmOpen(false);
    setRegenerateIndex(null);
    setRegeneratePrompt("");
    setRegenerateError("");
    setRegenerateSaveError("");
    setRegeneratePreviewUrl(null);
    setSelectedReferenceIndex(0);
    setRegenSlideIndex(0);
  };

  const handleApplyRegeneratedImage = async () => {
    if (regenerateIndex === null || regenerateIndex < 0 || !regeneratePreviewUrl) return;
    const idx = regenerateIndex;
    const url = regeneratePreviewUrl;

    const updatedCreatives = creatives.map((c, i) =>
      i === idx
        ? {
            ...c,
            image_url: url,
            image_b64: null,
            image_mime_type: "image/png",
            image_prompt: "",
            image_error: null,
          }
        : c,
    );

    const cid = campaignIdForPersistence;
    if (cid) {
      setApplyCreativeSubmitting(true);
      setRegenerateError("");
      setRegenerateSaveError("");
      try {
        const res = await fetch("/api/brand-dna-update-campaign-creatives", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaign_id: cid,
            creatives: updatedCreatives,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || j?.success === false) {
          throw new Error(j?.error || "Could not save to your campaigns");
        }
      } catch (e) {
        setRegenerateSaveError(e?.message || "Could not save to your campaigns");
        setApplyCreativeSubmitting(false);
        return;
      }
      setApplyCreativeSubmitting(false);
    }

    setCreatives(updatedCreatives);
    closeRegenerateModal();
  };

  const creativeImageUrls = useCreativeDisplayUrls(creatives);
  const publicCreativeUrls = useMemo(
    () =>
      creatives
        .map((creative) => parseCreativeImagePayload(creative).url)
        .filter((url) => typeof url === "string" && /^https?:\/\//.test(url)),
    [creatives],
  );
  const selectedRegenerateImageUrl =
    regenerateIndex !== null
      ? creativeImageUrls[regenerateIndex] ||
        parseCreativeImagePayload(creatives[regenerateIndex]).url
      : null;

  const brandAdRegenBaseImageUrls = useMemo(() => {
    if (regenerateIndex === null) return [];
    const creative = creatives[regenerateIndex];
    const { url: creativeHttp } = parseCreativeImagePayload(creative);
    const displayUrl = creativeImageUrls[regenerateIndex];
    const list = [];
    if (creativeHttp && isHttpUrl(creativeHttp)) list.push(String(creativeHttp).trim());
    else if (displayUrl && isHttpUrl(displayUrl)) list.push(String(displayUrl).trim());
    const refs = listProductImageUrls(product);
    refs.forEach((u) => {
      const s = String(u).trim();
      if (isHttpUrl(s) && !list.includes(s)) list.push(s);
    });
    return list;
  }, [regenerateIndex, creatives, creativeImageUrls, product]);

  const selectedBaseImageUrl = useMemo(() => {
    if (brandAdRegenBaseImageUrls.length === 0) return null;
    const idx = Math.min(
      Math.max(0, selectedReferenceIndex),
      brandAdRegenBaseImageUrls.length - 1,
    );
    return brandAdRegenBaseImageUrls[idx];
  }, [brandAdRegenBaseImageUrls, selectedReferenceIndex]);

  const regenTotalSlides = Math.max(
    1,
    Math.ceil(brandAdRegenBaseImageUrls.length / thumbnailsPerPage),
  );

  useEffect(() => {
    function updateThumbnailsPerPage() {
      if (typeof window === "undefined") return;
      setThumbnailsPerPage(window.innerWidth < 640 ? 4 : 6);
    }
    updateThumbnailsPerPage();
    if (typeof window === "undefined") return undefined;
    window.addEventListener("resize", updateThumbnailsPerPage);
    return () => window.removeEventListener("resize", updateThumbnailsPerPage);
  }, []);

  useEffect(() => {
    setRegenSlideIndex((prev) => Math.min(prev, regenTotalSlides - 1));
  }, [regenTotalSlides]);

  useEffect(() => {
    if (regenerateIndex !== null) {
      setSelectedReferenceIndex(0);
      setRegenSlideIndex(0);
      setRegenerateSaveError("");
    }
  }, [regenerateIndex]);

  useEffect(() => {
    if (
      regenerateIndex !== null &&
      brandAdRegenBaseImageUrls.length > 0 &&
      selectedReferenceIndex >= brandAdRegenBaseImageUrls.length
    ) {
      setSelectedReferenceIndex(brandAdRegenBaseImageUrls.length - 1);
    }
  }, [regenerateIndex, brandAdRegenBaseImageUrls.length, selectedReferenceIndex]);

  const handleRegenerate = useCallback(async () => {
    if (regenerateIndex === null || regenerateIndex < 0) return;
    const creative = creatives[regenerateIndex];
    const prompt = regeneratePrompt.trim();
    if (!creative || !prompt) return;

    const urls = brandAdRegenBaseImageUrls;
    const idx = Math.min(
      Math.max(0, selectedReferenceIndex),
      Math.max(0, urls.length - 1),
    );
    const sourceImageUrl = urls.length > 0 ? urls[idx] : null;
    if (!sourceImageUrl || !isHttpUrl(sourceImageUrl)) return;

    setRegeneratePreviewUrl(null);
    setRegenerateSubmitting(true);
    setRegenerateError("");
    setRegenerateSaveError("");
    try {
      const response = await fetch("/api/brand-dna-regenerate-creative", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: sourceImageUrl,
          prompt,
          image_key: `brand_ads_creative_${regenerateIndex + 1}`,
          aspect_ratio: ASPECT,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.success) {
        throw new Error(json?.error || "Regeneration failed");
      }
      const payload = json?.data ?? json ?? {};
      const newImageUrl =
        payload.image_url ?? payload.imageUrl ?? payload.url ?? null;
      if (!newImageUrl) {
        throw new Error("No image returned");
      }
      setRegeneratePreviewUrl(newImageUrl);
      setRegeneratePrompt("");
      void refreshCredits();
    } catch (e) {
      setRegenerateError(e?.message || "Regeneration failed");
    } finally {
      setRegenerateSubmitting(false);
    }
  }, [
    regenerateIndex,
    creatives,
    regeneratePrompt,
    brandAdRegenBaseImageUrls,
    selectedReferenceIndex,
    refreshCredits,
  ]);

  const requestBrandAdImageRegenerateCredit = useCallback(async () => {
    const wallet = await refreshCredits();
    const cost = resolveFeatureCost(
      "image_regenerate",
      wallet.featureCosts ?? undefined,
    );
    if (
      shopSkipsCreditGates(storeDetails) ||
      (wallet.ok && hasEnoughCredits(wallet.balance, cost))
    ) {
      void handleRegenerate();
      return;
    }
    setRegenCreditConfirmOpen(true);
  }, [refreshCredits, handleRegenerate, storeDetails]);

  const canRegenBase = Boolean(selectedBaseImageUrl && isHttpUrl(selectedBaseImageUrl));

  const handleDownload = async (src, index) => {
    if (!src) return;
    const filename = `brand-ad-creative-${index + 1}.png`;

    const saveBlob = (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    try {
      // Blob / data URLs: read locally (no CORS).
      if (
        typeof src === "string" &&
        (src.startsWith("blob:") || src.startsWith("data:"))
      ) {
        const response = await fetch(src);
        if (!response.ok) throw new Error("Could not read image");
        saveBlob(await response.blob());
        return;
      }

      // Public S3 (etc.): fetch from our app so the response is same-origin and
      // triggers a real file download with Content-Disposition: attachment.
      if (typeof src === "string" && /^https?:\/\//i.test(src)) {
        const response = await fetch("/api/brand-dna-download-creative", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/octet-stream,*/*",
          },
          body: JSON.stringify({ url: src, filename }),
        });
        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          let message = errText || `Download failed (${response.status})`;
          try {
            const j = JSON.parse(errText);
            if (j?.error) message = j.error;
          } catch {
            /* plain text body */
          }
          throw new Error(message);
        }
        saveBlob(await response.blob());
        return;
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCreativesToProduct = async () => {
    if (!product?.id || publicCreativeUrls.length === 0) return;
    setAddingToProduct(true);
    setAddToProductMessage("");
    setAddToProductError("");
    try {
      const response = await fetch("/api/brand-dna-add-creatives-to-product", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          imageUrls: publicCreativeUrls,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.success) {
        throw new Error(json?.error || "Failed to add creatives to product");
      }
      setAddToProductMessage(
        `${publicCreativeUrls.length} creative${publicCreativeUrls.length === 1 ? "" : "s"} added to product media.`,
      );
    } catch (e) {
      setAddToProductError(e?.message || "Failed to add creatives to product");
    } finally {
      setAddingToProduct(false);
    }
  };

  return (
    <s-page heading="Brand ads" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      <style>
        {`
          .creative-card-wrap { position: relative; border-radius: 12px; overflow: hidden; background: #f3f4f6; }
          .creative-card-wrap:focus-within .creative-edit-overlay,
          .creative-card-wrap:hover .creative-edit-overlay {
            opacity: 1;
          }
          .creative-edit-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            background: rgba(0, 0, 0, 0.38);
            opacity: 0;
            transition: opacity 160ms ease;
            pointer-events: none;
          }
          @media (hover: none), (pointer: coarse) {
            .creative-edit-overlay {
              opacity: 1;
              background: linear-gradient(to top, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.05));
              align-items: flex-end;
              justify-content: center;
              padding: 12px;
            }
          }
          .creative-edit-overlay button {
            pointer-events: auto;
          }
          .creative-skeleton {
            aspect-ratio: 9 / 16;
            width: 100%;
            border-radius: 12px;
            background: linear-gradient(90deg, #ececec 25%, #f5f5f5 50%, #ececec 75%);
            background-size: 200% 100%;
            animation: creative-shimmer 1.2s ease-in-out infinite;
          }
          @keyframes creative-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
      <Box className="bg-[#f2f2f2] overflow-x-hidden overflow-y-auto">
        <div
          style={{
            maxWidth: "1150px",
            margin: "0 auto",
            width: "100%",
            paddingInline: "clamp(12px, 4vw, 16px)",
            boxSizing: "border-box",
          }}
        >
          <Page
          fullWidth
            backAction={{ content: "Campaign ideas", onAction: onBack }}
            title="Your creatives"
            subtitle="Step 3 of 3"
          >
            <BlockStack gap="400">
              {!sessionOk && !hasSavedCreatives ? (
                <Banner tone="critical" title="Session incomplete">
                  Return to Campaign ideas and ensure Brand DNA, a product, and a selected idea are
                  present.
                </Banner>
              ) : null}

              {error ? (
                <Banner tone="critical" title="Generation failed">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm">
                      {error}
                    </Text>
                    <Button
                      onClick={() => fetchCreatives()}
                      disabled={hasSavedCreatives}
                    >
                      Try again
                    </Button>
                  </BlockStack>
                </Banner>
              ) : null}

              <LegacyCard sectioned>
                <BlockStack gap="400">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Three ad visuals tailored to your campaign. Hover an image to download or
                    regenerate it.
                  </Text>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobileLayout
                        ? "1fr"
                        : "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: "12px",
                      alignItems: "stretch",
                    }}
                  >
                    {(loading ? [0, 1, 2] : creatives).map((item, index) => {
                      if (loading) {
                        return (
                          <div key={`sk-${index}`} className="creative-skeleton" aria-hidden />
                        );
                      }
                      const src = creativeImageUrls[index];
                      const { b64, url } = parseCreativeImagePayload(item);
                      const failed =
                        Boolean(item.image_error) || (!src && !b64);
                      return (
                        <div key={`creative-${index}`} className="creative-card-wrap">
                          {failed ? (
                            <Box padding="400" minHeight="280px">
                              <Text as="p" variant="bodySm" tone="subdued">
                                {item.image_error || "Image unavailable"}
                              </Text>
                            </Box>
                          ) : (
                            <img
                              src={src}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              style={{
                                width: "100%",
                                height: "auto",
                                display: "block",
                              }}
                            />
                          )}
                          <div className="creative-edit-overlay">
                            <button
                              type="button"
                              aria-label="Regenerate image"
                              onClick={() => {
                                setRegenerateIndex(index);
                                setRegeneratePrompt("");
                                setRegenerateError("");
                                setRegenerateSaveError("");
                                setRegeneratePreviewUrl(null);
                              }}
                              style={{
                                border: "none",
                                borderRadius: "999px",
                                width: "44px",
                                height: "44px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.95)",
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                              }}
                            >
                              <Icon source={EditIcon} tone="base" />
                            </button>
                            <button
                              type="button"
                              aria-label="Download image"
                              onClick={() => handleDownload(url || src, index)}
                              style={{
                                border: "none",
                                borderRadius: "999px",
                                minHeight: "44px",
                                padding: "0 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.95)",
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {loading ? (
                    <InlineStack gap="200" blockAlign="center">
                      <Spinner size="small" accessibilityLabel="Generating creatives" />
                      <Text as="p" variant="bodySm" tone="subdued">
                        Generating your three visuals
                        {generationPercentage > 0 && generationPercentage < 100
                          ? ` (${generationPercentage}%)`
                          : ""}
                        …
                      </Text>
                    </InlineStack>
                  ) : null}

                  {!loading && !error && sessionOk && creatives.length === 0 ? (
                    <Banner tone="warning" title="No images returned">
                      Try again, or go back and confirm your campaign setup.
                    </Banner>
                  ) : null}

                  {addToProductError ? (
                    <Banner tone="critical" title="Could not add creatives to product">
                      {addToProductError}
                    </Banner>
                  ) : null}

                  {addToProductMessage ? (
                    <Banner tone="success">{addToProductMessage}</Banner>
                  ) : null}

                  <InlineStack align={isMobileLayout ? "start" : "end"}>
                    <Button
                      variant="primary"
                      onClick={handleAddCreativesToProduct}
                      loading={addingToProduct}
                      disabled={
                        loading ||
                        addingToProduct ||
                        !product?.id ||
                        publicCreativeUrls.length === 0
                      }
                      fullWidth={isMobileLayout}
                    >
                      Add creatives to product
                    </Button>
                  </InlineStack>
                </BlockStack>
              </LegacyCard>

            </BlockStack>
          </Page>
        </div>
      </Box>

      <Modal
        open={regenerateIndex !== null}
        size="large"
        onClose={() => {
          if (
            regenerateSubmitting ||
            applyCreativeSubmitting ||
            regenCreditConfirmOpen
          ) {
            return;
          }
          closeRegenerateModal();
        }}
        title={
          regenerateIndex !== null
            ? `Regenerate creative ${regenerateIndex + 1}`
            : "Regenerate"
        }
      >
        <Modal.Section>
          <BlockStack gap="400">
            {brandAdRegenBaseImageUrls.length === 0 ? (
              <Banner tone="warning" title="AI regeneration requires a URL">
                <p>
                  To regenerate, the current image or a product image must be an http(s) URL (not a
                  local/data URL).
                </p>
              </Banner>
            ) : null}

            {brandAdRegenBaseImageUrls.length > 0 ? (
              <BlockStack gap="300">
                <div>
                  <Text as="h3" variant="bodyMd" fontWeight="semibold">
                    Product images
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Select an image to use as the base for regeneration. The first option is this
                    creative; other thumbnails are from your product.
                  </Text>
                </div>

                <div className="space-y-3">
                  <div className="relative flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRegenSlideIndex((i) => Math.max(0, i - 1))}
                      disabled={regenSlideIndex <= 0}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--p-color-border)] bg-[color:var(--p-color-bg-surface)] shadow-sm transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-[color:var(--p-color-bg-surface-hover)] hover:enabled:shadow-md"
                      aria-label="Previous images"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>

                    <div
                      className="min-w-0 shrink-0 overflow-hidden"
                      style={{ width: isMobileLayout ? "min(60vw, 294px)" : "320px" }}
                    >
                      <div
                        className="flex transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                        style={{
                          width: `${regenTotalSlides * 100}%`,
                          transform: `translateX(-${(regenSlideIndex / regenTotalSlides) * 100}%)`,
                        }}
                      >
                        {Array.from({ length: regenTotalSlides }).map((_, slideIdx) => {
                          const start = slideIdx * thumbnailsPerPage;
                          const slice = brandAdRegenBaseImageUrls.slice(
                            start,
                            start + thumbnailsPerPage,
                          );
                          return (
                            <div
                              key={slideIdx}
                              className="flex shrink-0 items-center justify-center px-0.5"
                              style={{ width: `${100 / regenTotalSlides}%` }}
                            >
                              <div className="flex w-fit max-w-full flex-wrap justify-center gap-1.5">
                                {slice.map((url, i) => {
                                  const actualIndex = start + i;
                                  const isSelected = selectedReferenceIndex === actualIndex;
                                  return (
                                    <button
                                      key={actualIndex}
                                      type="button"
                                      onClick={() => setSelectedReferenceIndex(actualIndex)}
                                      className={`box-border h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-md border border-[color:var(--p-color-border)] bg-[color:var(--p-color-bg-surface)] p-0.5 transition-all duration-200 hover:border-[color:var(--p-color-border-info)] sm:h-12 sm:w-12 ${
                                        isSelected
                                          ? "border-[color:var(--p-color-border-info)] bg-[color:var(--p-color-bg-surface-info)] ring-1 ring-[color:var(--p-color-border-info)]"
                                          : ""
                                      }`}
                                      aria-pressed={isSelected}
                                      aria-label={`Reference image ${actualIndex + 1}${
                                        isSelected ? ", selected" : ""
                                      }`}
                                    >
                                      <img
                                        src={url}
                                        alt={`Reference ${actualIndex + 1}`}
                                        className="h-full w-full rounded object-cover"
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setRegenSlideIndex((i) => Math.min(regenTotalSlides - 1, i + 1))
                      }
                      disabled={regenSlideIndex >= regenTotalSlides - 1}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--p-color-border)] bg-[color:var(--p-color-bg-surface)] shadow-sm transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-[color:var(--p-color-bg-surface-hover)] hover:enabled:shadow-md"
                      aria-label="Next images"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>

                  {regenTotalSlides > 1 ? (
                    <div
                      className="mt-3 flex justify-center gap-1.5 pt-2"
                      role="tablist"
                      aria-label="Image carousel pages"
                    >
                      {Array.from({ length: regenTotalSlides }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          role="tab"
                          aria-selected={regenSlideIndex === i}
                          aria-label={`Page ${i + 1} of ${regenTotalSlides}`}
                          onClick={() => setRegenSlideIndex(i)}
                          className={`h-2 w-2 rounded-full border-none bg-[color:var(--p-color-border)] transition-transform duration-200 hover:scale-110 hover:bg-[color:var(--p-color-border-emphasis)] ${
                            regenSlideIndex === i
                              ? "scale-125 bg-[color:var(--p-color-border-info)]"
                              : ""
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </BlockStack>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BlockStack gap="200">
                <Text as="h3" variant="bodyMd" fontWeight="semibold">
                  Current image
                </Text>
                <Box className="flex w-full items-center justify-center">
                  {selectedBaseImageUrl || selectedRegenerateImageUrl ? (
                    <div className="mx-auto flex w-full max-w-[min(320px,80vw)] md:max-w-[min(400px,42vw)] items-center justify-center overflow-hidden rounded-lg bg-gray-50 aspect-[9/16]">
                      <img
                        src={selectedBaseImageUrl || selectedRegenerateImageUrl}
                        alt="Selected base"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <Text as="p" variant="bodySm" tone="subdued">
                      No image selected
                    </Text>
                  )}
                </Box>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="bodyMd" fontWeight="semibold">
                  Generated image
                </Text>
                <Box className="flex w-full items-center justify-center">
                  {regeneratePreviewUrl ? (
                    <div className="mx-auto flex w-full max-w-[min(320px,80vw)] md:max-w-[min(400px,42vw)] items-center justify-center overflow-hidden rounded-lg bg-gray-50 aspect-[9/16]">
                      <img
                        src={regeneratePreviewUrl}
                        alt="Generated"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[220px] w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
                      {regenerateSubmitting ? (
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Spinner
                            accessibilityLabel="Regenerating image"
                            size="large"
                          />
                          <Text
                            as="p"
                            variant="bodySm"
                            tone="subdued"
                            alignment="center"
                          >
                            Regenerating…
                          </Text>
                        </div>
                      ) : (
                        <Text
                          as="p"
                          variant="bodySm"
                          tone="subdued"
                          alignment="center"
                        >
                          New image will appear here after regeneration
                        </Text>
                      )}
                    </div>
                  )}
                </Box>
              </BlockStack>
            </div>

            <BlockStack gap="200">
              <Text as="p" variant="bodyMd">
                Regeneration prompt
              </Text>
              <TextField
                label=""
                labelHidden
                value={regeneratePrompt}
                onChange={(v) => {
                  setRegeneratePrompt(v);
                  if (regenerateError) setRegenerateError("");
                }}
                placeholder="Enter prompt to regenerate image..."
                multiline={2}
                disabled={regenerateSubmitting || applyCreativeSubmitting}
                autoComplete="off"
                error={
                  regenerateError
                    ? `Couldn't generate image: ${regenerateError}. Try a different prompt.`
                    : undefined
                }
              />
            </BlockStack>

            {regenerateSaveError ? (
              <Banner tone="critical" title="Couldn't save creative">
                <p>{regenerateSaveError}</p>
              </Banner>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-3">
              {regeneratePreviewUrl ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (regenerateSubmitting || applyCreativeSubmitting) return;
                    closeRegenerateModal();
                  }}
                  disabled={regenerateSubmitting || applyCreativeSubmitting}
                >
                  Close
                </Button>
              ) : null}

              <Button
                variant="primary"
                onClick={() => {
                  if (regenerateSubmitting || applyCreativeSubmitting) return;
                  if (regeneratePrompt.trim() && canRegenBase) {
                    void requestBrandAdImageRegenerateCredit();
                    return;
                  }
                  if (regeneratePreviewUrl) {
                    void handleApplyRegeneratedImage();
                  }
                }}
                disabled={
                  regenerateSubmitting ||
                  applyCreativeSubmitting ||
                  (!regeneratePreviewUrl && !regeneratePrompt.trim()) ||
                  (!regeneratePreviewUrl &&
                    !!regeneratePrompt.trim() &&
                    !canRegenBase)
                }
                loading={regenerateSubmitting || applyCreativeSubmitting}
              >
                {applyCreativeSubmitting
                  ? "Updating…"
                  : regenerateSubmitting
                    ? "Regenerating…"
                    : regeneratePrompt.trim()
                      ? "Regenerate"
                      : regeneratePreviewUrl
                        ? "Update"
                        : "Regenerate"}
              </Button>
            </div>
          </BlockStack>
        </Modal.Section>
      </Modal>

      <CreditConfirmationModal
        open={regenCreditConfirmOpen}
        onClose={() => setRegenCreditConfirmOpen(false)}
        onConfirm={() => {
          setRegenCreditConfirmOpen(false);
          void handleRegenerate();
        }}
        featureKey="image_regenerate"
      />
    </s-page>
  );
}
