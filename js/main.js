(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mark the active page in the navigation for keyboard and screen-reader users.
  const currentFile = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav a, .footer-nav a, .mobile-nav-links a").forEach((link) => {
    const target = (link.getAttribute("href") || "").split("/").pop().toLowerCase();
    if (target === currentFile) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  // Keep external links safe when they open a new tab.
  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
    rel.add("noopener");
    rel.add("noreferrer");
    link.setAttribute("rel", [...rel].join(" "));
  });

  // Progressive, subtle reveal on scroll. Content remains visible if the browser
  // does not support IntersectionObserver or the visitor prefers reduced motion.
  const revealTargets = document.querySelectorAll(
    ".cta, .featured, .project-card, .interest-card, .skill-card, .tool-box, " +
    ".case-section, .contact-item, .edu-card, .story-grid, .open-box"
  );

  if (!reduceMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -28px 0px" });

    revealTargets.forEach((element, index) => {
      element.classList.add("will-reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 55}ms`);
      observer.observe(element);
    });
  }

  // Expand/collapse Skills and Tools grids on tablet/mobile.
  // Each button controls its own grid; CSS decides which cards are initially hidden.
  const setupExpandableGrid = (grid, button, expandedLabel, collapsedLabel) => {
    if (!grid || !button) return;

    button.addEventListener("click", () => {
      const expanded = grid.classList.toggle("is-expanded");
      button.setAttribute("aria-expanded", String(expanded));
      button.setAttribute("aria-label", expanded ? expandedLabel : collapsedLabel);
      button.textContent = expanded ? "−" : "•••";
    });
  };

  const skillsGrid = document.querySelector(".skills-page #skillsGrid");
  const skillsToggle = skillsGrid?.querySelector(".more-card:not(.tool-more)");
  setupExpandableGrid(
    skillsGrid,
    skillsToggle,
    "Show fewer skills",
    "Show all skills"
  );

  const toolsGrid = document.querySelector(".skills-page #toolsGrid");
  const toolsToggle = toolsGrid?.querySelector(".tool-more");
  setupExpandableGrid(
    toolsGrid,
    toolsToggle,
    "Show fewer technologies",
    "Show all technologies"
  );

  // Contact form: live character count, accessible inline feedback, and a
  // prefilled email draft. A backend would be needed for silent form delivery.
  const contactForm = document.querySelector("#contactForm");
  const messageField = document.querySelector("#message");
  const counter = document.querySelector("#counter");

  if (messageField && counter) {
    const updateCounter = () => {
      const count = messageField.value.length;
      counter.textContent = `${count}/500`;
      counter.classList.toggle("is-near-limit", count >= 450);
      counter.classList.toggle("is-at-limit", count >= 500);
    };
    messageField.addEventListener("input", updateCounter);
    updateCounter();
  }

  if (contactForm) {
    let status = contactForm.querySelector(".form-status");
    if (!status) {
      status = document.createElement("p");
      status.className = "form-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.hidden = true;
      contactForm.append(status);
    }

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!contactForm.reportValidity()) return;

      const name = document.querySelector("#name")?.value.trim() || "";
      const email = document.querySelector("#email")?.value.trim() || "";
      const subject = document.querySelector("#subject")?.value.trim() || "Portfolio inquiry";
      const message = messageField?.value.trim() || "";

      if (!name || !email || !subject || !message) {
        status.textContent = "Please complete every field before continuing.";
        status.hidden = false;
        return;
      }

      const emailSubject = `[Portfolio] ${subject}`;
      const emailBody = [
        `Name: ${name}`,
        `Reply email: ${email}`,
        "",
        "Message:",
        message
      ].join("\n");

      status.textContent = "Opening your email app with your message prepared. Please review it and press Send there.";
      status.hidden = false;

      const mailto = `mailto:marclester197@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailto;
    });
  }

  // Lightbox for project screenshots and the case-study page previews.
  const previewImages = document.querySelectorAll(
    ".featured-thumb img, .project-thumb-image img, .preview-image"
  );

  if (previewImages.length) {
    const dialog = document.createElement("dialog");
    dialog.className = "image-lightbox";
    dialog.setAttribute("aria-label", "Image preview");
    dialog.innerHTML = `
      <div class="lightbox-panel">
        <button class="lightbox-close" type="button" aria-label="Close image preview">×</button>
        <img class="lightbox-image" alt="">
        <p class="lightbox-caption"></p>
      </div>`;
    document.body.append(dialog);

    const lightboxImage = dialog.querySelector(".lightbox-image");
    const caption = dialog.querySelector(".lightbox-caption");
    const closeButton = dialog.querySelector(".lightbox-close");

    const openPreview = (image) => {
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt || "Project image preview";
      caption.textContent = image.alt || "";
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        window.open(lightboxImage.src, "_blank", "noopener,noreferrer");
      }
    };

    previewImages.forEach((image) => {
      image.classList.add("zoomable-image");
      image.setAttribute("tabindex", "0");
      image.setAttribute("role", "button");
      image.setAttribute("aria-label", `Open larger image: ${image.alt || "project image"}`);
      image.addEventListener("click", () => openPreview(image));
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPreview(image);
        }
      });
    });

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      lightboxImage.removeAttribute("src");
    });
  }

  // The mobile navigation is its own designed page. Its header icon returns to
  // the page the visitor came from when available; the anchor remains a fallback.
  const mobileMenu = document.querySelector(".mobile-menu-page");
  const menuCloseLink = mobileMenu?.querySelector(".site-header .hamburger");
  if (menuCloseLink) {
    menuCloseLink.addEventListener("click", (event) => {
      const referrer = document.referrer;
      if (!referrer) return;
      try {
        const previous = new URL(referrer);
        if (previous.protocol === window.location.protocol && previous.pathname !== window.location.pathname) {
          event.preventDefault();
          window.history.back();
        }
      } catch (_) {
        // Keep the normal anchor fallback if the referrer cannot be parsed.
      }
    });
  }
})();
