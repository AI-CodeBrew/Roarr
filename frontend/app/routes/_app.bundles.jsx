import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import {
  useFetcher,
  useLoaderData,
  useRevalidator,
  useOutletContext,
  useBlocker,
} from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { BookOpen, Boxes, Plus } from "lucide-react";
import BundleList from "./_app.bundles/BundleList";
import { v4 as uuidv4 } from "uuid";
import { Modal, BlockStack, Text, Spinner, Box } from "@shopify/polaris";
import { bundlesLoader } from "./_app.bundles/bundlesLoader.server";
import { bundlesAction } from "./_app.bundles/bundlesAction.server";
import { usePageTracking } from "../hooks/usePageTracking";
import { usePosthogAfterIdentify } from "../lib/PosthogIdentityContext";
import { useViewportBelowMd } from "../hooks/useViewportBelowMd";
import { CreditWalletWidget } from "../components/CreditWalletWidget";
import {
  BackButton,
  GradientText,
  Panel,
  PrimaryButton,
  StepFrame,
} from "../components/RoarrUI";

const BundleForm = lazy(() => import("./_app.bundles/BundleForm"));

const ADD_TO_STORE_STEPS = [
  <>
    Make sure the <strong>Roarr</strong> app embed is enabled for your theme (Online Store → Themes
    → Customize → App embeds).
  </>,
  <>Open the section where you want the bundle to appear.</>,
  <>
    Click <strong>Apps</strong>, search for <strong>Roarr Bundler</strong>, and add the block.
  </>,
];

export const loader = bundlesLoader;
export const action = bundlesAction;

