const inquiryForm = document.querySelector("#inquiry-form");
const formNote = document.querySelector("#form-note");
const navToggle = document.querySelector("[data-nav-toggle]");
const siteNav = document.querySelector("[data-site-nav]");
const productFilm = document.querySelector("[data-product-film]");
const productFilmIframe = document.querySelector("[data-product-film-iframe]");
const productFilmToggle = document.querySelector("[data-product-film-toggle]");
const productFilmFullscreen = document.querySelector("[data-product-film-fullscreen]");

function closeSiteNav() {
  if (!navToggle || !siteNav) return;

  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation");
  siteNav.removeAttribute("data-open");
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    siteNav.toggleAttribute("data-open", !isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeSiteNav);
  });
}

const carouselImages = [
  {
    src: "assets/images/carousel-04.jpg",
    alt: "Red Jaboticaba tree in a cobalt blue ceramic vessel",
    caption: "Red Jaboticaba in blue ceramic, one specimen available.",
  },
  {
    src: "assets/images/carousel-03.jpg",
    alt: "Close detail of the cobalt blue ceramic pot and Jaboticaba foliage",
    caption: "Cobalt ceramic vessel with approximately 19-inch rim diameter.",
  },
  {
    src: "assets/images/carousel-02.jpg",
    alt: "Jaboticaba fruit growing directly on the branch",
    caption: "Jaboticaba fruit shown for provenance and botanical character.",
  },
  {
    src: "assets/images/carousel-01.jpg",
    alt: "Freshly picked Jaboticaba fruit held in hand",
    caption: "Fruit detail from the Red Jaboticaba specimen.",
  },
  {
    src: "assets/images/carousel-05.jpg",
    alt: "Jaboticaba fruit set along a sunlit branch",
    caption: "Sunlit fruit set along the Red Jaboticaba branch structure.",
  },
  {
    src: "assets/images/carousel-06.jpg",
    alt: "Red Jaboticaba tree shown upright in the blue ceramic vessel",
    caption: "Full specimen view in the cobalt ceramic vessel.",
  },
  {
    src: "assets/images/carousel-07.jpg",
    alt: "Two Jaboticaba fruit held in hand near the foliage",
    caption: "Harvest detail shown against the specimen foliage.",
  },
  {
    src: "assets/images/carousel-08.jpg",
    alt: "Jaboticaba fruit clustered on the trunk in warm light",
    caption: "Fruit clustered directly on the trunk in afternoon light.",
  },
];

const carousel = document.querySelector("[data-carousel]");
const carouselImageElements = [...document.querySelectorAll("[data-carousel-image]")];
const carouselCaption = document.querySelector("[data-carousel-caption]");
const carouselCount = document.querySelector("[data-carousel-count]");
const carouselTrigger = document.querySelector("[data-carousel-trigger]");
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const lightboxCount = document.querySelector("[data-lightbox-count]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxNext = document.querySelector("[data-lightbox-next]");

let activeCarouselIndex = 0;
let activeCarouselSlot = 0;
let carouselTimer;

function updateCarousel(index, options = {}) {
  if (!carousel || carouselImageElements.length < 2) return;

  const nextIndex = (index + carouselImages.length) % carouselImages.length;
  const nextImage = carouselImages[nextIndex];
  const activeImage = carouselImageElements[activeCarouselSlot];

  if (options.instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    activeImage.src = nextImage.src;
    activeImage.alt = nextImage.alt;
    carouselImageElements.forEach((image, slot) => {
      image.classList.toggle("is-active", slot === activeCarouselSlot);
      image.setAttribute("aria-hidden", slot === activeCarouselSlot ? "false" : "true");
    });
    activeCarouselIndex = nextIndex;
    carouselCaption.textContent = nextImage.caption;
    carouselCount.textContent = `${nextIndex + 1} / ${carouselImages.length}`;
    return;
  }

  const nextSlot = activeCarouselSlot === 0 ? 1 : 0;
  const incomingImage = carouselImageElements[nextSlot];

  incomingImage.src = nextImage.src;
  incomingImage.alt = nextImage.alt;
  incomingImage.setAttribute("aria-hidden", "false");
  activeImage.setAttribute("aria-hidden", "true");

  requestAnimationFrame(() => {
    incomingImage.classList.add("is-active");
    activeImage.classList.remove("is-active");
  });

  activeCarouselSlot = nextSlot;
  activeCarouselIndex = nextIndex;
  carouselCaption.textContent = nextImage.caption;
  carouselCount.textContent = `${nextIndex + 1} / ${carouselImages.length}`;
}

function updateLightbox() {
  if (!lightboxImage) return;

  const image = carouselImages[activeCarouselIndex];
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = image.caption;
  lightboxCount.textContent = `${activeCarouselIndex + 1} / ${carouselImages.length}`;
}

function showNextCarouselImage() {
  updateCarousel(activeCarouselIndex + 1);
}

function startCarousel() {
  if (!carousel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.clearInterval(carouselTimer);
  carouselTimer = window.setInterval(showNextCarouselImage, 3500);
}

function stopCarousel() {
  window.clearInterval(carouselTimer);
}

function openLightbox() {
  if (!lightbox) return;

  stopCarousel();
  updateLightbox();
  lightbox.hidden = false;
  document.body.classList.add("lightbox-open");
  lightboxClose.focus();
}

function closeLightbox() {
  if (!lightbox) return;

  lightbox.hidden = true;
  document.body.classList.remove("lightbox-open");
  startCarousel();
  carouselTrigger?.focus();
}

function showNextLightboxImage() {
  updateCarousel(activeCarouselIndex + 1, { instant: true });
  updateLightbox();
}

if (carousel) {
  carouselImages.forEach((image) => {
    const preload = new Image();
    preload.src = image.src;
  });

  updateCarousel(0, { instant: true });
  startCarousel();

  carouselTrigger?.addEventListener("click", openLightbox);

  carousel.addEventListener("mouseenter", stopCarousel);
  carousel.addEventListener("mouseleave", startCarousel);
  carousel.addEventListener("focusin", stopCarousel);
  carousel.addEventListener("focusout", startCarousel);
}

lightboxClose?.addEventListener("click", closeLightbox);
lightboxNext?.addEventListener("click", showNextLightboxImage);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (!lightbox || lightbox.hidden) return;

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowRight") showNextLightboxImage();
});

