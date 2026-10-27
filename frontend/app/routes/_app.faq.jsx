import { useState, useMemo, useCallback } from "react";
import { useRouteError, useOutletContext, useNavigate, useSearchParams } from "react-router";
import { buildEmbeddedHref } from "../lib/embeddedNavigation";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Check, CircleHelp, Copy, CreditCard, Mail, Palette, Sparkles, Wrench } from "lucide-react";
import { SettingsIcon, CreditCardIcon, EditIcon, AdjustIcon } from "@shopify/polaris-icons";
import { FaqAccordionList } from "../components/FaqAccordionList";
import { usePageTracking } from "../hooks/usePageTracking";
import { useViewportBelowMd } from "../hooks/useViewportBelowMd";
import { CreditWalletWidget } from "../components/CreditWalletWidget";
import { GradientText, SecondaryButton, StepFrame } from "../components/RoarrUI";

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
        question: "How does Roarr create my page?",
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
        question: "Do I need coding skills to use Roarr?",
        answer: "No, everything is automated with Roarr, so no-coding or designing skills are required.",
        icon: SettingsIcon,
    },
    {
        id: 5,
        category: FAQ_CATEGORIES.GENERAL,
        question: "Will Roarr slow down my store?",
        answer: "No, not at all. After rigorous testing we have made Roarr generated stores and product pages to load fast and even improve your SEO.",
        icon: SettingsIcon,
    },
    {
        id: 6,
        category: FAQ_CATEGORIES.GENERAL,
        question: "What can Roarr create for me?",
        answer: (
            <>
                Roarr creates two types of pages:{"\n"}
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
            "Yes! After Roarr generates your page, you can edit the text, regenerate images, and adjust the styling in our editor. Once you publish, you can also make unlimited changes using Shopify's Theme Editor anytime. ",
        icon: EditIcon,
    },
    {
        id: 8,
        category: FAQ_CATEGORIES.CUSTOMIZATION,
        question: "Will the page match my current Shopify theme?",
        answer:
            "Roarr uses specially designed templates that are built to maximize sales. These templates have their own styling (like sticky 'Add to Cart' buttons and trust badges) to ensure everything works perfectly for conversions.",
        icon: EditIcon,
    },
    {
        id: 9,
        category: FAQ_CATEGORIES.CUSTOMIZATION,
        question: "Why do Roarr pages convert better?",
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
                You can install Roarr and explore the app; AI generation uses <span style={{ fontWeight: "bold" }}>credits</span> from your wallet. Buy credit packs when you&apos;re ready to run full generations.{"\n"}
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
                Roarr is <span style={{ fontWeight: "bold" }}>credit-based</span>. You purchase credit packs in the app and spend credits when you generate product pages, entire store experiences, and other AI features. Larger packs usually offer a lower cost per credit.{"\n"}
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
                Your wallet balance stays with your shop while the app is installed. If you uninstall Roarr, you lose access to the app and wallet until you install again—see the Credits page FAQ for details.
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
                Your Roarr-generated pages will <span style={{ fontWeight: "bold" }}>stop working</span> if you uninstall the app. This is because Roarr serves optimized content from our servers to keep your pages fast and high-converting. Make sure you're ready to switch before uninstalling.
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
                <span style={{ fontWeight: "bold" }}>What causes this?</span> If you've previously installed other page-builder or design apps, they may have locked your current theme. When a theme is locked, Roarr can generate your pages successfully, but you won't be able to see or preview them because the other app is blocking access to your theme{"\n\n"}
                <span style={{ fontWeight: "bold" }}>How to fix this?</span>{"\n"}
                • Go to your Shopify Admin.{"\n"}
                • Click Online Store {'>'} Themes.{"\n"}
                • Check if your current active theme shows as locked when you try to preview it.{"\n"}
                • If it is locked, switch to a standard unlocked theme (like Shopify's free Dawn theme).{"\n"}
                • Return to Roarr and click Publish again.{"\n\n"}

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
                This happens when Roarr's app embed is disabled in your theme.{"\n"} 
                <span style={{ fontWeight: "bold" }}>What causes this?</span> Roarr needs to be enabled as an "app embed block" in your Shopify theme to display your product pages and home page. Sometimes this gets accidentally disabled or wasn't turned on during installation.{"\n\n"}

                <span style={{ fontWeight: "bold" }}>How to fix this?</span>{"\n"}
                • Go to your Shopify Admin.{"\n"}
                • Click Online Store {'>'} Themes.{"\n"}
                • On your active theme, click Customize.{"\n"}
                • In the theme editor, click the Theme Settings icon (usually in the top left or sidebar).{"\n"}
                • Scroll down and find App embeds section.{"\n"}
                • Look for Roarr - Theme Extension in the list.{"\n"}
                • Toggle the switch to enable Roarr.{"\n"}
                • Click Save in the top right corner.{"\n\n"}


                Your Roarr pages should now be visible on your store!.{"\n"}
            </>
        ),
        icon: AdjustIcon,
    },
];