export default function BundlesPage() {
  const {
    bundles,
    variants,
    products,
    themeEditorUrl,
    shop,
  } = useLoaderData();
  const { isAuthenticating } = useOutletContext() || {};
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const shopify = useAppBridge();

  usePageTracking();
  const [showForm, setShowForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState(null);
  const [submitAction, setSubmitAction] = useState("exit");
  const [toastError, setToastError] = useState(null);
  const [toastSuccess, setToastSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [bundleFormIsDirty, setBundleFormIsDirty] = useState(false);
  const isLoading = ["loading", "submitting"].includes(fetcher.state);
  const prevFetcherStateRef = useRef(fetcher.state);
  const hasRevalidatedRef = useRef(false);
  const pendingIntentRef = useRef(null);
  const pendingStatusToastRef = useRef(null);
  const posthog = usePosthogAfterIdentify();
  const isMobileLayout = useViewportBelowMd();

  const promptBundleSaveBar = useCallback(() => {
    const saveBar = shopify?.saveBar;
    if (saveBar?.leaveConfirmation) {
      void saveBar.leaveConfirmation().catch(() => {});
      return;
    }
    void saveBar?.show?.("bundle-contextual-save-bar")?.catch?.(() => {});
  }, [shopify]);

  useEffect(() => {
    if (!showForm) setBundleFormIsDirty(false);
  }, [showForm]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      showForm &&
      bundleFormIsDirty &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    promptBundleSaveBar();
    blocker.reset();
  }, [blocker.state, blocker, promptBundleSaveBar]);

  // Revalidate data after successful actions
  useEffect(() => {
    const prevState = prevFetcherStateRef.current;
    const currentState = fetcher.state;

    // Reset submission states when fetcher completes (idle after submitting/loading)
    if (
      currentState === "idle" &&
      (prevState === "submitting" || prevState === "loading")
    ) {
      setIsSubmitting(false);
      setIsTogglingStatus(false);
    }

    // Only revalidate when transitioning from submitting/loading to idle with success
    if (
      fetcher.data?.success &&
      currentState === "idle" &&
      (prevState === "submitting" || prevState === "loading") &&
      !hasRevalidatedRef.current
    ) {
      hasRevalidatedRef.current = true;

      // If toggle-status was successful and we're editing a bundle, update the editingBundle state
      if (
        fetcher.data?.bundle &&
        editingBundle &&
        editingBundle.id === fetcher.data.bundle.id
      ) {
        setEditingBundle((prev) =>
          prev ? { ...prev, isActive: fetcher.data.bundle.isActive } : null,
        );
      }

      revalidator.revalidate();
    }

    if (
      fetcher.data?.success &&
      currentState === "idle" &&
      (prevState === "submitting" || prevState === "loading")
    ) {
      if (pendingIntentRef.current === "create") {
        setToastSuccess("Bundle Created Successfully!");
      } else if (pendingIntentRef.current === "update") {
        setToastSuccess("Bundle Updated Successfully");
      } else if (pendingIntentRef.current === "delete") {
        const bundleName = pendingStatusToastRef.current?.name || "Bundle";
        setToastSuccess(`${bundleName} deleted successfully`);
      } else if (pendingIntentRef.current === "toggle-status") {
        const bundleName =
          pendingStatusToastRef.current?.name ||
          fetcher.data?.bundle?.name ||
          "Bundle";
        const isPublished =
          pendingStatusToastRef.current?.isActive ??
          fetcher.data?.bundle?.isActive;
        const statusText = isPublished ? "published" : "draft";
        setToastSuccess(`${bundleName} status has been set to ${statusText}`);
      }
      pendingIntentRef.current = null;
      pendingStatusToastRef.current = null;
    }

    // Reset the flag when a new submission starts
    if (currentState === "submitting" || currentState === "loading") {
      hasRevalidatedRef.current = false;
    }

    prevFetcherStateRef.current = currentState;
  }, [fetcher.data, fetcher.state, editingBundle]);

  useEffect(() => {
    if (!toastError) return;
    shopify?.toast?.show(toastError, { isError: true, duration: 5000 });
    setToastError(null);
  }, [toastError, shopify]);

  useEffect(() => {
    if (!toastSuccess) return;
    shopify?.toast?.show(toastSuccess, { duration: 3500 });
    setToastSuccess(null);
  }, [toastSuccess, shopify]);

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      // Build bundle data for API call
      const bundleId = editingBundle?.id || uuidv4();
      const bundleData = {
        id: bundleId,
        bundleId: bundleId,
        name: formData.name,
        description: formData.description || null,
        type: formData.bundleType,
        productSelectionType: formData.productSelectionType || "include",
        productIds:
          formData.productSelectionType === "global"
            ? []
            : formData.productIds || [],
        sectionHeader: formData.sectionHeader,
        isActive: formData.isActive !== undefined ? formData.isActive : false,
        allowVariantSelection:
          formData.allowVariantSelection !== undefined
            ? formData.allowVariantSelection
            : false,
        styleSettings: formData.styleSettings || null,
        quantityDiscountTiers: formData.quantityDiscountTiers || [],
        upsellItems: formData.upsellItems || [],
        createdAt: editingBundle?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Call Python backend API
      const apiRoute = editingBundle
        ? `/api/update-bundle`
        : `/api/create-bundle`;
      const apiMethod = editingBundle ? "PUT" : "POST";

      const apiResponse = await fetch(apiRoute, {
        method: apiMethod,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bundleData),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("[BundlesPage] API error:", errorData);
        setToastError(
          errorData.error ||
          `Failed to ${editingBundle ? "update" : "create"} bundle`,
        );
        setIsSubmitting(false);
        return;
      }

      await apiResponse.json();

      // After successful API call, submit to form action for Shopify metafield save
      const form = new FormData();
      form.append("intent", editingBundle ? "update" : "create");

      if (editingBundle?.id) {
        form.append("bundleId", editingBundle.id);
      } else {
        form.append("bundleId", bundleId);
      }

      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("mainProductIds", JSON.stringify(formData.productIds || []));
      form.append("bundleType", formData.bundleType);
      form.append(
        "productSelectionType",
        formData.productSelectionType || "include",
      );
      form.append("upsellItems", JSON.stringify(formData.upsellItems));
      form.append(
        "quantityDiscountTiers",
        JSON.stringify(formData.quantityDiscountTiers),
      );
      form.append(
        "sectionHeader",
        formData.sectionHeader,
      );
      form.append(
        "isActive",
        formData.isActive !== undefined
          ? formData.isActive.toString()
          : "false",
      );
      form.append(
        "allowVariantSelection",
        formData.allowVariantSelection !== undefined
          ? formData.allowVariantSelection.toString()
          : "false",
      );
      if (formData.styleSettings) {
        form.append("styleSettings", JSON.stringify(formData.styleSettings));
      }

      pendingIntentRef.current = editingBundle ? "update" : "create";
      fetcher.submit(form, { method: "POST" });

      // Close form and return to list
      setShowForm(false);
      setEditingBundle(null);
      // Note: isSubmitting will be reset when fetcher completes (see useEffect)
    } catch (err) {
      console.error("[BundlesPage] Error in handleSubmit:", err.message);
      setToastError(`Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    void shopify?.saveBar?.hide("bundle-contextual-save-bar")?.catch?.(() => {});
    setShowForm(false);
    setEditingBundle(null);
  };

  const handleBackFromBundleForm = () => {
    if (isLoading || isAuthenticating || isSubmitting || isTogglingStatus) {
      return;
    }
    if (bundleFormIsDirty) {
      promptBundleSaveBar();
      return;
    }
    handleCancel();
  };

  const handleEdit = (bundle) => {
    setEditingBundle(bundle);
    setShowForm(true);
  };

  const handleDelete = (bundle) => {
    setBundleToDelete(bundle);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!bundleToDelete) return;

    try {
      // Call Python backend API
      const apiResponse = await fetch(`/api/delete-bundle`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: bundleToDelete.id }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("[BundlesPage] API error:", errorData);
        setShowDeleteConfirm(false);
        setBundleToDelete(null);
      } else {
        await apiResponse.json();
      }

      // After successful API call, submit to form action for Shopify metafield delete
      const form = new FormData();
      form.append("intent", "delete");
      if (bundleToDelete.id) {
        form.append("bundleId", bundleToDelete.id);
      }
      pendingIntentRef.current = "delete";
      pendingStatusToastRef.current = {
        name: bundleToDelete.name,
      };
      fetcher.submit(form, { method: "POST" });

      setShowDeleteConfirm(false);
      setBundleToDelete(null);
    } catch (err) {
      console.error("[BundlesPage] Error in confirmDelete:", err.message);
      // alert(`Error: ${err.message}`);
      setShowDeleteConfirm(false);
      setBundleToDelete(null);
    }
  };

  const handleToggleStatus = async (bundle, isActive) => {
    setIsTogglingStatus(true);
    try {
      // Build bundle data with updated isActive status
      const bundleData = {
        id: bundle.id,
        bundleId: bundle.id,
        name: bundle.name,
        description: bundle.description || null,
        type: bundle.type,
        productSelectionType: bundle.productSelectionType || "include",
        productIds: bundle.productIds || [],
        sectionHeader: bundle.sectionHeader,
        isActive: isActive,
        allowVariantSelection:
          bundle.allowVariantSelection !== undefined
            ? bundle.allowVariantSelection
            : false,
        styleSettings: bundle.styleSettings || null,
        quantityDiscountTiers: bundle.quantityDiscountTiers || [],
        upsellItems: bundle.upsellItems || [],
        createdAt: bundle.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Call Python backend API
      const apiResponse = await fetch(`/api/update-bundle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bundleData),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error("[BundlesPage] API error:", errorData);
        setToastError(
          errorData.error ||
          `Failed to ${isActive ? "activate" : "deactivate"} bundle`,
        );
        setIsTogglingStatus(false);
        return;
      }
      posthog?.capture('bundle_toggled', {
        bundle_id: bundle.id,
        enabled: isActive,
      })

      if (isActive) {
        posthog?.setPersonProperties({ bundle_enabled: true })
      } else {
        const anyOtherActive = bundles.some(
          (b) => b.id !== bundle.id && b.isActive,
        )
        console.log('anyOtherActive', anyOtherActive);
        if (!anyOtherActive) {
          posthog?.setPersonProperties({ bundle_enabled: false })
        }
        else {
          posthog?.setPersonProperties({ bundle_enabled: true })
        }
      }

      const apiData = await apiResponse.json();

      // After successful API call, submit to form action for Shopify metafield update
      const form = new FormData();
      form.append("intent", "toggle-status");
      if (bundle.id) {
        form.append("bundleId", bundle.id);
      }
      form.append("isActive", isActive.toString());
      pendingIntentRef.current = "toggle-status";
      pendingStatusToastRef.current = {
        name: bundle.name,
        isActive,
      };
      fetcher.submit(form, { method: "POST" });
      // Note: isTogglingStatus will be reset when fetcher completes (see useEffect)
    } catch (err) {
      console.error("[BundlesPage] Error in handleToggleStatus:", err.message);
      setToastError(`Error: ${err.message}`);
      setIsTogglingStatus(false);
    }
  };

  return (

    <s-page heading="Product Bundles" inlineSize="large">
      <CreditWalletWidget floating={false} slot="secondary-actions" />
      {showForm ? (
        <>
          {editingBundle && (
            <s-button
              slot="secondary-actions"
              variant={editingBundle.isActive ? "secondary" : "primary"}
              onClick={() => {
                if (isAuthenticating || isTogglingStatus) return;
                if (bundleFormIsDirty) {
                  promptBundleSaveBar();
                  return;
                }
                handleToggleStatus(editingBundle, !editingBundle.isActive);
              }}
              disabled={isLoading || isAuthenticating || isTogglingStatus}
            >
              {editingBundle.isActive ? "Unpublish" : "Publish"}
            </s-button>
          )}
        </>
      ) : null}

      <div
        className="roarr-theme"
        style={{
          maxWidth: "1150px",
          margin: "0 auto",
          padding: isMobileLayout ? "12px" : "10px",
        }}
      >
      <div className="flex flex-col gap-5">
        {showForm && (
          <StepFrame compact>
            <div className="flex items-center gap-3">
              <BackButton
                onClick={handleBackFromBundleForm}
                disabled={
                  isLoading ||
                  isAuthenticating ||
                  isSubmitting ||
                  isTogglingStatus
                }
              />
              <span aria-hidden className="hidden h-8 w-px bg-blue-200 sm:block" />
              <h1 className="m-0 text-xl font-bold leading-tight tracking-tight text-slate-900">
                <GradientText>{editingBundle ? "Edit bundle" : "Create bundle"}</GradientText>
              </h1>
            </div>
          </StepFrame>
        )}
        {!showForm && (
          <StepFrame compact>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white text-[#1e40af] shadow-sm ring-1 ring-blue-100">
                  <Boxes size={22} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h1 className="m-0 text-[1.4rem] font-bold leading-tight tracking-tight text-slate-900 sm:text-[1.65rem]">
                    <GradientText>Bundles</GradientText>
                  </h1>
                  <p className="m-0 mt-0.5 text-sm text-slate-600">
                    Creating bundles is the right thing to do, to increase AOV!
                  </p>
                </div>
              </div>
              <PrimaryButton
                className={isMobileLayout ? "w-full" : ""}
                onClick={() => {
                  if (isAuthenticating || isSubmitting || isTogglingStatus) return;
                  setShowForm(true);
                  setEditingBundle(null);
                }}
                disabled={
                  isAuthenticating ||
                  isSubmitting ||
                  isTogglingStatus ||
                  isLoading
                }
              >
                <Plus size={16} aria-hidden />
                Create bundle
              </PrimaryButton>
            </div>
          </StepFrame>
        )}

      {/* {themeEditorUrl && (
        <s-button
          slot="secondary-actions"
          variant="secondary"
          onClick={() => {
            window.open(themeEditorUrl, "_blank");
          }}
        >
          Add Bundle Block to Product Page
        </s-button>
      )} */}

      {showForm && (
        <Suspense
          fallback={
            <Box paddingBlockStart="400">
              <BlockStack gap="200" align="center">
                <Spinner size="large" />
                <Text as="p" variant="bodyMd" tone="subdued">
                  Loading bundle editor...
                </Text>
              </BlockStack>
            </Box>
          }
        >
          <BundleForm
            editingBundle={editingBundle}
            variants={variants}
            products={products}
            onSubmit={(formData) => handleSubmit(formData, submitAction)}
            onCancel={handleCancel}
            onDirtyChange={setBundleFormIsDirty}
            isLoading={isLoading || isSubmitting || isTogglingStatus}
          />
        </Suspense>
      )}

      {!showForm && (
        <>
          <BundleList
            bundles={bundles}
            products={products}
            onEdit={handleEdit}
            onDelete={(bundle) => handleDelete(bundle)}
            onToggleStatus={handleToggleStatus}
            isLoading={isLoading}
            isAuthenticating={isAuthenticating}
            onCreate={() => {
              if (isAuthenticating || isSubmitting || isTogglingStatus) return;
              setShowForm(true);
              setEditingBundle(null);
            }}
          />
          <Panel
            icon={BookOpen}
            title="How to add a bundle to your store"
            description="After you create a bundle, add it in the theme editor:"
          >
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {ADD_TO_STORE_STEPS.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#1e3a8a] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="m-0 text-sm leading-relaxed text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </>
      )}
      </div>
      </div>

      {/* Delete Bundle Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setBundleToDelete(null);
        }}
        title="Delete Bundle"
        primaryAction={{
          content:
            isAuthenticating || fetcher.state === "submitting" ? (
              <div className="flex items-center gap-2">
                <Spinner size="small" />
                <span>Deleting...</span>
              </div>
            ) : (
              "Delete Bundle"
            ),
          onAction: () => {
            if (isAuthenticating) return;
            confirmDelete();
          },
          destructive: true,
          loading: fetcher.state === "submitting" || isAuthenticating,
          disabled: fetcher.state === "submitting" || isAuthenticating,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              if (isAuthenticating) return;
              setShowDeleteConfirm(false);
              setBundleToDelete(null);
            },
            disabled: fetcher.state === "submitting" || isAuthenticating,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" variant="bodyMd">
              Are you sure you want to delete the bundle "
              {bundleToDelete?.name}"?
            </Text>
            <Text as="p" variant="bodyMd" tone="critical">
              <strong>Warning:</strong> This action cannot be undone. The
              bundle will be permanently removed.
            </Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </s-page>

  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
