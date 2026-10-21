/**
 * Premium collection grid — sort, filters, mobile sidebar, AJAX add to cart
 */

(function () {
  "use strict";

  function initPremCollection(root) {
    if (!root || root.dataset.pfPremCollectionInit) return;
    root.dataset.pfPremCollectionInit = "1";

    const sectionId = root.getAttribute("data-section-id");
    if (!sectionId) return;

    const sortSelect = root.querySelector("#SortBy-" + sectionId);
    if (sortSelect) {
      sortSelect.addEventListener("change", function (e) {
        const url = new URL(window.location.href);
        url.searchParams.set("sort_by", e.target.value);
        window.location.href = url.href;
      });
    }

    const filterForm = root.querySelector(".filter-form");
    if (filterForm) {
      filterForm.addEventListener("change", function () {
        const formData = new FormData(filterForm);
        const searchParams = new URLSearchParams(formData);
        const url = new URL(window.location.href);
        if (url.searchParams.has("sort_by")) {
          searchParams.set("sort_by", url.searchParams.get("sort_by"));
        }
        window.location.href = window.location.pathname + "?" + searchParams.toString();
      });
    }

    const openBtn = root.querySelector("#OpenMobileFilters-" + sectionId);
    const closeBtn = root.querySelector("#CloseMobileFilters-" + sectionId);
    const sidebar = root.querySelector("#CollectionSidebar-" + sectionId);
    const overlay = root.querySelector("#SidebarOverlay-" + sectionId);

    if (openBtn && sidebar) {
      openBtn.addEventListener("click", function () {
        sidebar.classList.add("is-open");
        if (overlay) overlay.classList.add("is-active");
        document.body.style.overflow = "hidden";
      });

      function closeSidebar() {
        sidebar.classList.remove("is-open");
        if (overlay) overlay.classList.remove("is-active");
        document.body.style.overflow = "";
      }

      if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
      if (overlay) overlay.addEventListener("click", closeSidebar);
    }

    root.querySelectorAll(".ajax-add-btn").forEach(function (button) {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        const btn = this;
        const variantId = btn.getAttribute("data-variant-id");
        const originalText = btn.innerHTML;
        if (!variantId || !window.Shopify || !window.Shopify.routes) return;

        if (btn.classList.contains("choose-options-btn")) {
          btn.innerHTML = "Adding...";
        } else {
          btn.style.opacity = "0.5";
        }

        const itemsToAdd = [{ id: variantId, quantity: 1 }];

        fetch(window.Shopify.routes.root + "cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsToAdd })
        })
          .then(function (response) {
            return response.json();
          })
          .then(function (data) {
            if (data.status) {
              alert("Error: " + data.description);
              return;
            }
            return fetch(window.location.href);
          })
          .then(function (response) {
            return response && response.text();
          })
          .then(function (html) {
            if (!html) return;
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, "text/html");
            const currentDrawer = document.querySelector("cart-drawer, cart-drawer-component");
            const newDrawer = newDoc.querySelector("cart-drawer, cart-drawer-component");

            if (currentDrawer && newDrawer) {
              currentDrawer.innerHTML = newDrawer.innerHTML;
              currentDrawer.classList.remove("cart-drawer--empty", "is-empty");
              setTimeout(function () {
                if (typeof currentDrawer.open === "function") {
                  currentDrawer.open();
                } else {
                  const dialog = currentDrawer.querySelector("dialog");
                  if (dialog) {
                    dialog.setAttribute("open", "");
                    dialog.classList.add("active");
                  }
                  currentDrawer.classList.add("active", "is-active");
                  document.body.classList.add("overflow-hidden");
                }
              }, 50);
            }

            const currentIcon = document.querySelector("cart-icon-bubble, cart-icon-component");
            const newIcon = newDoc.querySelector("cart-icon-bubble, cart-icon-component");
            if (currentIcon && newIcon) {
              currentIcon.innerHTML = newIcon.innerHTML;
            }
          })
          .catch(function (error) {
            console.error("Error:", error);
          })
          .finally(function () {
            if (btn.classList.contains("choose-options-btn")) {
              btn.innerHTML = "Added!";
              setTimeout(function () {
                btn.innerHTML = originalText;
              }, 2000);
            } else {
              btn.style.opacity = "1";
            }
          });
      });
    });
  }

  function initAll() {
    document.querySelectorAll("[data-prem-collection]").forEach(initPremCollection);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
