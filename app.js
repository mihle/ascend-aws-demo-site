/**
 * EDITORIAL & LUXURY STUDIO INTERACTION SCRIPT
 * Lightweight, dependency-free vanilla JS for authentic client studio showcase.
 */

(function () {
  "use strict";

  // =========================================================================
  // 1. BRAND HYDRATION & REPLACEMENT
  // =========================================================================
  const metaTag = document.querySelector('meta[name="customer-company-name"]');
  const initialToken = metaTag?.content ?? "";
  const companyName =
    initialToken === "__COMPANY_NAME__" || !initialToken
      ? "Aster & Co."
      : initialToken;

  const companyInitial = companyName.trim().charAt(0).toUpperCase() || "A";

  // Populate company names across DOM
  document.querySelectorAll("[data-company-name]").forEach((el) => {
    el.textContent = companyName;
  });

  // Populate company initials / monograms
  document.querySelectorAll("[data-company-initial]").forEach((el) => {
    el.textContent = companyInitial;
  });

  // Set document title
  document.title = `${companyName} · Strategic Design & Creative Direction`;

  // =========================================================================
  // 2. SCROLL REVEAL OBSERVER
  // =========================================================================
  const revealElements = document.querySelectorAll("[data-reveal]");
  const observerOptions = {
    root: null,
    rootMargin: "0px 0px -40px 0px",
    threshold: 0.1,
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach((el) => revealObserver.observe(el));

  // =========================================================================
  // 3. SUBTLE TACTILE CARD TILT
  // =========================================================================
  const heroCard = document.getElementById("hero-interactive-card");
  if (heroCard && window.matchMedia("(min-width: 1024px)").matches) {
    heroCard.addEventListener("mousemove", (e) => {
      const rect = heroCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      heroCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    heroCard.addEventListener("mouseleave", () => {
      heroCard.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
    });
  }

  // =========================================================================
  // 4. COPY EMAIL & TOAST NOTIFICATION
  // =========================================================================
  const btnCopyEmail = document.getElementById("btn-copy-email");
  const toastNotify = document.getElementById("toast-notify");
  const toastMessage = document.getElementById("toast-message");
  let toastTimeout;

  function showToast(msg) {
    if (!toastNotify) return;
    if (toastMessage) toastMessage.textContent = msg;
    toastNotify.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastNotify.classList.remove("show");
    }, 3200);
  }

  if (btnCopyEmail) {
    btnCopyEmail.addEventListener("click", () => {
      const email = "hello@example.com";
      navigator.clipboard
        .writeText(email)
        .then(() => {
          showToast(`Copied ${email} to clipboard`);
        })
        .catch(() => {
          showToast(`Contact: ${email}`);
        });
    });
  }

  // =========================================================================
  // 5. MOBILE NAVIGATION MENU
  // =========================================================================
  const mobileToggle = document.querySelector(".mobile-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("open");
      mobileToggle.setAttribute("aria-expanded", isOpen);
      mobileMenu.setAttribute("aria-hidden", !isOpen);
    });

    document.querySelectorAll(".mobile-nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        mobileToggle.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-hidden", "true");
      });
    });
  }

  // Set current year in footer
  const currentYearEl = document.getElementById("current-year");
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }
})();
