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
