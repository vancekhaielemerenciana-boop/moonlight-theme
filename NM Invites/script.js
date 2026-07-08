"use strict";

/*
  script.js — Refactored, fixed and optimized version
  - Structured as an init-driven module
  - Fix: robust loader hide even if 'load' already fired
  - Fix: use ISO date string for countdown target parsing
  - Performance: requestAnimationFrame throttling for mouse/scroll
  - Reduced particle counts to improve performance (visuals preserved)
*/

(function () {
  /* ============================
     Config & Cached constants
     ============================ */
  const PARTICLE_CONFIG = {
    nightStars: 120,    // reduced for perf
    sparklesStatic: 120,
    sparklesFloatingIntervalMs: 220,
    sparklesFloatingKeepMs: 11000,
    shootingIntervalMs: 3500,
    shootingDurationMs: 1800,
    mistLayers: 6,
    goldDust: 60,
    petalIntervalMs: 500,
    petalKeepMs: 12000,
    heroParticles: 40,
    fireflies: 35,
    storyHearts: 26,
    lanterns: 12,
    confetti: 80,
  };

  // Countdown target (ISO-like to avoid inconsistent parsing)
  const COUNTDOWN_ISO = "2027-10-25T16:00:00";

  /* ============================
     State
     ============================ */
  let playingMusic = false;
  let envelopeOpened = false;
  const intervals = new Set();
  const timeouts = new Set();

  /* ============================
     Helpers
     ============================ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const pad = (n) => String(n).padStart(2, "0");

  const safePlay = (audioEl) => {
    if (!audioEl) return;
    audioEl.play().catch(() => {
      // autoplay blocked — fail silently
    });
  };

  const setTimeoutTracked = (fn, ms) => {
    const id = setTimeout(() => {
      timeouts.delete(id);
      fn();
    }, ms);
    timeouts.add(id);
    return id;
  };

  const setIntervalTracked = (fn, ms) => {
    const id = setInterval(fn, ms);
    intervals.add(id);
    return id;
  };

  const clearAllTimers = () => {
    intervals.forEach((id) => clearInterval(id));
    intervals.clear();
    timeouts.forEach((id) => clearTimeout(id));
    timeouts.clear();
  };

  /* ============================
     DOMContentLoaded entry
     ============================ */
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    /* Element refs */
    const intro = $("#intro");
    const envelope = $(".envelope");
    const main = $("#mainContent");
    const bgMusic = $("#bgMusic");
    const musicToggle = $("#musicToggle");
    const openSound = $("#openSound");
    const viewInvitation = $("#viewInvitation");
    const storySection = $("#story");
    const starCanvas = $("#starCanvas");
    const nightSky = $("#nightSky");
    const sparklesContainer = $("#sparkles");
    const shootingContainer = $("#shootingStars");
    const mistContainer = $("#mist");
    const goldDust = $("#goldDust");
    const petals = $("#petals");
    const heroParticles = $(".hero-particles");
    const fireflies = $("#fireflies");
    const storyParticles = $("#storyParticles");
    const lightbox = $("#lightbox");
    const lightboxImage = $("#lightboxImage");
    const prevPhoto = $("#prevPhoto");
    const nextPhoto = $("#nextPhoto");
    const closeLightbox = $("#closeLightbox");
    const form = $("#rsvpForm");
    const modal = $("#successModal");
    const closeModal = $("#closeModal");
    const guestInput = $("#guests");
    const guestNames = $("#guestNames");
    const lanternContainer = $("#lanternContainer");
    const loader = $("#loader");
    const openBtn = $("#openBtn");

    /* ----------------------------
       BIND OPEN/INVITATION
       ---------------------------- */
    const openTargets = [openBtn, envelope, $(".seal")].filter(Boolean);

    function activateOpen(ev) {
  if (ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }

  if (envelopeOpened) return;
  envelopeOpened = true;

  // Determine flap transition duration from CSS (fallback to 1600ms)
  const flapEl = document.querySelector(".flap");
  let flapDurationMs = 1600;
  try {
    if (flapEl) {
      const cs = getComputedStyle(flapEl);
      const raw = (cs.transitionDuration || "").split(",")[0].trim(); // first value if multiple
      if (raw.endsWith("ms")) flapDurationMs = parseFloat(raw);
      else if (raw.endsWith("s")) flapDurationMs = parseFloat(raw) * 1000;
      else {
        const p = parseFloat(raw);
        if (!Number.isNaN(p)) flapDurationMs = p * 1000;
      }
    }
  } catch (err) {
    // keep fallback
  }

  const SAFETY_MARGIN_MS = 80;
  const letterDelay = Math.max(0, flapDurationMs + SAFETY_MARGIN_MS);

  // Ensure clean state, open flap immediately, then add .letter-out after delay
  if (envelope) {
    envelope.classList.remove("letter-out");
    envelope.classList.add("open");
    const addLetterOut = () => envelope.classList.add("letter-out");
    if (typeof setTimeoutTracked === "function") {
      setTimeoutTracked(addLetterOut, letterDelay);
    } else {
      setTimeout(addLetterOut, letterDelay);
    }
  }

  if (openSound) safePlay(openSound);

  if (intro) {
    // staged fade + hide (unchanged timing)
    setTimeout(() => {
      intro.style.opacity = "0";
      intro.style.transition = "1.2s";
    }, 1300);

    setTimeout(() => {
      intro.style.display = "none";
      if (main) {
        main.style.display = "flex";
        main.classList.add("show");
      }
      // ensure scroll restored
      document.body.style.overflowY = "auto";
      document.body.style.overflowX = "hidden";

      if (bgMusic && !playingMusic) {
        safePlay(bgMusic);
        playingMusic = true;
        if (musicToggle) musicToggle.innerHTML = "❚❚";
      }
    }, 2300);
  }
}

    openTargets.forEach((el) => {
      el.addEventListener("click", activateOpen, { passive: false });
      el.addEventListener("touchstart", activateOpen, { passive: true });
    });

    /* ----------------------------
       MUSIC TOGGLE
       ---------------------------- */
    if (musicToggle && bgMusic) {
      musicToggle.addEventListener("click", () => {
        if (playingMusic) {
          bgMusic.pause();
          musicToggle.innerHTML = "♪";
        } else {
          safePlay(bgMusic);
          musicToggle.innerHTML = "❚❚";
        }
        playingMusic = !playingMusic;
      });
    }

    /* ----------------------------
       COUNTDOWN (fixed: ISO date parse)
       ---------------------------- */
    const countdownTarget = new Date(COUNTDOWN_ISO).getTime();

    function updateCountdown() {
      const now = Date.now();
      const distance = countdownTarget - now;
      const daysEl = $("#days");
      const hoursEl = $("#hours");
      const minutesEl = $("#minutes");
      const secondsEl = $("#seconds");
      if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

      if (distance <= 0) {
        daysEl.textContent = "00";
        hoursEl.textContent = "00";
        minutesEl.textContent = "00";
        secondsEl.textContent = "00";
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      daysEl.textContent = pad(days);
      hoursEl.textContent = pad(hours);
      minutesEl.textContent = pad(minutes);
      secondsEl.textContent = pad(seconds);
    }

    updateCountdown();
    setIntervalTracked(updateCountdown, 1000);

    /* ----------------------------
       Intersection Reveal Observer
       ---------------------------- */
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.15 }
    );

    $$("section, .reveal").forEach((el) => {
      revealObserver.observe(el);
    });

    /* ----------------------------
       Night-sky & particles (DOM based)
       Reduced counts for performance
       ---------------------------- */
    // Stars
    if (nightSky) {
      for (let i = 0; i < PARTICLE_CONFIG.nightStars; i++) {
        const star = document.createElement("div");
        star.className = "star";
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDuration = `${2 + Math.random() * 4}s`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        nightSky.appendChild(star);
      }
    }

    // Sparkles static
    if (sparklesContainer) {
      for (let i = 0; i < PARTICLE_CONFIG.sparklesStatic; i++) {
        const s = document.createElement("div");
        s.className = "sparkle";
        const size = Math.random() * 4 + 2;
        s.style.width = `${size}px`;
        s.style.height = `${size}px`;
        s.style.left = `${Math.random() * 100}%`;
        s.style.animationDuration = `${5 + Math.random() * 12}s`;
        s.style.animationDelay = `${Math.random() * 15}s`;
        sparklesContainer.appendChild(s);
      }

      // Floating sparkles
      const createSparkle = () => {
        const sparkle = document.createElement("div");
        sparkle.className = "sparkle";
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.bottom = "-20px";
        sparkle.style.animationDuration = `${5 + Math.random() * 6}s`;
        sparkle.style.opacity = `${0.3 + Math.random() * 0.7}`;
        sparklesContainer.appendChild(sparkle);
        setTimeoutTracked(() => sparkle.remove(), PARTICLE_CONFIG.sparklesFloatingKeepMs);
      };
      setIntervalTracked(createSparkle, PARTICLE_CONFIG.sparklesFloatingIntervalMs);
    }

    // Shooting stars
    if (shootingContainer) {
      const createMeteor = () => {
        const meteor = document.createElement("div");
        meteor.className = "shooting";
        meteor.style.left = `${60 + Math.random() * 40}%`;
        meteor.style.top = `${Math.random() * 35}%`;
        meteor.style.animation = `shooting ${PARTICLE_CONFIG.shootingDurationMs / 1000}s linear forwards`;
        shootingContainer.appendChild(meteor);
        setTimeoutTracked(() => meteor.remove(), PARTICLE_CONFIG.shootingDurationMs);
      };
      setIntervalTracked(createMeteor, PARTICLE_CONFIG.shootingIntervalMs);
    }

    // Mist layers
    if (mistContainer) {
      for (let i = 0; i < PARTICLE_CONFIG.mistLayers; i++) {
        const cloud = document.createElement("div");
        cloud.className = "mistLayer";
        cloud.style.top = `${Math.random() * 100}%`;
        cloud.style.animationDuration = `${25 + Math.random() * 20}s`;
        cloud.style.animationDelay = `${Math.random() * 20}s`;
        mistContainer.appendChild(cloud);
      }
    }

    // Gold dust
    if (goldDust) {
      for (let i = 0; i < PARTICLE_CONFIG.goldDust; i++) {
        const g = document.createElement("div");
        g.className = "gold";
        g.style.left = `${Math.random() * 100}%`;
        g.style.animationDuration = `${6 + Math.random() * 10}s`;
        g.style.animationDelay = `${Math.random() * 10}s`;
        goldDust.appendChild(g);
      }
    }

    // Petals (continual)
    if (petals) {
      const createPetal = () => {
        const p = document.createElement("div");
        p.className = "petal";
        p.style.left = `${Math.random() * 100}%`;
        p.style.animationDuration = `${6 + Math.random() * 6}s`;
        petals.appendChild(p);
        setTimeoutTracked(() => p.remove(), PARTICLE_CONFIG.petalKeepMs);
      };
      setIntervalTracked(createPetal, PARTICLE_CONFIG.petalIntervalMs);
    }

    // Hero particles
    if (heroParticles) {
      for (let i = 0; i < PARTICLE_CONFIG.heroParticles; i++) {
        const p = document.createElement("div");
        const size = Math.random() * 5 + 2;
        p.style.position = "absolute";
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.borderRadius = "50%";
        p.style.background = "rgba(255,255,255,.9)";
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.boxShadow = "0 0 15px #fff";
        p.style.animation = `heroFloat ${10 + Math.random() * 15}s linear infinite`;
        heroParticles.appendChild(p);
      }
    }

    // Fireflies
    if (fireflies) {
      for (let i = 0; i < PARTICLE_CONFIG.fireflies; i++) {
        const f = document.createElement("div");
        f.className = "firefly";
        f.style.left = `${Math.random() * 100}%`;
        f.style.top = `${Math.random() * 100}%`;
        f.style.animationDuration = `${6 + Math.random() * 8}s`;
        f.style.animationDelay = `${Math.random() * 6}s`;
        fireflies.appendChild(f);
      }
    }

    // Story hearts
    if (storyParticles) {
      for (let i = 0; i < PARTICLE_CONFIG.storyHearts; i++) {
        const h = document.createElement("div");
        h.className = "heart";
        h.innerHTML = "❤";
        h.style.left = `${Math.random() * 100}%`;
        h.style.top = `${Math.random() * 100}%`;
        h.style.animationDelay = `${Math.random() * 8}s`;
        h.style.animationDuration = `${6 + Math.random() * 5}s`;
        storyParticles.appendChild(h);
      }
    }

    /* ----------------------------
       PARALLAX & MOVEMENT (rAF throttled)
       ---------------------------- */
    let mouseTarget = { x: 0, y: 0 };
    let mouseApplied = { x: 0, y: 0 };
    let rafPending = false;

    document.addEventListener(
      "mousemove",
      (e) => {
        mouseTarget.x = e.clientX / window.innerWidth - 0.5;
        mouseTarget.y = e.clientY / window.innerHeight - 0.5;
        if (!rafPending) {
          rafPending = true;
          requestAnimationFrame(applyMouseParallax);
        }
      },
      { passive: true }
    );

    function applyMouseParallax() {
      rafPending = false;
      // progressively move toward target for smoothness
      mouseApplied.x += (mouseTarget.x - mouseApplied.x) * 0.18;
      mouseApplied.y += (mouseTarget.y - mouseApplied.y) * 0.18;

      const heroContent = $(".hero-content");
      const moonEl = $(".moon");
      const aurora1 = $(".aurora1");
      const aurora2 = $(".aurora2");

      if (heroContent) heroContent.style.transform = `translate(${mouseApplied.x * 25}px, ${mouseApplied.y * 25}px)`;
      if (moonEl) moonEl.style.transform = `translate(${mouseApplied.x * 18}px, ${mouseApplied.y * 18}px)`;
      if (aurora1) aurora1.style.transform = `translate(${mouseApplied.x * 40}px, ${mouseApplied.y * 40}px)`;
      if (aurora2) aurora2.style.transform = `translate(${-mouseApplied.x * 35}px, ${-mouseApplied.y * 35}px)`;
    }

    // Scroll-based updates throttled via rAF
    let scrollPending = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!scrollPending) {
          scrollPending = true;
          requestAnimationFrame(() => {
            const heroContent = $(".hero-content");
            if (heroContent) heroContent.style.opacity = String(Math.max(0, 1 - window.scrollY / 500));

            // gallery parallax (minor)
            const gallery = $(".gallery-grid");
            if (gallery) gallery.style.transform = `translateY(${window.scrollY * 0.05}px)`;

            scrollPending = false;
          });
        }
      },
      { passive: true }
    );

    /* ----------------------------
       Smooth anchor scroll (prevent default only when target exists)
       ---------------------------- */
    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (ev) {
        const href = this.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          ev.preventDefault();
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    /* ----------------------------
       Button ripple
       ---------------------------- */
    $$("button, .btn").forEach((button) => {
      button.addEventListener("click", function (e) {
        const ripple = document.createElement("span");
        ripple.className = "ripple";
        const rect = this.getBoundingClientRect();
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        this.appendChild(ripple);
        setTimeoutTracked(() => ripple.remove(), 600);
      });
    });

    /* ----------------------------
       Gallery lightbox
       ---------------------------- */
    const galleryImages = $$(".gallery-item img");
    let currentImage = 0;

    const showImage = (index = currentImage) => {
      if (!galleryImages.length || !lightboxImage) return;
      currentImage = index;
      lightboxImage.classList.add("fade");
      setTimeoutTracked(() => {
        lightboxImage.src = galleryImages[currentImage].src;
        lightboxImage.classList.remove("fade");
      }, 180);
    };

    galleryImages.forEach((img, idx) => {
      img.addEventListener("click", () => {
        currentImage = idx;
        if (lightbox) lightbox.style.display = "flex";
        showImage(currentImage);
      });
    });

    nextPhoto && nextPhoto.addEventListener("click", () => {
      currentImage = (currentImage + 1) % galleryImages.length;
      showImage(currentImage);
    });

    prevPhoto && prevPhoto.addEventListener("click", () => {
      currentImage = (currentImage - 1 + galleryImages.length) % galleryImages.length;
      showImage(currentImage);
    });

    closeLightbox && closeLightbox.addEventListener("click", () => {
      if (lightbox) lightbox.style.display = "none";
    });

    if (lightbox) {
      lightbox.addEventListener("click", (ev) => {
        if (ev.target === lightbox) lightbox.style.display = "none";
      });

      document.addEventListener("keydown", (ev) => {
        if (!lightbox || lightbox.style.display !== "flex") return;
        if (ev.key === "ArrowRight") nextPhoto && nextPhoto.click();
        if (ev.key === "ArrowLeft") prevPhoto && prevPhoto.click();
        if (ev.key === "Escape") lightbox.style.display = "none";
      });

      let startX = 0;
      lightbox.addEventListener("touchstart", (ev) => {
        startX = ev.changedTouches[0].clientX;
      });

      lightbox.addEventListener("touchend", (ev) => {
        const endX = ev.changedTouches[0].clientX;
        const diff = endX - startX;
        if (diff > 60) prevPhoto && prevPhoto.click();
        else if (diff < -60) nextPhoto && nextPhoto.click();
      });
    }

    /* ----------------------------
       RSVP FORM handling
       ---------------------------- */
    if (form) {
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const name = $("#fullname")?.value.trim();
        const email = $("#email")?.value.trim();
        if (!name || !email) {
          alert("Please complete the required fields.");
          return;
        }
        if (modal) modal.style.display = "flex";
        form.reset();
        if (guestNames) guestNames.innerHTML = "";
        launchConfetti();
      });
    }

    closeModal && closeModal.addEventListener("click", () => {
      if (modal) modal.style.display = "none";
    });

    if (guestInput && guestNames) {
      guestInput.addEventListener("change", () => {
        guestNames.innerHTML = "";
        const total = Math.max(1, parseInt(guestInput.value || "1", 10));
        for (let i = 2; i <= total; i++) {
          const wrapper = document.createElement("div");
          wrapper.className = "input-group";
          wrapper.innerHTML = `<input type="text" required /><label>Guest ${i} Name</label>`;
          guestNames.appendChild(wrapper);
        }
      });
    }

    function launchConfetti() {
      for (let i = 0; i < PARTICLE_CONFIG.confetti; i++) {
        const piece = document.createElement("div");
        piece.className = "confetti";
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.animationDelay = `${Math.random()}s`;
        document.body.appendChild(piece);
        setTimeoutTracked(() => piece.remove(), 3000);
      }
    }

    /* ----------------------------
       Lanterns
       ---------------------------- */
    if (lanternContainer) {
      for (let i = 0; i < PARTICLE_CONFIG.lanterns; i++) {
        const lantern = document.createElement("div");
        lantern.className = "lantern";
        lantern.style.left = `${Math.random() * 100}%`;
        lantern.style.animationDelay = `${Math.random() * 8}s`;
        lantern.style.animationDuration = `${10 + Math.random() * 8}s`;
        lanternContainer.appendChild(lantern);
      }
    }

    /* ----------------------------
       Loader hide — fixed: robust
       ---------------------------- */
    function hideLoader() {
      if (!loader) return;
      loader.style.opacity = "0";
      setTimeoutTracked(() => {
        loader.style.display = "none";
      }, 800);
    }

    if (document.readyState === "complete") {
      // load already fired
      setTimeoutTracked(hideLoader, 1800);
    } else {
      window.addEventListener(
        "load",
        () => {
          setTimeoutTracked(hideLoader, 1800);
        },
        { passive: true }
      );
    }

    /* ----------------------------
       Star canvas animation (kept, but optimized)
       ---------------------------- */
    if (starCanvas && starCanvas.getContext) {
      const canvas = starCanvas;
      const ctx = canvas.getContext("2d");

      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas, { passive: true });

      // moderate star count for perf
      const stars = [];
      const STAR_COUNT = 220;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 2,
          speed: 0.15 + Math.random() * 0.8,
          alpha: 0.3 + Math.random() * 0.7,
        });
      }

      let mouseX = 0;
      let mouseY = 0;
      document.addEventListener(
        "mousemove",
        (ev) => {
          mouseX = (ev.clientX - window.innerWidth / 2) * 0.02;
          mouseY = (ev.clientY - window.innerHeight / 2) * 0.02;
        },
        { passive: true }
      );

      function animateStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const s of stars) {
          ctx.beginPath();
          ctx.arc(s.x + mouseX * s.speed, s.y + mouseY * s.speed, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
          ctx.fill();
          s.y += s.speed;
          if (s.y > canvas.height) {
            s.y = 0;
            s.x = Math.random() * canvas.width;
          }
        }
        requestAnimationFrame(animateStars);
      }
      requestAnimationFrame(animateStars);

      // occasional meteor effect
      function meteor() {
        const x = Math.random() * canvas.width;
        const y = Math.random() * 250;
        let len = 0;
        function draw() {
          ctx.beginPath();
          ctx.moveTo(x - len, y + len * 0.4);
          ctx.lineTo(x, y);
          ctx.strokeStyle = "rgba(255,255,255,.8)";
          ctx.lineWidth = 2;
          ctx.stroke();
          len += 16;
          if (len < 220) requestAnimationFrame(draw);
        }
        draw();
      }
      setIntervalTracked(meteor, 4000);
    }

    /* ----------------------------
       Timeline progress
       ---------------------------- */
    const progress = $(".timeline-progress");
    if (storySection && progress) {
      window.addEventListener(
        "scroll",
        () => {
          const rect = storySection.getBoundingClientRect();
          const visible = window.innerHeight - rect.top;
          const percent = Math.max(0, Math.min(1, visible / rect.height));
          progress.style.height = `${percent * 100}%`;
        },
        { passive: true }
      );
    }

    /* ----------------------------
       View invitation scroll
       ---------------------------- */
    if (viewInvitation && storySection) {
      viewInvitation.addEventListener("click", (ev) => {
        ev.preventDefault();
        storySection.scrollIntoView({ behavior: "smooth" });
      });
    }

    /* ----------------------------
       Hero reveal observer for specific elements
       ---------------------------- */
    const heroRevealEls = $$(".hero-date, .hero-location, .hero-btn");
    const hObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("showReveal");
      });
    });
    heroRevealEls.forEach((el) => hObserver.observe(el));
  }

  /* cleanup on unload */
  window.addEventListener(
    "beforeunload",
    () => {
      clearAllTimers();
    },
    { passive: true }
  );
})();