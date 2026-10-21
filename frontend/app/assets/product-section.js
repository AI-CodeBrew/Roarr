/**
 * Product Section - Thumbnail gallery and main image switcher.
 */
(function () {
  function initProductSection() {
    const mainImage = document.getElementById("main-product-image");
    const thumbnails = document.querySelectorAll(".product-two-panel__thumbnail");
    const next = document.querySelector(".thumb-next");
    const prev = document.querySelector(".thumb-prev");
    const container = document.querySelector(".product-two-panel__thumbnails");

    if (mainImage && thumbnails.length) {
      thumbnails.forEach(function (thumb) {
        thumb.addEventListener("click", function () {
          mainImage.src = thumb.dataset.full || thumb.src;
        });
      });
    }

    if (next && container) {
      next.addEventListener("click", function () {
        container.scrollBy({ left: 100, behavior: "smooth" });
      });
    }
    if (prev && container) {
      prev.addEventListener("click", function () {
        container.scrollBy({ left: -100, behavior: "smooth" });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProductSection);
  } else {
    initProductSection();
  }
  window.initProductSection = initProductSection;
})();
