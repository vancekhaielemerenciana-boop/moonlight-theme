"use strict";

/* script.js
   Linted & formatted version for index.html / style.css
   - Consolidated DOM access with guards
   - Consistent indentation, semicolons, and spacing
   - Clear section headers and small helper functions
*/

document.addEventListener("DOMContentLoaded", () => {
  /* ============================
     Element references (guarded)
  ============================ */
  const intro = document.getElementById("intro");
  const envelope = document.querySelector(".envelope");
  const main = document.getElementById("mainContent");
  const bgMusic = document.getElementById("bgMusic");
  const musicToggle = document.getElementById("musicToggle");
  const openSound = document.getElementById("openSound");
  const viewInvitation = document.getElementById("viewInvitation");
  const storySection = document.getElementById("story");
  const starCanvas = document.getElementById("starCanvas");
  const nightSky = document.getElementById("nightSky");
  const sparklesContainer = document.getElementById("sparkles");
  const shootingContainer = document.getElementById("shootingStars");
  const mistContainer = document.getElementById("mist");
  const goldDust = document.getElementById("goldDust");
  const petals = document.getElementById("petals");
  const heroParticles = document.querySelector(".hero-particles");
  const fireflies = document.getElementById("fireflies");
  const storyParticles = document.getElementById("storyParticles");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const prevPhoto = document.getElementById("prevPhoto");
  const nextPhoto = document.getElementById("nextPhoto");
  const closeLightbox = document.getElementById("closeLightbox");
  const form = document.getElementById("rsvpForm");
  const modal = document.getElementById("successModal");
  const closeModal = document.getElementById("closeModal");
  const guestInput = document.getElementById("guests");
  const guestNames = document.getElementById("guestNames");
  const lanternContainer = document.getElementById("lanternContainer");
  const loader = document.getElementById("loader");

  let playingMusic = false;
  let envelopeOpened = false;

  /* ============================
     Helpers
  ============================ */
  const pad = (n) => String(n).padStart(2, "0");

  const safePlay = (audioEl) => {
    if (!audioEl) return;
    audioEl.play().catch(() => {
      // autoplay may be blocked by browser; fail silently
    });
  };

  /* ============================
     OPEN INVITATION / ENVELOPE
     (Attach click + touch handlers, debounce)
  ============================ */

  /**
   * activateOpen - debounced single-run opener
   */
  function activateOpen(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (envelopeOpened) return;
    envelopeOpened = true;

    showMainAfterOpen();
  }

  // Bind to the primary button, envelope container, and seal
  const openTargets = [
    document.getElementById("openBtn"),
    document.querySelector(".envelope"),
    document.querySelector(".seal"),
  ].filter(Boolean);

  openTargets.forEach((el) => {
    el.addEventListener("click", activateOpen, { passive: false });
    el.addEventListener("touchstart", activateOpen, { passive: false });
  });

  function showMainAfterOpen() {
    if (envelope) envelope.classList.add("open");
    if (openSound) safePlay(openSound);

    // Fade intro, then hide and show main content
    if (intro) {
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

  /* ============================
     MUSIC TOGGLE
  ============================ */
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

  /* ============================
     COUNTDOWN
     (single authoritative target date)
  ============================ */
  const countdownTarget = new Date("October 25, 2027 16:00:00").getTime();

  function updateCountdown() {
    const now = Date.now();
    const distance = countdownTarget - now;
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

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
  setInterval(updateCountdown, 1000);

  /* ============================
     REVEAL OBSERVER (sections & .reveal)
  ============================ */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("active");
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reveal, section").forEach((el) => revealObserver.observe(el));

  /* ============================
     NIGHT SKY / PARTICLES / EFFECTS
  ============================ */

  // Stars
  if (nightSky) {
    for (let i = 0; i < 180; i++) {
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

  // Sparkles (static batch)
  if (sparklesContainer) {
    for (let i = 0; i < 250; i++) {
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

    // Floating sparkles (continual)
    const createSparkle = () => {
      const sparkle = document.createElement("div");
      sparkle.className = "sparkle";
      sparkle.style.left = `${Math.random() * 100}%`;
      sparkle.style.bottom = "-20px";
      sparkle.style.animationDuration = `${5 + Math.random() * 6}s`;
      sparkle.style.opacity = `${0.3 + Math.random() * 0.7}`;
      sparklesContainer.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 11000);
    };
    setInterval(createSparkle, 220);
  }

  // Shooting stars
  if (shootingContainer) {
    const createMeteor = () => {
      const meteor = document.createElement("div");
      meteor.className = "shooting";
      meteor.style.left = `${60 + Math.random() * 40}%`;
      meteor.style.top = `${Math.random() * 35}%`;
      meteor.style.animation = "shooting 1.8s linear forwards";
      shootingContainer.appendChild(meteor);
      setTimeout(() => meteor.remove(), 1800);
    };
    setInterval(createMeteor, 3500);
  }

  // Mist layers
  if (mistContainer) {
    for (let i = 0; i < 6; i++) {
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
    for (let i = 0; i < 120; i++) {
      const g = document.createElement("div");
      g.className = "gold";
      g.style.left = `${Math.random() * 100}%`;
      g.style.animationDuration = `${6 + Math.random() * 10}s`;
      g.style.animationDelay = `${Math.random() * 10}s`;
      goldDust.appendChild(g);
    }
  }

  // Rose petals
  if (petals) {
    const createPetal = () => {
      const p = document.createElement("div");
      p.className = "petal";
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${6 + Math.random() * 6}s`;
      petals.appendChild(p);
      setTimeout(() => p.remove(), 12000);
    };
    setInterval(createPetal, 500);
  }

  // Hero particles
  if (heroParticles) {
    for (let i = 0; i < 80; i++) {
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
    for (let i = 0; i < 45; i++) {
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
    for (let i = 0; i < 35; i++) {
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

  /* ============================
     PARALLAX & MOVEMENT
  ============================ */
  document.addEventListener("mousemove", (e) => {
    const heroContent = document.querySelector(".hero-content");
    const moonEl = document.querySelector(".moon");
    const aurora1 = document.querySelector(".aurora1");
    const aurora2 = document.querySelector(".aurora2");

    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;

    if (heroContent) heroContent.style.transform = `translate(${x * 25}px, ${y * 25}px)`;
    if (moonEl) moonEl.style.transform = `translate(${x * 18}px, ${y * 18}px)`;
    if (aurora1) aurora1.style.transform = `translate(${x * 40}px, ${y * 40}px)`;
    if (aurora2) aurora2.style.transform = `translate(${-x * 35}px, ${-y * 35}px)`;
  });

  // Hero fade on scroll
  window.addEventListener("scroll", () => {
    const heroContent = document.querySelector(".hero-content");
    if (heroContent) heroContent.style.opacity = String(Math.max(0, 1 - window.scrollY / 500));
  });

  // Smooth scroll for anchors
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
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

  /* ============================
     BUTTON RIPPLE
  ============================ */
  document.querySelectorAll("button, .btn").forEach((button) => {
    button.addEventListener("click", function (e) {
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      const rect = this.getBoundingClientRect();
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  /* ============================
     GALLERY LIGHTBOX
  ============================ */
  const galleryImages = document.querySelectorAll(".gallery-item img");
  let currentImage = 0;

  const showImage = (index = currentImage) => {
    if (!galleryImages.length || !lightboxImage) return;
    currentImage = index;
    lightboxImage.classList.add("fade");
    setTimeout(() => {
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

  if (nextPhoto) {
    nextPhoto.addEventListener("click", () => {
      currentImage = (currentImage + 1) % galleryImages.length;
      showImage(currentImage);
    });
  }

  if (prevPhoto) {
    prevPhoto.addEventListener("click", () => {
      currentImage = (currentImage - 1 + galleryImages.length) % galleryImages.length;
      showImage(currentImage);
    });
  }

  if (closeLightbox) {
    closeLightbox.addEventListener("click", () => {
      if (lightbox) lightbox.style.display = "none";
    });
  }

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

  // Gallery parallax on scroll
  window.addEventListener("scroll", () => {
    const gallery = document.querySelector(".gallery-grid");
    if (!gallery) return;
    gallery.style.transform = `translateY(${window.scrollY * 0.05}px)`;
  });

  /* ============================
     RSVP FORM & GUEST NAMES
  ============================ */
  if (form) {
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const name = document.getElementById("fullname")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
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

  if (closeModal) {
    closeModal.addEventListener("click", () => {
      if (modal) modal.style.display = "none";
    });
  }

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
    for (let i = 0; i < 80; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti";
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.animationDelay = `${Math.random()}s`;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3000);
    }
  }

  /* ============================
     LANTERNS
  ============================ */
  if (lanternContainer) {
    for (let i = 0; i < 15; i++) {
      const lantern = document.createElement("div");
      lantern.className = "lantern";
      lantern.style.left = `${Math.random() * 100}%`;
      lantern.style.animationDelay = `${Math.random() * 8}s`;
      lantern.style.animationDuration = `${10 + Math.random() * 8}s`;
      lanternContainer.appendChild(lantern);
    }
  }

  /* ============================
     LOADER HIDE
  ============================ */
  if (loader) {
    window.addEventListener("load", () => {
      setTimeout(() => {
        loader.style.opacity = "0";
        setTimeout(() => loader.style.display = "none", 800);
      }, 1800);
    });
  }

  /* ============================
     STAR CANVAS ANIMATION
  ============================ */
  if (starCanvas && starCanvas.getContext) {
    const canvas = starCanvas;
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const stars = [];
    for (let i = 0; i < 500; i++) {
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
    document.addEventListener("mousemove", (ev) => {
      mouseX = (ev.clientX - window.innerWidth / 2) * 0.02;
      mouseY = (ev.clientY - window.innerHeight / 2) * 0.02;
    });

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
    animateStars();

    // Meteor effect
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
    setInterval(meteor, 4000);
  }

  /* ============================
     TIMELINE PROGRESS
  ============================ */
  const progress = document.querySelector(".timeline-progress");
  if (storySection && progress) {
    window.addEventListener("scroll", () => {
      const rect = storySection.getBoundingClientRect();
      const visible = window.innerHeight - rect.top;
      const percent = Math.max(0, Math.min(1, visible / rect.height));
      progress.style.height = `${percent * 100}%`;
    });
  }

  /* ============================
     VIEW INVITATION SCROLL
  ============================ */
  if (viewInvitation && storySection) {
    viewInvitation.addEventListener("click", (ev) => {
      ev.preventDefault();
      storySection.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ============================
     HERO REVEAL OBSERVER
  ============================ */
  const heroRevealEls = document.querySelectorAll(".hero-date, .hero-location, .hero-btn");
  const hObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("showReveal");
    });
  });
  heroRevealEls.forEach((el) => hObserver.observe(el));
});
