/**
 * pf-new-404 — load animation (is-loaded on .modern-404-root)
 */
function boot() {
    document.querySelectorAll('[id^="Modern404-"] .modern-404-root').forEach((root) => {
        setTimeout(() => {
            root.classList.add("is-loaded");
        }, 100);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}
