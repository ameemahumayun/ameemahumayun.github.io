/* ==========================================================================
   MAIN.JS — minimal site scripts
   --------------------------------------------------------------------------
   1. Scroll-spy for the case-study section rail. Highlights the rail link
      matching the section currently in view. Progressive enhancement — if
      JS is off, the rail still works as plain anchor links.
   2. Work-page filter tabs (All / Publications / Design). Progressive
      enhancement — if JS is off, every card just stays visible. The active
      filter is reflected in the URL as ?filter=publication|design so a
      specific view (e.g. "just the design work") has a shareable link.
   3. View toggle (e.g. Slides / Prototype on a project page). Switches
      which .view-panel is visible based on the clicked .view-toggle__btn's
      data-view. Progressive enhancement — if JS is off, every panel stays
      visible.
   4. Carousel. One .carousel__panel at a time (image slides or a plain
      text/HTML block) with prev/next controls and a counter. Works for
      any number of panels on any page with a .carousel element.
   5. Theme toggle. Flips the data-theme attribute on <html> between
      "light" and "dark", persists the choice to localStorage, and keeps
      the nav button's icon/label in sync. The actual color swap is pure
      CSS (see tokens.css's [data-theme="light"] block) — this just
      flips the attribute. A matching inline script in head.html applies
      the stored choice before first paint so there's no flash.
   6. Custom cursor. Builds the star-shaped pointer as a DOM element (so
      it can be animated) in place of the plain cursor:url() from
      base.css, which stays as the fallback on touch devices and for
      reduced-motion. Hovering a link/button retracts its points to a
      circle; clicking anywhere snaps it to a circle too and flings the
      points off as falling triangle debris, regrowing them only if the
      click wasn't on something interactive.
   ========================================================================== */

(function () {
  "use strict";

  const rail = document.querySelector(".rail__list");
  if (!rail) return; // page has no section rail

  const links = Array.from(rail.querySelectorAll("a"));
  const sections = links
    .map((link) => {
      const id = link.getAttribute("href").replace("#", "");
      return document.getElementById(id);
    })
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach((link) => {
      const match = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", match);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    {
      // Trigger when a section's top reaches ~30% down the viewport.
      rootMargin: "-30% 0px -65% 0px",
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
})();

(function () {
  "use strict";

  const filterBar = document.querySelector(".work-filter");
  if (!filterBar) return; // page has no filter tabs

  const buttons = Array.from(filterBar.querySelectorAll(".work-filter__btn"));
  // [data-type] also matches the "Archives" divider, not just .work-card,
  // so it hides/shows along with the design cards it introduces.
  const cards = Array.from(document.querySelectorAll("[data-type]"));
  const validFilters = buttons.map((b) => b.getAttribute("data-filter"));

  const applyFilter = (filter, btn) => {
    buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
    cards.forEach((card) => {
      card.hidden = filter !== "all" && card.getAttribute("data-type") !== filter;
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter");
      applyFilter(filter, btn);

      const url = new URL(window.location.href);
      if (filter === "all") {
        url.searchParams.delete("filter");
      } else {
        url.searchParams.set("filter", filter);
      }
      window.history.pushState({ filter }, "", url);
    });
  });

  const filterFromUrl = () => {
    const requested = new URLSearchParams(window.location.search).get("filter");
    const filter = validFilters.includes(requested) ? requested : "all";
    const btn = buttons.find((b) => b.getAttribute("data-filter") === filter) || buttons[0];
    applyFilter(filter, btn);
  };

  filterFromUrl();
  window.addEventListener("popstate", filterFromUrl);
})();

(function () {
  "use strict";

  const toggle = document.querySelector(".view-toggle");
  if (!toggle) return; // page has no view toggle

  const buttons = Array.from(toggle.querySelectorAll(".work-filter__btn"));
  const panels = Array.from(document.querySelectorAll(".view-panel"));

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
      panels.forEach((panel) => {
        panel.hidden = panel.getAttribute("data-view") !== view;
      });
    });
  });
})();

(function () {
  "use strict";

  const carousels = Array.from(document.querySelectorAll(".carousel"));
  carousels.forEach((carousel) => {
    const panels = Array.from(carousel.querySelectorAll(".carousel__panel"));
    const counter = carousel.querySelector(".carousel__counter");
    const prevBtn = carousel.querySelector(".carousel__btn--prev");
    const nextBtn = carousel.querySelector(".carousel__btn--next");
    if (!panels.length || !counter || !prevBtn || !nextBtn) return;

    let index = 0;

    const render = () => {
      panels.forEach((panel, i) => { panel.hidden = i !== index; });
      counter.textContent = (index + 1) + " / " + panels.length;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === panels.length - 1;
    };

    prevBtn.addEventListener("click", () => {
      if (index > 0) { index -= 1; render(); }
    });
    nextBtn.addEventListener("click", () => {
      if (index < panels.length - 1) { index += 1; render(); }
    });

    render();
  });
})();

(function () {
  "use strict";

  // Generic fullscreen trigger: any .carousel__btn--fullscreen requests
  // fullscreen on its nearest .carousel__viewport, whether that viewport
  // holds a carousel image or a plain embedded iframe.
  const buttons = Array.from(document.querySelectorAll(".carousel__btn--fullscreen"));
  buttons.forEach((btn) => {
    const viewport = btn.closest(".carousel__viewport");
    if (!viewport) return;
    btn.addEventListener("click", () => {
      if (viewport.requestFullscreen) {
        viewport.requestFullscreen();
      } else if (viewport.webkitRequestFullscreen) {
        viewport.webkitRequestFullscreen();
      }
    });
  });
})();


