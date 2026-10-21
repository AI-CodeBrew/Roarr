import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Banner, BlockStack, Box, Button, Modal, Spinner, Text, TextField } from '@shopify/polaris';
import { CreditConfirmationModal } from '../../../../../components/CreditConfirmationModal';
import { useCredits } from '../../../../../lib/CreditsContext';
import { hasEnoughCredits, resolveFeatureCost, shopSkipsCreditGates } from '../../../../../lib/credits';
import { usePages } from '../../../../../lib/PagesContext.jsx';

function isHttpUrl(url) {
  if (!url) return false;
  return /^https?:\/\//i.test(String(url));
}

function normalizeValue(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

export default function EditableImage({
  enabled = false,
  label = 'Image',
  badge = 'Image',
  src = '',
  alt = '',
  imageKey = '',
  pageId = null,
  onSave,
  onRegenerate, // optional override
  onRegenerateStart, // fires when regeneration is triggered (before API call)
  referenceImages = [], // product/reference images to show in modal and send to regenerate API
  children, // optional trigger element (e.g. a label/button)
  fallback = null,
  imgStyle = undefined,
  imgClassName = '',
  wrapperStyle = undefined,
  wrapperClassName = '',
}) {
  const currentSrc = useMemo(() => normalizeValue(src), [src]);
  const [open, setOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(currentSrc);
  const [prompt, setPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newGeneratedImageUrl, setNewGeneratedImageUrl] = useState(null);
  const [promptError, setPromptError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [selectedReferenceIndex, setSelectedReferenceIndex] = useState(0);
  const [regenCreditConfirmOpen, setRegenCreditConfirmOpen] = useState(false);
  const pendingRegenerateBaseUrlRef = useRef(null);
  const { refresh: refreshCreditsWallet } = useCredits();
  const { storeDetails } = usePages() || {};

  const referenceUrls = useMemo(() => {
    const arr = Array.isArray(referenceImages) ? referenceImages : [];
    return arr.filter((u) => u && isHttpUrl(String(u)));
  }, [referenceImages]);

  // Product images list: current image first (pre-selected), then reference URLs, deduped
  const productImagesUrls = useMemo(() => {
    const base = draftUrl || currentSrc;
    const list = [];
    if (base && isHttpUrl(base)) list.push(base);
    referenceUrls.forEach((u) => {
      const url = String(u);
      if (url && isHttpUrl(url) && !list.includes(url)) list.push(url);
    });
    return list;
  }, [currentSrc, draftUrl, referenceUrls]);

  const selectedProductImageUrl = useMemo(() => {
    if (productImagesUrls.length === 0) return null;
    const idx = Math.min(Math.max(0, selectedReferenceIndex), productImagesUrls.length - 1);
    return productImagesUrls[idx];
  }, [productImagesUrls, selectedReferenceIndex]);

  const [thumbnailsPerPage, setThumbnailsPerPage] = useState(6);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    function updateThumbnailsPerPage() {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      setThumbnailsPerPage(width < 640 ? 4 : 6);
    }

    updateThumbnailsPerPage();

    if (typeof window === 'undefined') return;
    window.addEventListener('resize', updateThumbnailsPerPage);
    return () => {
      window.removeEventListener('resize', updateThumbnailsPerPage);
    };
  }, []);

  const totalSlides = Math.max(
    1,
    Math.ceil(productImagesUrls.length / thumbnailsPerPage)
  );

  useEffect(() => {
    setSlideIndex((prev) => Math.min(prev, totalSlides - 1));
  }, [totalSlides]);

  useEffect(() => {
    if (open) setSlideIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setDraftUrl(currentSrc);
      setPrompt('');
      setIsRegenerating(false);
      setIsUpdating(false);
      setNewGeneratedImageUrl(null);
      setPromptError('');
      setSaveError('');
      setSelectedReferenceIndex(0);
    } else {
      setSelectedReferenceIndex(0);
    }
  }, [open, currentSrc]);

  useEffect(() => {
    if (open && productImagesUrls.length > 0 && selectedReferenceIndex >= productImagesUrls.length) {
      setSelectedReferenceIndex(productImagesUrls.length - 1);
    }
  }, [open, productImagesUrls.length, selectedReferenceIndex]);

  const regenerateHintContent = (
    <span
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      aria-hidden="true"
    >
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium tracking-[0.01em] shadow-md">
        <span className="flex items-center justify-center text-indigo-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </span>
        <span className="font-medium text-slate-600">Regenerate</span>
      </span>
    </span>
  );

  const carouselArrowClasses =
    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[color:var(--p-color-border)] bg-[color:var(--p-color-bg-surface)] text-[color:var(--p-color-text)] shadow-sm transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-[color:var(--p-color-bg-surface-hover)] hover:enabled:shadow-md hover:enabled:scale-105';

  const triggerEl = (() => {
    if (children) {
      const child = React.Children.only(children);
      const childStyle = child?.props?.style || {};
      const childClassName = child?.props?.className || '';
      return React.cloneElement(child, {
        className: enabled ? `${childClassName} hb-editable-wrap group` : childClassName,
        style: enabled
          ? { ...childStyle, position: 'relative', cursor: 'pointer' }
          : childStyle,
        onClick: (e) => {
          if (!enabled) return child?.props?.onClick?.(e);
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        },
        children: enabled ? (
          <>
            {child.props.children}
            <span className="hb-editable-overlay" aria-hidden="true" />
            <span className="hb-editable-badge" aria-hidden="true">
              {badge}
            </span>
            {regenerateHintContent}
          </>
        ) : (
          child.props.children
        ),
      });
    }

    // Default trigger is the image itself
    return (
      <div
        className={enabled ? `hb-editable-wrap group ${wrapperClassName}` : wrapperClassName}
        style={{
          position: 'relative',
          cursor: enabled ? 'pointer' : undefined,
          ...wrapperStyle,
        }}
        onClick={(e) => {
          if (!enabled) return;
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {currentSrc ? (
          <img
            src={currentSrc}
            alt={alt || label}
            className={imgClassName}
            style={imgStyle}
          />
        ) : (
          fallback
        )}
        {enabled && <span className="hb-editable-overlay" aria-hidden="true" />}
        {enabled && (
          <span className="hb-editable-badge" aria-hidden="true">
            {badge}
          </span>
        )}
        {enabled && regenerateHintContent}
      </div>
    );
  })();

  async function executeRegenerateWithAi(baseImageUrl) {
    if (!prompt.trim()) return;
    if (!isHttpUrl(baseImageUrl)) return;

    onRegenerateStart?.();
    setNewGeneratedImageUrl(null);
    setIsRegenerating(true);
    setPromptError('');
    setSaveError('');
    try {
      const payload = {
        image_url: baseImageUrl,
        prompt: prompt.trim(),
        image_key: imageKey,
        pageId,
        reference_image_urls: undefined,
      };
      if (typeof onRegenerate === 'function') {
        const nextUrl = await onRegenerate(payload);
        if (nextUrl) setNewGeneratedImageUrl(nextUrl);
        setPrompt('');
        return;
      }

      const res = await fetch('/api/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: baseImageUrl,
          prompt: prompt.trim(),
          image_key: imageKey || 'inline_edit_image',
          pageId: pageId || null,
          reference_image_urls: undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to regenerate image');
      }
      setNewGeneratedImageUrl(data.image_url || null);
      setPrompt('');
    } catch (err) {
      setPromptError(err?.message || String(err));
    } finally {
      setIsRegenerating(false);
    }
  }

  const requestRegenerateCredit = async (baseImageUrl) => {
    if (!prompt.trim() || !isHttpUrl(baseImageUrl)) return;
    pendingRegenerateBaseUrlRef.current = baseImageUrl;
    const wallet = await refreshCreditsWallet();
    const cost = resolveFeatureCost(
      'image_regenerate',
      wallet.featureCosts ?? undefined,
    );
    if (
      shopSkipsCreditGates(storeDetails) ||
      (wallet.ok && hasEnoughCredits(wallet.balance, cost))
    ) {
      pendingRegenerateBaseUrlRef.current = null;
      void executeRegenerateWithAi(baseImageUrl);
      return;
    }
    setRegenCreditConfirmOpen(true);
  };

  return (
    <>
      {triggerEl}
      <Modal
        open={open && enabled}
        onClose={() => {
          if (isRegenerating || isUpdating) return;
          setOpen(false);
        }}
        // size="large"
        title={label}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {(() => {
              const baseUrl = draftUrl || currentSrc;
              const canRegenerate = selectedProductImageUrl && isHttpUrl(selectedProductImageUrl);

              const canGoPrev = slideIndex > 0;
              const canGoNext = slideIndex < totalSlides - 1;

              const ChevronLeft = () => (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              );
              const ChevronRight = () => (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              );

              return (
                <BlockStack gap="400">
                  {!canRegenerate && productImagesUrls.length === 0 ? (
                    <Banner tone="warning" title="AI regeneration requires a URL">
                      <p>To regenerate, the current image must be an http(s) URL (not a local/data URL).</p>
                    </Banner>
                  ) : null}

                  {productImagesUrls.length > 0 ? (
                    <BlockStack gap="300">
                      <div>
                        <Text as="h3" variant="bodyMd" fontWeight="semibold">
                          Product images
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Select a product image to use as the base for regeneration. The first image is the current one.
                        </Text>
                      </div>

                      <div className="space-y-3">
                        <div className="relative flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                            disabled={!canGoPrev}
                            className={carouselArrowClasses}
                            aria-label="Previous images"
                          >
                            <ChevronLeft />
                          </button>

                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div
                              className="flex transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                              style={{
                                width: `${totalSlides * 100}%`,
                                transform: `translateX(-${(slideIndex / totalSlides) * 100}%)`,
                              }}
                            >
                              {Array.from({ length: totalSlides }).map((_, slideIdx) => {
                                const start = slideIdx * thumbnailsPerPage;
                                const slice = productImagesUrls.slice(start, start + thumbnailsPerPage);
                                return (
                                  <div
                                    key={slideIdx}
                                    className="shrink-0 px-1"
                                    style={{ width: `${100 / totalSlides}%` }}
                                  >
                                    <div
                                      className={`grid h-full gap-2.5 ${
                                        thumbnailsPerPage === 4 ? 'grid-cols-4' : 'grid-cols-6'
                                      }`}
                                    >
                                      {slice.map((url, i) => {
                                        const actualIndex = start + i;
                                        const isSelected = selectedReferenceIndex === actualIndex;
                                        return (
                                          <button
                                            key={actualIndex}
                                            type="button"
                                            onClick={() => setSelectedReferenceIndex(actualIndex)}
                                            className={`aspect-square rounded-[10px] border-2 border-[color:var(--p-color-border)] bg-[color:var(--p-color-bg-surface)] p-1.5 cursor-pointer overflow-hidden transition-all duration-200 hover:border-[color:var(--p-color-border-info)] hover:bg-[color:var(--p-color-bg-surface-secondary-hover)] ${
                                              isSelected
                                                ? 'border-[color:var(--p-color-border-info)] bg-[color:var(--p-color-bg-surface-info)] shadow-[0_0_0_2px_var(--p-color-border-info-subdued)]'
                                                : ''
                                            }`}
                                            aria-pressed={isSelected}
                                            aria-label={`Product image ${actualIndex + 1}${isSelected ? ', selected' : ''}`}
                                          >
                                            <img
                                              src={url}
                                              alt={`Product image ${actualIndex + 1}`}
                                              className="h-full w-full rounded-md object-cover"
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
                            onClick={() => setSlideIndex((i) => Math.min(totalSlides - 1, i + 1))}
                            disabled={!canGoNext}
                            className={carouselArrowClasses}
                            aria-label="Next images"
                          >
                            <ChevronRight />
                          </button>
                        </div>

                        {totalSlides > 1 ? (
                          <div
                            className="mt-3 flex justify-center gap-1.5 pt-2"
                            role="tablist"
                            aria-label="Image carousel pages"
                          >
                            {Array.from({ length: totalSlides }).map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                role="tab"
                                aria-selected={slideIndex === i}
                                aria-label={`Page ${i + 1} of ${totalSlides}`}
                                onClick={() => setSlideIndex(i)}
                                className={`h-2 w-2 rounded-full border-none bg-[color:var(--p-color-border)] transition-transform duration-200 hover:scale-110 hover:bg-[color:var(--p-color-border-emphasis)] ${
                                  slideIndex === i ? 'scale-125 bg-[color:var(--p-color-border-info)]' : ''
                                }`}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </BlockStack>
                  ) : null}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BlockStack gap="200">
                      <Text as="h3" variant="bodyMd" fontWeight="semibold">
                        Current Image
                      </Text>
                      <Box className="w-full flex items-center justify-center">
                        {(selectedProductImageUrl || baseUrl) ? (
                          <div className="w-full max-w-[360px] aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                            <img
                              src={selectedProductImageUrl || baseUrl}
                              alt={alt || 'Selected'}
                              className="w-full h-full object-contain"
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
                        Generated Image
                      </Text>
                      <Box className="w-full flex h-full items-center justify-center min-h-[220px]">
                        {newGeneratedImageUrl ? (
                          <img
                            src={newGeneratedImageUrl}
                            alt={alt || 'Generated'}
                            className="max-w-full max-h-[360px] object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                            {isRegenerating ? (
                              <div className="flex flex-col items-center justify-center gap-3">
                                <Spinner accessibilityLabel="Regenerating image" size="large" />
                                <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                                  Regenerating...
                                </Text>
                              </div>
                            ) : (
                              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
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
                      Regeneration Prompt
                    </Text>
                    <TextField
                      label=""
                      labelHidden
                      value={prompt}
                      onChange={(v) => {
                        setPrompt(v);
                        if (promptError) setPromptError('');
                      }}
                      placeholder="Enter prompt to regenerate image..."
                      multiline={2}
                      disabled={isRegenerating || isUpdating}
                      autoComplete="off"
                      error={
                        promptError
                          ? `Couldn't generate image: ${promptError}. Try a different prompt.`
                          : undefined
                      }
                    />
                  </BlockStack>

                  {saveError ? (
                    <Banner tone="critical" title="Couldn’t save image">
                      <p>{saveError}</p>
                    </Banner>
                  ) : null}

                  <div className="flex items-center justify-end gap-3">
                    {newGeneratedImageUrl && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          if (isRegenerating || isUpdating) return;
                          setOpen(false);
                        }}
                        disabled={isRegenerating || isUpdating}
                      >
                        Discard
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      onClick={async () => {
                        // If there is a prompt, always regenerate using the selected product image as base
                        if (!isRegenerating && !isUpdating && prompt.trim() && selectedProductImageUrl) {
                          requestRegenerateCredit(selectedProductImageUrl);
                          return;
                        }

                        // If there is a generated image and no new prompt, update
                        if (newGeneratedImageUrl && !isUpdating) {
                          setIsUpdating(true);
                          setSaveError('');
                          setPromptError('');
                          try {
                            setDraftUrl(newGeneratedImageUrl);
                            if (typeof onSave === 'function') {
                              await onSave(newGeneratedImageUrl);
                            }
                            setOpen(false);
                          } catch (err) {
                            setSaveError(err?.message || String(err));
                          } finally {
                            setIsUpdating(false);
                          }
                        }
                      }}
                      disabled={
                        isRegenerating ||
                        isUpdating ||
                        (!newGeneratedImageUrl && !prompt.trim()) ||
                        (!newGeneratedImageUrl && !!prompt.trim() && !canRegenerate)
                      }
                      loading={isRegenerating || isUpdating}
                    >
                      {isUpdating
                        ? 'Updating...'
                        : isRegenerating
                          ? 'Regenerating...'
                          : prompt.trim()
                            ? 'Regenerate'
                            : newGeneratedImageUrl
                              ? 'Update'
                              : 'Regenerate'}
                    </Button>
                  </div>
                </BlockStack>
              );
            })()}

          </BlockStack>
        </Modal.Section>
      </Modal>

      <CreditConfirmationModal
        open={regenCreditConfirmOpen}
        onClose={() => {
          pendingRegenerateBaseUrlRef.current = null;
          setRegenCreditConfirmOpen(false);
        }}
        onConfirm={() => {
          const base = pendingRegenerateBaseUrlRef.current;
          pendingRegenerateBaseUrlRef.current = null;
          setRegenCreditConfirmOpen(false);
          if (base) void executeRegenerateWithAi(base);
        }}
        featureKey="image_regenerate"
      />
    </>
  );
}