const CATEGORY_TABS = [
    { id: FAQ_CATEGORIES.GENERAL, label: "General", icon: Sparkles },
    { id: FAQ_CATEGORIES.CUSTOMIZATION, label: "Features and Customization", icon: Palette },
    { id: FAQ_CATEGORIES.BILLING, label: "Billing & Account", icon: CreditCard },
    { id: FAQ_CATEGORIES.TROUBLESHOOTING, label: "Troubleshooting", icon: Wrench },
];

const SUPPORT_EMAIL = "fynktech1@gmail.com";
// Gmail compose opens in a browser tab with no mail app set up (a bare mailto link is blocked in the
// Shopify admin iframe and leaves a blank tab when no handler is registered).
const SUPPORT_COMPOSE_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}&su=${encodeURIComponent("Roarr support")}`;

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

    const selectCategory = useCallback((categoryId) => {
        setSelectedCategory((cur) => (cur === categoryId ? cur : categoryId));
    }, []);

    const [copied, setCopied] = useState(false);
    // Copying the address always works, so it backs up the Gmail link for people who use another
    // mail provider.
    const copyEmail = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(SUPPORT_EMAIL);
        } catch {
            const field = document.createElement("textarea");
            field.value = SUPPORT_EMAIL;
            field.style.position = "fixed";
            field.style.opacity = "0";
            document.body.appendChild(field);
            field.select();
            try {
                document.execCommand("copy");
            } finally {
                document.body.removeChild(field);
            }
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    const openDashboard = () => navigate(buildEmbeddedHref("/", searchParams, shop));

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
                <div className="flex flex-col gap-5">
                    <StepFrame>
                        <div className="flex flex-col items-center text-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#1e40af] ring-1 ring-inset ring-blue-200">
                                <CircleHelp size={14} aria-hidden />
                                Help center
                            </span>
                            <h1
                                className="m-0 mt-3 font-bold leading-[1.15] tracking-tight text-slate-900"
                                style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)" }}
                            >
                                Answers to most of your <GradientText>questions</GradientText>
                            </h1>
                            <p className="m-0 mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                                Quick answers about creating pages, customizing them, billing and
                                publishing.
                            </p>

                            <div
                                role="tablist"
                                aria-label="FAQ categories"
                                className="mt-5 flex max-w-full gap-1 overflow-x-auto rounded-full bg-white/90 p-1 shadow-sm ring-1 ring-slate-200/70"
                            >
                                {CATEGORY_TABS.map(({ id, label, icon: TabIcon }) => {
                                    const active = selectedCategory === id;
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => selectCategory(id)}
                                            className={`inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] ${
                                                active
                                                    ? "bg-[#1e3a8a] text-white shadow-[0_8px_18px_-10px_rgba(30,58,138,0.8)]"
                                                    : "text-slate-600 hover:bg-blue-50 hover:text-[#1e3a8a]"
                                            }`}
                                        >
                                            <TabIcon size={15} aria-hidden />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </StepFrame>

                    <FaqAccordionList
                        key={selectedCategory}
                        items={filteredFaqs.map((faq) => ({
                            id: String(faq.id),
                            question: faq.question,
                            answer: faq.answer,
                        }))}
                    />

                    <section className="relative mx-auto w-full max-w-[860px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3a8a] via-[#3b3fc4] to-[#7c3aed] p-5 text-white shadow-[0_24px_48px_-30px_rgba(30,58,138,0.9)] sm:p-6">
                        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-fuchsia-400/30 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-sky-300/25 blur-3xl" />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3.5">
                                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25">
                                    <Mail size={20} aria-hidden />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="m-0 text-base font-semibold">Still have questions?</h3>
                                    <p className="m-0 mt-1 text-[13px] leading-relaxed text-white/80">
                                        Can&apos;t find the answer you&apos;re looking for? Our support team at{" "}
                                        <span className="font-semibold text-white">{SUPPORT_EMAIL}</span> is here to help.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-none flex-col gap-2 sm:flex-row">
                                <a
                                    href={SUPPORT_COMPOSE_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#1e3a8a] no-underline shadow-sm transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#3b3fc4]"
                                >
                                    <Mail size={15} aria-hidden />
                                    Email support
                                </a>
                                <button
                                    type="button"
                                    onClick={copyEmail}
                                    aria-live="polite"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/30 transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                >
                                    {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
                                    {copied ? "Copied" : "Copy email"}
                                </button>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-center">
                        <SecondaryButton
                            onClick={openDashboard}
                            disabled={isAuthenticating}
                            className={isMobileLayout ? "w-full" : ""}
                        >
                            Open Dashboard
                        </SecondaryButton>
                    </div>
                </div>
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