function controlProductFilm(command, args = []) {
  if (!productFilmIframe?.contentWindow) return;

  productFilmIframe.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: command,
      args,
    }),
    "https://www.youtube.com"
  );
}

function playProductFilm() {
  if (!productFilm || !productFilmIframe) return;

  const filmSource = productFilmIframe.dataset.productFilmSrc;
  if (filmSource && productFilmIframe.getAttribute("src") !== filmSource) {
    productFilmIframe.setAttribute("src", filmSource);
  }

  productFilm.dataset.paused = "false";
  productFilmToggle?.setAttribute("aria-label", "Pause product video");
  controlProductFilm("mute");
  controlProductFilm("playVideo");
}

function pauseProductFilm() {
  if (!productFilm) return;

  productFilm.dataset.paused = "true";
  productFilmToggle?.setAttribute("aria-label", "Play product video");
  controlProductFilm("pauseVideo");
}

if (productFilm && productFilmIframe) {
  productFilm.dataset.ready = "false";
  productFilm.dataset.paused = "true";

  productFilmIframe.addEventListener("load", () => {
    const src = productFilmIframe.getAttribute("src");
    if (src && src !== "about:blank") {
      productFilm.dataset.ready = "true";
      playProductFilm();
    }
  });

  if ("IntersectionObserver" in window) {
    const productFilmObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playProductFilm();
          } else {
            pauseProductFilm();
          }
        });
      },
      { threshold: 0.45 }
    );

    productFilmObserver.observe(productFilm);
  } else {
    playProductFilm();
  }
}

window.addEventListener("message", (event) => {
  if (event.origin !== "https://www.youtube.com") return;

  let message;
  try {
    message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
  } catch {
    return;
  }

  const playerState = message?.info?.playerState ?? message?.info;
  const hasEnded = message?.event === "onStateChange" && playerState === 0;

  if (hasEnded && productFilm?.dataset.paused !== "true") {
    controlProductFilm("seekTo", [0, true]);
    controlProductFilm("playVideo");
  }
});

productFilmToggle?.addEventListener("click", () => {
  const isPaused = productFilm?.dataset.paused === "true";

  if (isPaused) {
    playProductFilm();
  } else {
    pauseProductFilm();
  }
});

productFilmFullscreen?.addEventListener("click", (event) => {
  event.stopPropagation();

  const target = productFilmIframe || productFilm;
  target?.requestFullscreen?.();
});

if (inquiryForm) {
  inquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(inquiryForm);
    const name = data.get("name")?.toString().trim();
    const email = data.get("email")?.toString().trim();
    const zip = data.get("zip")?.toString().trim();
    const preference = data.get("preference")?.toString().trim();
    const message = data.get("message")?.toString().trim();

    const subject = "Jabohouse reservation inquiry";
    const body = [
      "Reservation inquiry for Red Jaboticaba in Blue Ceramic",
      "",
      `Full name: ${name}`,
      `Email address: ${email}`,
      `Delivery ZIP code: ${zip}`,
      `Pickup or delivery preference: ${preference}`,
      "",
      "Message:",
      message,
    ].join("\n");

    // Backend integration note:
    // Replace this mailto fallback with a Cloudflare Pages Function or form service
    // that sends the same fields to troy@JaboHouse.com.
    window.location.href = `mailto:troy@JaboHouse.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    formNote.textContent =
      "Your email app should open with the inquiry details. Please send the draft to complete your request.";
  });
}
