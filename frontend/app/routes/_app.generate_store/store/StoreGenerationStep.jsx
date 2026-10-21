import {
  Box,
  BlockStack,
  Card,
  InlineStack,
  Text,
  Button,
} from "@shopify/polaris";
import GenerateContainer from "../../_app.generate_pdp/utils/GenerateContainer.jsx";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

/** Portrait aspect ratio for carousel images; width fills the column, height follows */
const MEDIA_IMAGE_ASPECT_RATIO = "360 / 440";

/** Store phases + Completed — thresholds align with backend percentage (same pattern as product page). */
const generationSteps = [
  { label: "Preparing your store", threshold: 0 },
  { label: "Validating products", threshold: 4 },
  { label: "Building product context", threshold: 8 },
  { label: "Generating home page content", threshold: 12 },
  { label: "Drafting headlines and sections", threshold: 20 },
  { label: "Preparing image assets", threshold: 28 },
  { label: "Generating hero and banners", threshold: 40 },
  { label: "Rendering features and highlights", threshold: 52 },
  { label: "Finalizing home page visuals", threshold: 62 },
  { label: "Syncing collections", threshold: 74 },
  { label: "Saving generated content", threshold: 95 },
  { label: "Completed", threshold: 100 },
];

export default function StoreGenerationStep({
  isGenerating,
  generationPercentage = 0,
  generationStatus = "in_progress",
  generationError = null,
  onRetry = null,
  storeType = null,
  multiIncludePremiumPdps = true,
}) {
  const hasErrorEffective =
    generationStatus === "failed" || Boolean(generationError);
  const isMagicLoadingBase =
    typeof isGenerating === "boolean" ? isGenerating : true;
  const isMagicLoading = !hasErrorEffective && isMagicLoadingBase;
  const isMagicCompleteEffective = generationStatus === "completed";
  const magicResponseEffective = generationError
    ? { error: generationError }
    : null;

  const shouldShow =
    generationStatus === "in_progress" || generationStatus === "failed";
  if (!shouldShow) return null;

  const progressPercentage =
    generationPercentage !== undefined && generationPercentage !== null
      ? Math.min(Math.max(0, generationPercentage), 100)
      : isMagicCompleteEffective
        ? 100
        : 0;

  const tips = [
    "Your home page and product templates are generated together for a consistent store experience.",
    "After generation, fine-tune copy, colors, and fonts before pushing to your theme.",
    "Sections and styles are written to the theme you select—preview everything before publish.",
    "You can always adjust layouts and content in the Shopify theme editor later.",
    "Generated content is structured for merchandising across your catalog and home page.",
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  const mediaItems = [
    {
      title: "Could it get any easier?",
      description:
        "Select your product and boom! Your ready-to-go-live product landing page is done.",
      imageUrl:
        "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/WhatsApp_Image_2026-01-28_at_3.13.30_PM.jpg?v=1769595526",
    },
    {
      title: "Under 3 minutes",
      description:
        "Roarr is the first AI-powered builder that takes you from product to a finished store instantly.",
      imageUrl:
        "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/WhatsApp_Image_2026-01-28_at_3.13.30_PM_1.jpg?v=1769595526",
    },
    {
      title: "Optimized for Conversion",
      description:
        "We didn't just teach our AI to design. We taught it to sell.",
      imageUrl:
        "https://cdn.shopify.com/s/files/1/0704/0119/6122/files/WhatsApp_Image_2026-01-28_at_3.13.31_PM_2.jpg?v=1769595526",
    },
  ];

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaFadeIn, setMediaFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
        setFadeIn(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, [tips.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMediaFadeIn(false);
      setTimeout(() => {
        setCurrentMediaIndex(
          (prevIndex) => (prevIndex + 1) % mediaItems.length,
        );
        setMediaFadeIn(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [mediaItems.length]);

  const statusForIndex = (index) => {
    const step = generationSteps[index];
    if (!step) return "todo";

    const stepThreshold = step.threshold;
    const nextStep = generationSteps[index + 1];
    const nextThreshold = nextStep ? nextStep.threshold : 101;

    if (isMagicCompleteEffective || progressPercentage >= 100) {
      return "done";
    }

    if (hasErrorEffective) {
      return "todo";
    }

    const isCompleted = progressPercentage >= nextThreshold;
    const isActive =
      progressPercentage >= stepThreshold &&
      progressPercentage < nextThreshold;

    if (isCompleted) return "done";
    if (isActive) return "active";
    return "todo";
  };

  return (
    <Box className="bg-[#f2f2f2] overflow-y-auto overflow-x-hidden">
      <GenerateContainer style={{ maxWidth: "1150px" }}>
        <BlockStack gap="400">
          {magicResponseEffective?.error || hasErrorEffective ? (
            <Box
              background="bg-surface-critical"
              borderWidth="025"
              borderColor="border-critical"
              borderRadius="300"
              padding="300"
            >
              <BlockStack gap="200">
                <Text as="h3" variant="bodySm" fontWeight="semibold">
                  API Error
                </Text>
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="p" variant="bodySm">
                    {magicResponseEffective?.error ||
                      generationError ||
                      "Something went wrong. Please try again."}
                  </Text>
                  {onRetry ? (
                    <Button
                      variant="primary"
                      onClick={() => onRetry()}
                      disabled={isMagicLoading}
                    >
                      Retry
                    </Button>
                  ) : null}
                </InlineStack>
              </BlockStack>
            </Box>
          ) : null}

          <Box
            className="grid grid-cols-1 lg:grid-cols-[calc(66%-6px)_calc(34%-6px)] gap-3"
            style={{ alignItems: "stretch", width: "100%" }}
          >
            <BlockStack gap="300">
              <Card roundedAbove="sm" padding="0">
                <Box background="bg-surface" padding="400">
                  <BlockStack gap="300">
                  {storeType === "multi" ? (
                    <Box background="bg-surface-warning" padding="300" borderRadius="200">
                      <Text as="p" variant="bodyMd">
                        <span style={{ fontStyle: "italic" }}>
                          {multiIncludePremiumPdps ? (
                            <>
                              As we are going to generate an entire store along with 3 product
                              pages,{" "}
                              <span style={{ fontWeight: 700 }}>
                                this whole process may take 6-8 minutes.
                              </span>
                            </>
                          ) : (
                            <>
                              Generating your multi-product storefront (homepage, collections,
                              FAQs) —{" "}
                              <span style={{ fontWeight: 700 }}>
                                this usually takes a few minutes.
                              </span>
                            </>
                          )}
                        </span>
                      </Text>
                    </Box>
                  ) : null}
                  <Text as="h3" variant="bodySm" fontWeight="semibold">
                    Generation Progress
                  </Text>
                  <Box
                    className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6"
                    style={{ alignItems: "stretch" }}
                  >
                    <BlockStack gap="200">
                      {generationSteps.map((step, index) => {
                        const status = statusForIndex(index);
                        return (
                          <InlineStack
                            key={step.label}
                            gap="200"
                            align="start"
                            blockAlign="center"
                          >
                            <Box
                              className={[
                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                                status === "done"
                                  ? "bg-gray-900 text-white"
                                  : status === "active"
                                    ? "bg-gray-200 text-gray-900"
                                    : "bg-white border border-gray-200 text-gray-500",
                              ].join(" ")}
                            >
                              {status === "done" ? (
                                <Check size={16} />
                              ) : status === "active" ? (
                                <Box className="w-4 h-4">
                                  <svg
                                    className="animate-spin text-gray-900"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                </Box>
                              ) : (
                                <Text
                                  as="span"
                                  variant="bodyXs"
                                  fontWeight="semibold"
                                >
                                  {index + 1}
                                </Text>
                              )}
                            </Box>

                            <Text
                              as="span"
                              variant="bodySm"
                              tone={status === "todo" ? "subdued" : undefined}
                              fontWeight={
                                status === "active" ? "semibold" : "regular"
                              }
                            >
                              {step.label}
                            </Text>
                          </InlineStack>
                        );
                      })}
                    </BlockStack>

                    <Box
                      className="hidden lg:flex"
                      style={{ minHeight: "100%" }}
                    >
                      <Box
                        className={`rounded-xl flex items-center justify-center overflow-hidden p-6 ${
                          isMagicCompleteEffective
                            ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50"
                            : "bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50"
                        }`}
                        style={{
                          backgroundImage: isMagicCompleteEffective
                            ? "radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 70%)"
                            : "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
                          width: "100%",
                          minHeight: "100%",
                        }}
                      >
                        {isMagicCompleteEffective ? (
                          <Box className="flex flex-col items-center gap-2">
                            <Box className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                              <Check
                                size={36}
                                className="text-white"
                                strokeWidth={3}
                              />
                            </Box>
                            <Text
                              as="p"
                              variant="bodySm"
                              fontWeight="semibold"
                              alignment="center"
                            >
                              Complete!
                            </Text>
                          </Box>
                        ) : (
                          <Box className="flex flex-col items-center gap-3">
                            <Box className="relative w-40 h-40">
                              <svg
                                className="transform -rotate-90 w-40 h-40"
                                viewBox="0 0 160 160"
                              >
                                <circle
                                  cx="80"
                                  cy="80"
                                  r="70"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="none"
                                  className="text-gray-200"
                                />
                                <circle
                                  cx="80"
                                  cy="80"
                                  r="70"
                                  stroke="url(#storeProgressGradient)"
                                  strokeWidth="8"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeDasharray={`${2 * Math.PI * 70}`}
                                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - progressPercentage / 100)}`}
                                  className="transition-all duration-500 ease-out"
                                  style={{
                                    filter:
                                      "drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))",
                                  }}
                                />
                                <defs>
                                  <linearGradient
                                    id="storeProgressGradient"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%"
                                  >
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="50%" stopColor="#ec4899" />
                                    <stop offset="100%" stopColor="#3b82f6" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <Box className="absolute inset-0 flex items-center justify-center">
                                <Box className="text-center">
                                  <Text
                                    as="span"
                                    variant="headingXl"
                                    fontWeight="bold"
                                    className="bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
                                    style={{ fontSize: "48px", lineHeight: "1" }}
                                  >
                                    {progressPercentage}
                                  </Text>
                                  <Text
                                    as="span"
                                    variant="bodySm"
                                    tone="subdued"
                                    className="block"
                                    style={{ fontSize: "14px" }}
                                  >
                                    %
                                  </Text>
                                </Box>
                              </Box>
                            </Box>
                            <Text
                              as="p"
                              variant="bodySm"
                              fontWeight="semibold"
                              alignment="center"
                            >
                              Progress Indicator
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  </BlockStack>
                </Box>
              </Card>

              <Card roundedAbove="sm" padding="0">
                <Box background="bg-surface" padding="400">
                  <BlockStack gap="300">
                  <Text
                    as="h3"
                    variant="bodySm"
                    fontWeight="semibold"
                    alignment="center"
                  >
                    Tips and Tricks
                  </Text>
                  <Box
                    style={{
                      minHeight: "48px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      as="p"
                      variant="bodySm"
                      tone="subdued"
                      alignment="center"
                      style={{
                        opacity: fadeIn ? 1 : 0,
                        transition: "opacity 0.3s ease-in-out",
                        position: "absolute",
                        width: "100%",
                        margin: 0,
                      }}
                    >
                      {tips[currentTipIndex]}
                    </Text>
                  </Box>
                  <Box
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      paddingTop: "8px",
                    }}
                  >
                    <InlineStack gap="100" align="center">
                      {tips.map((_, index) => (
                        <Box
                          key={index}
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor:
                              index === currentTipIndex ? "#8b5cf6" : "#e1e3e5",
                            transition: "background-color 0.3s ease-in-out",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setFadeIn(false);
                            setTimeout(() => {
                              setCurrentTipIndex(index);
                              setFadeIn(true);
                            }, 300);
                          }}
                        />
                      ))}
                    </InlineStack>
                  </Box>
                  </BlockStack>
                </Box>
              </Card>
            </BlockStack>

            <Box
              className="hidden lg:block"
              style={{ height: "100%", alignSelf: "stretch" }}
            >
              <Box
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <Box
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Card padding="0">
                    <BlockStack gap="0">
                      <Box
                        style={{
                          width: "100%",
                          aspectRatio: MEDIA_IMAGE_ASPECT_RATIO,
                          position: "relative",
                          overflow: "hidden",
                          flexShrink: 0,
                          borderTopLeftRadius: "var(--p-border-radius-200)",
                          borderTopRightRadius: "var(--p-border-radius-200)",
                        }}
                      >
                        <img
                          alt={mediaItems[currentMediaIndex].title}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center",
                            display: "block",
                            opacity: mediaFadeIn ? 1 : 0,
                            transition: "opacity 0.3s ease-in-out",
                          }}
                          src={mediaItems[currentMediaIndex].imageUrl}
                        />
                      </Box>
                      <Box padding="400">
                        <BlockStack gap="150">
                          <Text
                            as="h2"
                            variant="headingSm"
                            className="line-clamp-2"
                          >
                            {mediaItems[currentMediaIndex].title}
                          </Text>
                          <Text
                            as="p"
                            variant="bodySm"
                            tone="subdued"
                            className="line-clamp-4"
                          >
                            {mediaItems[currentMediaIndex].description}
                          </Text>
                        </BlockStack>
                      </Box>
                    </BlockStack>
                  </Card>
                </Box>
              </Box>
            </Box>
          </Box>
        </BlockStack>
      </GenerateContainer>
    </Box>
  );
}
