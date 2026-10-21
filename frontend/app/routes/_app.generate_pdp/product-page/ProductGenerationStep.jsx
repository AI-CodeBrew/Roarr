import {
  Box,
  BlockStack,
  Card,
  InlineStack,
  Text,
  Button,
} from "@shopify/polaris";
import GenerateContainer from "../utils/GenerateContainer.jsx";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

/** Portrait aspect ratio for carousel images; width fills the column, height follows */
const MEDIA_IMAGE_ASPECT_RATIO = "360 / 440";

export default function ProductGenerationStep({
  isGenerating,
  generationPercentage = 0,
  generationStatus,
  generationError,
  isMagicLoading: isMagicLoadingProp = true,
  isMagicComplete = false,
  currentLoadingStep = 0,
  showAbraCadabraTick = false,
  magicResponse = null,
  hasError = false,
  onRetry = null,
}) {
  const hasErrorEffective =
    hasError || generationStatus === "failed" || Boolean(generationError);
  const isMagicLoadingBase =
    typeof isGenerating === "boolean" ? isGenerating : isMagicLoadingProp;
  const isMagicLoading = !hasErrorEffective && isMagicLoadingBase;
  const isMagicCompleteEffective =
    isMagicComplete || generationStatus === "completed";
  const magicResponseEffective =
    magicResponse || (generationError ? { error: generationError } : null);

  // Generation steps with their percentage thresholds
  const generationSteps = [
    { label: "Initiating", threshold: 0 },
    { label: "Building Product Context", threshold: 9 },
    { label: "Generating SEO optimized text content", threshold: 18 },
    { label: "Image Generation started", threshold: 28 },
    { label: "Generating Base Images", threshold: 36 },
    { label: "Maintaining Fidelity", threshold: 45 },
    { label: "Generating Product Images", threshold: 58 },
    { label: "Generating Supporting Images", threshold: 72 },
    { label: "Picking best Color Scheme", threshold: 85 },
    { label: "Adjusting overall layout", threshold: 94 },
    { label: "Completed", threshold: 100 },
  ];

  // Map percentage to generation step name
  const getGenerationStepName = (percentage) => {
    // Find the highest threshold that the percentage has reached
    for (let i = generationSteps.length - 1; i >= 0; i--) {
      if (percentage >= generationSteps[i].threshold) {
        return generationSteps[i].label;
      }
    }
    return "Start";
  };

  // Use generationPercentage from backend if available, otherwise calculate from step
  const progressPercentage = generationPercentage !== undefined && generationPercentage !== null
    ? Math.min(Math.max(0, generationPercentage), 100)
    : (isMagicCompleteEffective ? 100 : 0);

  // Get current generation step name based on percentage
  const currentGenerationStep = getGenerationStepName(progressPercentage);

  // Tips and Tricks for auto carousel
  const tips = [
    "Review the generated content in the next step and customize text, images, and colors to match your brand.",
    "Use high-quality product images for better results. The AI works best with clear, well-lit product photos.",
    "After publishing, you can always edit your page in the theme editor to make further adjustments.",
    "Experiment with different color schemes to find what resonates best with your audience.",
    "The generated content is SEO-optimized to help improve your search engine rankings and visibility.",
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Media items for right-side carousel
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
        "Kluck is the first AI-powered builder that takes you from product to a finished store instantly.",
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

  // Auto carousel for tips - continuously cycles through tips
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
        setFadeIn(true);
      }, 300); // Half of transition duration for fade out
    }, 4000); // Change tip every 4 seconds

    return () => clearInterval(interval);
  }, [tips.length]);

  // Auto carousel for right-side media
  useEffect(() => {
    const interval = setInterval(() => {
      setMediaFadeIn(false);
      setTimeout(() => {
        setCurrentMediaIndex(
          (prevIndex) => (prevIndex + 1) % mediaItems.length
        );
        setMediaFadeIn(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [mediaItems.length]);

  // Determine status for each step based on percentage
  const statusForIndex = (index) => {
    const step = generationSteps[index];
    if (!step) return "todo";

    const stepThreshold = step.threshold;
    const nextStep = generationSteps[index + 1];
    const nextThreshold = nextStep ? nextStep.threshold : 101; // Use 101 so 100% still shows as active for last step

    // If generation is complete, all steps are done
    if (isMagicCompleteEffective || progressPercentage >= 100) {
      return "done";
    }

    if (hasErrorEffective) {
      return "todo";
    }

    // Step is completed if we've reached the next step's threshold
    const isCompleted = progressPercentage >= nextThreshold;

    // Step is active if current percentage is at or above this step's threshold
    // but hasn't reached the next step's threshold yet
    const isActive = progressPercentage >= stepThreshold && progressPercentage < nextThreshold;

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

        {/* Main Content: ~65% Left + ~35% Right */}
        <Box className="grid grid-cols-1 lg:grid-cols-[calc(66%-6px)_calc(34%-6px)] gap-3" style={{ alignItems: 'stretch', width: '100%' }}>
          {/* Left Column: ~65% - Progress Card and Tips Card */}
          <BlockStack gap="300">
            {/* Generation Progress Card */}
            <Card roundedAbove="sm" padding="0">
              <Box background="bg-surface" padding="400">
                <BlockStack gap="300">
                <Text as="h3" variant="bodySm" fontWeight="semibold">
                  Generation Progress
                </Text>
                {/* Progress Steps and Indicator Side by Side */}
                <Box className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6" style={{ alignItems: 'stretch' }}>
                  {/* Left: Progress Steps */}
                  <BlockStack gap="200">
                    {generationSteps.map((step, index) => {
                      const status = statusForIndex(index);
                      return (
                        <InlineStack key={step.label} gap="200" align="start" blockAlign="center">
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
                              <Text as="span" variant="bodyXs" fontWeight="semibold">
                                {index + 1}
                              </Text>
                            )}
                          </Box>

                          <Text
                            as="span"
                            variant="bodySm"
                            tone={status === "todo" ? "subdued" : undefined}
                            fontWeight={status === "active" ? "semibold" : "regular"}
                          >
                            {step.label}
                          </Text>
                        </InlineStack>
                      );
                    })}
                  </BlockStack>

                  {/* Right: Circular Progress Indicator with Full Height Gradient */}
                  <Box className="hidden lg:flex" style={{ minHeight: '100%' }}>
                    <Box
                      className={`rounded-xl flex items-center justify-center overflow-hidden p-6 ${isMagicCompleteEffective
                        ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50'
                        : 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50'
                        }`}
                      style={{
                        backgroundImage: isMagicCompleteEffective
                          ? 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 70%)'
                          : 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                        width: '100%',
                        minHeight: '100%',
                      }}
                    >
                      {isMagicCompleteEffective ? (
                        <Box className="flex flex-col items-center gap-2">
                          <Box className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <Check size={36} className="text-white" strokeWidth={3} />
                          </Box>
                          <Text as="p" variant="bodySm" fontWeight="semibold" alignment="center">
                            Complete!
                          </Text>
                        </Box>
                      ) : (
                        <Box className="flex flex-col items-center gap-3">
                          {/* Circular Progress Indicator */}
                          <Box className="relative w-40 h-40">
                            <svg className="transform -rotate-90 w-40 h-40" viewBox="0 0 160 160">
                              {/* Background circle */}
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-gray-200"
                              />
                              {/* Progress circle */}
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="url(#progressGradient)"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 70}`}
                                strokeDashoffset={`${2 * Math.PI * 70 * (1 - progressPercentage / 100)}`}
                                className="transition-all duration-500 ease-out"
                                style={{
                                  filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))',
                                }}
                              />
                              {/* Gradient definition */}
                              <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="50%" stopColor="#ec4899" />
                                  <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                              </defs>
                            </svg>
                            {/* Percentage text */}
                            <Box className="absolute inset-0 flex items-center justify-center">
                              <Box className="text-center">
                                <Text
                                  as="span"
                                  variant="headingXl"
                                  fontWeight="bold"
                                  className="bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent"
                                  style={{ fontSize: '48px', lineHeight: '1' }}
                                >
                                  {progressPercentage}
                                </Text>
                                <Text
                                  as="span"
                                  variant="bodySm"
                                  tone="subdued"
                                  className="block"
                                  style={{ fontSize: '14px' }}
                                >
                                  %
                                </Text>
                              </Box>
                            </Box>
                          </Box>
                          <Text as="p" variant="bodySm" fontWeight="semibold" alignment="center">
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

            {/* Tips and Tricks Card */}
            <Card roundedAbove="sm" padding="0">
              <Box background="bg-surface" padding="400">
                <BlockStack gap="300">
                <Text as="h3" variant="bodySm" fontWeight="semibold" alignment="center">
                  Tips and Tricks
                </Text>
                <Box
                  style={{
                    minHeight: '48px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    as="p"
                    variant="bodySm"
                    tone="subdued"
                    alignment="center"
                    style={{
                      opacity: fadeIn ? 1 : 0,
                      transition: 'opacity 0.3s ease-in-out',
                      position: 'absolute',
                      width: '100%',
                      margin: 0,
                    }}
                  >
                    {tips[currentTipIndex]}
                  </Text>
                </Box>
                {/* Tip Indicators - Center Aligned */}
                <Box style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
                  <InlineStack gap="100" align="center">
                    {tips.map((_, index) => (
                      <Box
                        key={index}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: index === currentTipIndex ? '#8b5cf6' : '#e1e3e5',
                          transition: 'background-color 0.3s ease-in-out',
                          cursor: 'pointer',
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

          {/* Right Column: portrait card carousel (fixed image + fixed text block height) */}
          <Box className="hidden lg:block" style={{ height: "100%", alignSelf: "stretch" }}>
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
                        <Text as="h2" variant="headingSm" className="line-clamp-2">
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


