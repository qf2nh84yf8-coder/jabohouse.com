const navToggle = document.querySelector("[data-nav-toggle]");
const siteNav = document.querySelector("[data-site-nav]");
const productFilm = document.querySelector("[data-product-film]");
const productFilmIframe = document.querySelector("[data-product-film-iframe]");
const productFilmToggle = document.querySelector("[data-product-film-toggle]");
const productFilmFullscreen = document.querySelector("[data-product-film-fullscreen]");
const ambienceAudio = document.querySelector("[data-ambience-audio]");
const ambienceToggle = document.querySelector("[data-audio-toggle]");
const ambienceLabel = document.querySelector("[data-audio-label]");
const floatingAmbienceToggle = document.querySelector("[data-floating-audio-toggle]");
const heroLogoAnimation = document.querySelector("[data-hero-logo-animation]");
const heroLogoVideo = document.querySelector("[data-hero-logo-video]");
const heroLogoIos = document.querySelector("[data-hero-logo-ios]");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const AMBIENCE_VOLUME = 0.3;
const HERO_LOGO_ANIMATION_MS = 4100;
const IOS_LOGO_FRAME_DURATION_MS = 125;
const IOS_LOGO_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const ambienceUnlockEvents = ["pointerdown", "keydown", "touchstart"];
const forceIosLogoPreview = new URLSearchParams(window.location.search).has("ios-logo-preview");
const isIOSDevice =
  forceIosLogoPreview ||
  /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
  (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
let ambienceUserDisabled = false;
let heroLogoIosCompleteTimer;
let heroLogoIosFrameTimer;
let heroLogoIosPreloadedFrames = [];

function setFloatingAmbienceButton(isAudible) {
  if (!floatingAmbienceToggle) return;

  floatingAmbienceToggle.hidden = !isAudible;
  floatingAmbienceToggle.classList.toggle("is-visible", isAudible);
}

function setAmbienceButton(isAudible) {
  if (!ambienceToggle || !ambienceLabel) return;

  ambienceToggle.setAttribute("aria-pressed", String(isAudible));
  ambienceToggle.setAttribute(
    "aria-label",
    isAudible ? "Mute jungle ambience" : "Play jungle ambience"
  );
  ambienceLabel.textContent = isAudible ? "Mute" : "Sound";
  setFloatingAmbienceButton(isAudible);
}

function playAmbience() {
  if (!ambienceAudio) return;

  ambienceAudio.volume = AMBIENCE_VOLUME;
  ambienceAudio.muted = false;

  const playAttempt = ambienceAudio.play();
  if (playAttempt) {
    playAttempt
      .then(() => {
        removeAmbienceUnlockListeners();
        setAmbienceButton(true);
      })
      .catch(() => setAmbienceButton(false));
  }
}

function muteAmbience() {
  if (!ambienceAudio) return;

  ambienceUserDisabled = true;
  ambienceAudio.muted = true;
  setAmbienceButton(false);
}

function addAmbienceUnlockListeners() {
  ambienceUnlockEvents.forEach((eventName) => {
    window.addEventListener(eventName, unlockAmbienceOnInteraction, {
      once: true,
      passive: true,
    });
  });
}

function removeAmbienceUnlockListeners() {
  ambienceUnlockEvents.forEach((eventName) => {
    window.removeEventListener(eventName, unlockAmbienceOnInteraction);
  });
}

function unlockAmbienceOnInteraction() {
  if (ambienceUserDisabled) return;

  playAmbience();
}

if (ambienceAudio) {
  ambienceAudio.volume = AMBIENCE_VOLUME;
  setAmbienceButton(false);
  addAmbienceUnlockListeners();
  window.addEventListener("load", playAmbience, { once: true });
}

ambienceToggle?.addEventListener("click", () => {
  if (!ambienceAudio) return;

  const shouldPlay = ambienceAudio.paused || ambienceAudio.muted;
  if (shouldPlay) {
    ambienceUserDisabled = false;
    playAmbience();
  } else {
    muteAmbience();
  }
});

floatingAmbienceToggle?.addEventListener("click", muteAmbience);

function showStillHeroLogo() {
  if (!heroLogoAnimation) return;

  window.clearTimeout(heroLogoIosCompleteTimer);
  window.clearTimeout(heroLogoIosFrameTimer);
  heroLogoVideo?.pause();
  heroLogoAnimation.classList.remove("is-playing");
  heroLogoAnimation.classList.add("is-complete");
}

function revealHeroLogoVideo() {
  if (!heroLogoAnimation || !heroLogoVideo) return;

  window.requestAnimationFrame(() => {
    heroLogoAnimation.classList.add("is-playing");
  });
}

function getIosHeroLogoFrameCount() {
  return Number.parseInt(heroLogoIos?.dataset.heroLogoIosFrameCount || "0", 10);
}

function getIosHeroLogoFrameUrl(frameIndex) {
  const template = heroLogoIos?.dataset.heroLogoIosFrameTemplate;
  if (!template) return "";

  return template.replace("{frame}", String(frameIndex + 1).padStart(3, "0"));
}

function preloadIosHeroLogoFrames() {
  const frameCount = getIosHeroLogoFrameCount();
  if (!frameCount || heroLogoIosPreloadedFrames.length === frameCount) return;

  heroLogoIosPreloadedFrames = Array.from({ length: frameCount }, (_, frameIndex) => {
    const frame = new Image();
    frame.decoding = "async";
    frame.src = getIosHeroLogoFrameUrl(frameIndex);
    return frame;
  });
}

function playIosHeroLogoAnimation() {
  const frameCount = getIosHeroLogoFrameCount();
  if (!heroLogoAnimation || !heroLogoIos || !frameCount || !getIosHeroLogoFrameUrl(0)) return false;

  heroLogoVideo?.pause();
  window.clearTimeout(heroLogoIosCompleteTimer);
  window.clearTimeout(heroLogoIosFrameTimer);
  heroLogoAnimation.classList.add("is-ios");
  heroLogoAnimation.classList.remove("is-playing", "is-complete", "is-reduced", "is-unavailable");
  heroLogoIos.src = IOS_LOGO_PLACEHOLDER;
  preloadIosHeroLogoFrames();

  let frameIndex = 0;

  window.requestAnimationFrame(() => {
    heroLogoAnimation.classList.add("is-playing");

    function showNextFrame() {
      if (frameIndex >= frameCount) {
        showStillHeroLogo();
        return;
      }

      heroLogoIos.src = getIosHeroLogoFrameUrl(frameIndex);
      frameIndex += 1;
      heroLogoIosFrameTimer = window.setTimeout(showNextFrame, IOS_LOGO_FRAME_DURATION_MS);
    }

    showNextFrame();
    heroLogoIosCompleteTimer = window.setTimeout(showStillHeroLogo, HERO_LOGO_ANIMATION_MS + 250);
  });

  return true;
}

function playHeroLogoAnimation() {
  if (!heroLogoAnimation) return;

  if (reducedMotionQuery.matches) {
    heroLogoAnimation.classList.add("is-reduced");
    showStillHeroLogo();
    return;
  }

  if (isIOSDevice && playIosHeroLogoAnimation()) return;
  if (!heroLogoVideo) return;

  heroLogoAnimation.classList.remove("is-playing", "is-complete", "is-reduced", "is-unavailable");

  try {
    heroLogoVideo.currentTime = 0;
  } catch (error) {
    // Some browsers delay seeking until the video metadata is ready.
  }

  const playAttempt = heroLogoVideo.play();
  if (playAttempt) {
    playAttempt.then(revealHeroLogoVideo).catch(() => {
      heroLogoAnimation.classList.remove("is-playing");
      heroLogoAnimation.classList.add("is-unavailable");
    });
  } else {
    revealHeroLogoVideo();
  }
}

if (heroLogoAnimation && (heroLogoVideo || heroLogoIos)) {
  if (reducedMotionQuery.matches) {
    heroLogoAnimation.classList.add("is-reduced");
  } else {
    if (isIOSDevice) {
      heroLogoAnimation.classList.add("is-ios");
    } else if (heroLogoVideo) {
      heroLogoVideo.addEventListener("ended", showStillHeroLogo);
      heroLogoVideo.addEventListener("error", () => {
        heroLogoAnimation.classList.remove("is-playing");
        heroLogoAnimation.classList.add("is-unavailable");
      });
    }

    if (document.readyState === "complete") {
      playHeroLogoAnimation();
    } else {
      window.addEventListener("load", playHeroLogoAnimation, { once: true });
    }

    let logoWasAwayFromTop = false;
    let scrollTicking = false;

    function watchHeroReturn() {
      scrollTicking = false;
      const isAtTop = window.scrollY < 72;

      if (!isAtTop) {
        logoWasAwayFromTop = true;
        return;
      }

      if (logoWasAwayFromTop) {
        logoWasAwayFromTop = false;
        playHeroLogoAnimation();
      }
    }

    window.addEventListener(
      "scroll",
      () => {
        if (scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(watchHeroReturn);
      },
      { passive: true }
    );
  }
}

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
    if (carouselCaption) carouselCaption.textContent = nextImage.caption;
    if (carouselCount) carouselCount.textContent = `${nextIndex + 1} / ${carouselImages.length}`;
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
  if (carouselCaption) carouselCaption.textContent = nextImage.caption;
  if (carouselCount) carouselCount.textContent = `${nextIndex + 1} / ${carouselImages.length}`;
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
