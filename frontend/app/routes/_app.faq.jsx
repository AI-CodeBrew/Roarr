import { useState, useMemo, useCallback } from "react";
import { useRouteError, useOutletContext, useNavigate, useSearchParams } from "react-router";
import { buildEmbeddedHref } from "../lib/embeddedNavigation";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { BlockStack, Text, Box, InlineStack, ButtonGroup, Button, Card } from "@shopify/polaris";
import { SettingsIcon, CreditCardIcon, EditIcon, AdjustIcon } from "@shopify/polaris-icons";
import { FaqAccordionList } from "../components/FaqAccordionList";
import { usePageTracking } from "../hooks/usePageTracking";
import { useViewportBelowMd } from "../hooks/useViewportBelowMd";
import { CreditWalletWidget } from "../components/CreditWalletWidget";

const FAQ_CATEGORIES = {
    ALL: "all",
    GENERAL: "general",
    CUSTOMIZATION: "customization",
    BILLING: "billing",
    TROUBLESHOOTING: "troubleshooting",
};

const faqs = [
    // General & How it Works
    {
        id: 1,
        category: FAQ_CATEGORIES.GENERAL,
        question: "What do I need to get started?",
        answer: "To generate a product page, select any product from your Shopify store. The product should have at least one image and a basic description.",
        icon: SettingsIcon,
    },
    {
        id: 2,
        category: FAQ_CATEGORIES.GENERAL,
        question: "How does Kluck create my page?",
        answer:"Our AI looks at your product image and description to understand what you're selling. It then researches the niche, picks the best design template for your product type and automatically creates professional copy, headings, and enhanced images that help convert visitors into customers.",
        icon: SettingsIcon,
    },
    {
        id: 3,
        category: FAQ_CATEGORIES.GENERAL,
        question: "How long does it take to create a page?",
        answer:"We have optimised our AI algorithm in a way that you can create your ready-to-go-live product page or home page within 3 minutes.",
        icon: SettingsIcon,
    },
    {
        id: 4,
        category: FAQ_CATEGORIES.GENERAL,
        question: "Do I need coding skills to use Kluck?",
        answer: "No, everything is automated with Kluck, so no-coding or designing skills are required.",
        icon: SettingsIcon,
    },
    {
        id: 5,
        category: FAQ_CATEGORIES.GENERAL,
        question: "Will Kluck slow down my store?",
        answer: "No, not at all. After rigorous testing we have made Kluck generated stores and product pages to load fast and even improve your SEO.",
        icon: SettingsIcon,
    },
    {
        id: 6,
        category: FAQ_CATEGORIES.GENERAL,
        question: "What can Kluck create for me?",
        answer: (
            <>
                Kluck creates two types of pages:{"\n"}
                • <span style={{ fontWeight: "bold" }}>Product Pages</span> - Beautiful landing pages for individual products that are proven to improve conversion rates.{"\n"}
                • <span style={{ fontWeight: "bold" }}>Store Enhancement</span> - A complete store makeover including your home page, collection pages, header, footer, and product pages (available on Starter and Premium plans)
            </>
        ),
        icon: SettingsIcon,
    },
    // Customization & Features
    {
        id: 7,
        category: FAQ_CATEGORIES.CUSTOMIZATION,
        question: "Can I edit the page after it is generated?",
        answer:
            "Yes! After Kluck generates your page, you can edit the text, regenerate images, and adjust the styling in our editor. Once you publish, you can also make unlimited changes using Shopify's Theme Editor anytime. ",
        icon: EditIcon,
    },
    {
        id: 8,
        category: FAQ_CATEGORIES.CUSTOMIZATION,
        question: "Will the page match my current Shopify theme?",
        answer:
            "Kluck uses specially designed templates that are built to maximize sales. These templates have their own styling (like sticky 'Add to Cart' buttons and trust badges) to ensure everything works perfectly for conversions.",
        icon: EditIcon,
    },
    {
        id: 9,
        category: FAQ_CATEGORIES.CUSTOMIZATION,
        question: "Why do Kluck pages convert better?",
        answer:(
            <>
                Our AI doesn't just create pages; it creates pages that sell. Every page automatically includes:{"\n"}
                • Persuasive, benefit-focused copywriting.{"\n"}
                • Trust badges and shipping information.{"\n"}
                • Testimonials.{"\n"}
                • Urgency timers (optional).{"\n"}
                • Product-specific FAQ sections.{"\n"}
                • Bundle offers (like "Buy 2 Get 1 Free").{"\n"}
                • High SEO optimization for better search rankings.{"\n"}
                • Fast loading speeds.{"\n"}
            </>
        ),
        icon: EditIcon,
    },





    // Billing & Account
    {
        id: 10,
        category: FAQ_CATEGORIES.BILLING,
        question: "Is there a free version?",
        answer:(
            <>
                You can install Kluck and explore the app; AI generation uses <span style={{ fontWeight: "bold" }}>credits</span> from your wallet. Buy credit packs when you&apos;re ready to run full generations.{"\n"}
            </>
        ),
        icon: CreditCardIcon,
    },
    {
        id: 11,
        category: FAQ_CATEGORIES.BILLING,
        question: "How does pricing work?",
        answer:(
            <>
                Kluck is <span style={{ fontWeight: "bold" }}>credit-based</span>. You purchase credit packs in the app and spend credits when you generate product pages, entire store experiences, and other AI features. Larger packs usually offer a lower cost per credit.{"\n"}
            </>
        ),
        icon: CreditCardIcon,
    },
    {
        id: 12,
        category: FAQ_CATEGORIES.BILLING,
        question: "Do credits expire?",
        answer:(
            <>
                Your wallet balance stays with your shop while the app is installed. If you uninstall Kluck, you lose access to the app and wallet until you install again—see the Credits page FAQ for details.
            </>
        ),
        icon: CreditCardIcon,
    },
    {
        id: 13,
        category: FAQ_CATEGORIES.BILLING,
        question: "What happens if I uninstall the app?",
        answer:(
            <>
                Your Kluck-generated pages will <span style={{ fontWeight: "bold" }}>stop working</span> if you uninstall the app. This is because Kluck serves optimized content from our servers to keep your pages fast and high-converting. Make sure you're ready to switch before uninstalling.
            </>
        ),
        icon: CreditCardIcon,
    },
    // Troubleshooting & Publishing
    {
        id: 14,
        category: FAQ_CATEGORIES.TROUBLESHOOTING,
        question: "When I try to see my product page, A popup appears that my theme is locked?",
        answer:(
            <>
                This issue is usually happens when your Shopify Theme is <span style={{ fontWeight: "bold" }}>locked</span> by another app.{"\n\n"} 
                <span style={{ fontWeight: "bold" }}>What causes this?</span> If you've previously installed other page-builder or design apps, they may have locked your current theme. When a theme is locked, Kluck can generate your pages successfully, but you won't be able to see or preview them because the other app is blocking access to your theme{"\n\n"}
                <span style={{ fontWeight: "bold" }}>How to fix this?</span>{"\n"}
                • Go to your Shopify Admin.{"\n"}
                • Click Online Store {'>'} Themes.{"\n"}
                • Check if your current active theme shows as locked when you try to preview it.{"\n"}
                • If it is locked, switch to a standard unlocked theme (like Shopify's free Dawn theme).{"\n"}
                • Return to Kluck and click Publish again.{"\n\n"}

                Your page should now appear and work correctly!.{"\n"}

                <span style={{ fontWeight: "bold" }}>Still having issues?</span> Contact our support team and we'll help you resolve it quickly.{"\n"}


            </>
        ),
        icon: AdjustIcon,
    },
    {
        id: 15,
        category: FAQ_CATEGORIES.TROUBLESHOOTING,
        question: "Why can't I see my published page (or why did it disappear)?",
        answer:(
            <>
                This happens when Kluck's app embed is disabled in your theme.{"\n"} 
                <span style={{ fontWeight: "bold" }}>What causes this?</span> Kluck AI needs to be enabled as an "app embed block" in your Shopify theme to display your product pages and home page. Sometimes this gets accidentally disabled or wasn't turned on during installation.{"\n\n"}

                <span style={{ fontWeight: "bold" }}>How to fix this?</span>{"\n"}
                • Go to your Shopify Admin.{"\n"}
                • Click Online Store {'>'} Themes.{"\n"}
                • On your active theme, click Customize.{"\n"}
                • In the theme editor, click the Theme Settings icon (usually in the top left or sidebar).{"\n"}
                • Scroll down and find App embeds section.{"\n"}
                • Look for Kluck AI - Theme Extension in the list.{"\n"}
                • Toggle the switch to enable Kluck.{"\n"}
                • Click Save in the top right corner.{"\n\n"}


                Your Kluck pages should now be visible on your store!.{"\n"}
            </>
        ),
        icon: AdjustIcon,
    },
];

export default function FAQPage() {
    const [searchParams] = useSearchParams();
    const shop = searchParams.get("shop");
    const { isAuthenticating } = useOutletContext() || {};
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState(FAQ_CATEGORIES.GENERAL);
    const isMobileLayout = useViewportBelowMd();

    usePageTracking();

    const filteredFaqs = useMemo(() => {
        return faqs.filter((faq) => faq.category === selectedCategory);
    }, [selectedCategory]);

    const categories = [
        { id: FAQ_CATEGORIES.GENERAL, label: "General" },
        { id: FAQ_CATEGORIES.CUSTOMIZATION, label: "Features and Customization" },
        { id: FAQ_CATEGORIES.BILLING, label: "Billing & Account" },
        { id: FAQ_CATEGORIES.TROUBLESHOOTING, label: "Troubleshooting" },
    ];
    const selectCategory = useCallback((categoryId) => {
        setSelectedCategory((cur) => (cur === categoryId ? cur : categoryId));
    }, []);

    return (
        <s-page heading="Frequently Asked Questions" inlineSize="large">
            <CreditWalletWidget floating={false} slot="secondary-actions" />
            <div
                style={{
                    maxWidth: "1150px",
                    margin: "0 auto",
                    padding: isMobileLayout ? "12px" : "10px",
                }}
            >
                <BlockStack gap="300">
                    <h4
                        style={{
                            fontFamily:
                                'Baskerville, "Palatino Linotype", Palatino, "Times New Roman", Times, serif',
                            fontSize: "1.75rem",
                            fontWeight: 400,
                            margin: 0,
                            marginBlockEnd: "var(--p-space-500)",
                            color: "#1a1a1a",
                            textAlign: "center",
                        }}
                    >
                        Answer to most of your{" "}
                        <span
                            style={{
                                color: "#2f6f63",
                                fontStyle: "italic",
                                display: "inline-flex",
                                flexDirection: "column",
                                alignItems: "stretch",
                            }}
                        >
                            <span>questions</span>
                            <span
                                style={{
                                    marginTop: 4,
                                    height: 3,
                                    background:
                                        "linear-gradient(to right, rgba(47, 111, 99, 0.95) 0%, rgba(47, 111, 99, 0.5) 45%, rgba(47, 111, 99, 0.1) 100%)",
                                    borderRadius: 999,
                                    width: "100%",
                                }}
                            />
                        </span>
                    </h4>
                    <Box
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            width: "100%",
                        }}
                    >
                        <Box
                            style={{
                                maxWidth: "min(100%, 640px)",
                                ...(isMobileLayout
                                    ? { overflowX: "auto", WebkitOverflowScrolling: "touch" }
                                    : {}),
                            }}
                        >
                            <ButtonGroup variant="segmented" noWrap={isMobileLayout}>
                                {categories.map((category) => (
                                    <Button
                                        key={category.id}
                                        pressed={selectedCategory === category.id}
                                        onClick={() => selectCategory(category.id)}
                                    >
                                        {category.label}
                                    </Button>
                                ))}
                            </ButtonGroup>
                        </Box>
                    </Box>
                    <FaqAccordionList
                        key={selectedCategory}
                        items={filteredFaqs.map((faq) => ({
                            id: String(faq.id),
                            question: faq.question,
                            answer: faq.answer,
                        }))}
                    />

                    <Box
                        style={{ alignSelf: "center", width: "100%", maxWidth: "min(100%, 520px)" }}
                    >
                        <Card roundedAbove="sm" padding="0">
                            <Box background="bg-surface" padding="400">
                                <BlockStack gap="100">
                                    <Text as="h3" variant="headingSm" fontWeight="semibold">
                                        Still have questions?
                                    </Text>
                                    <Text as="p" variant="bodyMd" tone="subdued">
                                        If you can't find the answer you're looking for, please reach out to our support team at growth@kluck.ai. We're here to help!
                                    </Text>
                                </BlockStack>
                            </Box>
                        </Card>
                    </Box>

                    <Box paddingBlockStart="200">
                        {isMobileLayout ? (
                            <Button
                                variant="primary"
                                fullWidth
                                onClick={() =>
                                    navigate(
                                        buildEmbeddedHref("/", searchParams, shop)
                                    )
                                }
                                disabled={isAuthenticating}
                            >
                                Open Dashboard
                            </Button>
                        ) : (
                            <InlineStack align="center" blockAlign="center">
                                <Button
                                    variant="primary"
                                    onClick={() =>
                                        navigate(
                                            buildEmbeddedHref("/", searchParams, shop)
                                        )
                                    }
                                    disabled={isAuthenticating}
                                >
                                    Open Dashboard
                                </Button>
                            </InlineStack>
                        )}
                    </Box>
                </BlockStack>
            </div>
        </s-page>
    );
}

export function ErrorBoundary() {
    return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
    return boundary.headers(headersArgs);
};