(function () {
  "use strict";

  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  const sunIcon = toggle.querySelector(".theme-toggle__icon--sun");
  const moonIcon = toggle.querySelector(".theme-toggle__icon--moon");
  const root = document.documentElement;

  // Setting the .hidden IDL property on these <svg> elements doesn't
  // reliably reflect to the actual "hidden" HTML attribute (verified:
  // after toggling, the attribute didn't match what the property
  // claimed, which is exactly why both icons could end up visible at
  // once) — set the attribute directly instead.
  const setHidden = (el, isHidden) => {
    if (isHidden) {
      el.setAttribute("hidden", "");
    } else {
      el.removeAttribute("hidden");
    }
  };

  const applyState = (theme) => {
    const isLight = theme === "light";
    setHidden(sunIcon, isLight);
    setHidden(moonIcon, !isLight);
    toggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    toggle.setAttribute("aria-pressed", String(isLight));
  };

  applyState(root.getAttribute("data-theme") === "light" ? "light" : "dark");

  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    if (next === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    applyState(next);
  });
})();

(function () {
  "use strict";

  if (!window.matchMedia) return;
  // No mouse to skin on touch devices, and reduced-motion means no flying
  // debris — in both cases just leave the plain cursor:url() from base.css.
  if (window.matchMedia("(pointer: coarse)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const SPIKE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
  const INTERACTIVE_SELECTOR = 'a, button, summary, [role="button"]';

  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";
  cursor.setAttribute("aria-hidden", "true");

  SPIKE_ANGLES.forEach((angle) => {
    const arm = document.createElement("div");
    arm.className = "custom-cursor__arm";
    arm.style.setProperty("--angle", angle + "deg");
    arm.dataset.angle = String(angle);
    const spike = document.createElement("div");
    spike.className = "custom-cursor__spike";
    arm.appendChild(spike);
    cursor.appendChild(arm);
  });

  const core = document.createElement("div");
  core.className = "custom-cursor__core";
  cursor.appendChild(core);

  document.body.appendChild(cursor);
  document.documentElement.classList.add("has-custom-cursor");

  const arms = Array.from(cursor.querySelectorAll(".custom-cursor__arm"));

  let x = -100;
  let y = -100;
  let queued = false;

  const render = () => {
    queued = false;
    cursor.style.transform = "translate3d(" + (x - 11) + "px, " + (y - 11) + "px, 0)";
  };

  const queueRender = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  };

  document.addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
    cursor.classList.add("is-visible");
    cursor.classList.toggle("is-interactive", !!e.target.closest(INTERACTIVE_SELECTOR));
    queueRender();
  });

  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-visible");
  });

  // Flings each of the 8 star points outward from the click point, then
  // lets them tumble down and fade — independent elements, since the
  // cursor itself snaps to a circle immediately and keeps moving.
  const spawnDebris = (originX, originY) => {
    arms.forEach((arm) => {
      const angleDeg = Number(arm.dataset.angle) || 0;
      const rad = (angleDeg * Math.PI) / 180;
      // angle 0 = "up", matching the arm's own un-rotated spike direction.
      const dirX = Math.sin(rad);
      const dirY = -Math.cos(rad);

      const particle = document.createElement("div");
      particle.className = "cursor-particle";
      document.body.appendChild(particle);

      const burst = 10 + Math.random() * 8;
      const drift = (Math.random() - 0.5) * 16;
      const fall = 46 + Math.random() * 30;
      const spin = angleDeg + (Math.random() - 0.5) * 180;
      const duration = 650 + Math.random() * 300;

      const start = "translate3d(" + (originX - 3.5) + "px, " + (originY - 3.5) + "px, 0) rotate(" + angleDeg + "deg)";
      const burstPoint = "translate3d(" + (originX - 3.5 + dirX * burst) + "px, " + (originY - 3.5 + dirY * burst) + "px, 0) rotate(" + (angleDeg + 40) + "deg)";
      const landed = "translate3d(" + (originX - 3.5 + dirX * burst + drift) + "px, " + (originY - 3.5 + dirY * burst + fall) + "px, 0) rotate(" + spin + "deg)";

      const animation = particle.animate(
        [
          { transform: start, opacity: 1, easing: "cubic-bezier(0.17, 0.89, 0.32, 1.25)" },
          { transform: burstPoint, opacity: 1, offset: 0.28, easing: "cubic-bezier(0.45, 0, 0.55, 1)" },
          { transform: landed, opacity: 0 },
        ],
        { duration: duration, fill: "forwards" }
      );
      animation.onfinish = () => particle.remove();
    });
  };

  document.addEventListener("click", (e) => {
    spawnDebris(e.clientX, e.clientY);

    // Snap to a circle immediately. If the click wasn't on something
    // interactive (is-interactive not set), releasing this class lets
    // the spikes grow back out via .custom-cursor__arm's own transition.
    cursor.classList.add("is-clicking");
    window.setTimeout(() => {
      cursor.classList.remove("is-clicking");
    }, 90);
  });
})();
