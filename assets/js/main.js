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

  const INTERACTIVE_SELECTOR = 'a, button, summary, [role="button"]';
  // Elements debris can land on/bounce off, besides the floor and the
  // cursor itself. Kept to visually "solid" landmarks rather than every
  // node, since each one is checked against every live particle per frame.
  const OBSTACLE_SELECTOR = 'img, nav, button, h1, h2, h3, hr, .work-card, .hero__avatar, .carousel, .timeline';

  const CURSOR_RADIUS = 7;
  const PARTICLE_RADIUS = 3.5;
  const GRAVITY = 0.42;
  const AIR_DRAG = 0.992;
  const FLOOR_RESTITUTION = 0.32;
  const FLOOR_FRICTION = 0.75;
  const OBSTACLE_RESTITUTION = 0.4;
  const SETTLE_SPEED = 0.05;
  const MAX_PARTICLES = 140;

  // A single closed 16-vertex path, built once in both its spiky-star and
  // circle form (same vertex count/order in both, so the browser's CSS `d`
  // transition tweens vertex-to-vertex instead of needing to be redrawn
  // every frame) — see .custom-cursor__shape / .is-interactive in
  // components.css. One continuous path keeps the fill and outline a
  // single coherent shape instead of several unconnected pieces.
  const STAR_D =
    "M11.0,0.5 L12.65,7.03 L18.42,3.58 L14.97,9.35 L21.5,11.0 L14.97,12.65 L18.42,18.42 L12.65,14.97 L11.0,21.5 L9.35,14.97 L3.58,18.42 L7.03,12.65 L0.5,11.0 L7.03,9.35 L3.58,3.58 L9.35,7.03 Z";

  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 22 22"><path class="custom-cursor__shape" d="' + STAR_D + '"></path></svg>';

  document.body.appendChild(cursor);
  document.documentElement.classList.add("has-custom-cursor");

  let clientX = -100;
  let clientY = -100;

  document.addEventListener("mousemove", (e) => {
    clientX = e.clientX;
    clientY = e.clientY;
    cursor.classList.add("is-visible");
    cursor.classList.toggle("is-interactive", !!e.target.closest(INTERACTIVE_SELECTOR));
  });

  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-visible");
  });

  // ----- debris physics ------------------------------------------------
  // Document-space (not viewport) so particles keep their position in the
  // page as it scrolls, and so "the floor" can be the bottom of the whole
  // page rather than just whatever's in view.

  let obstacleRects = [];
  const refreshObstacles = () => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    obstacleRects = Array.from(document.querySelectorAll(OBSTACLE_SELECTOR))
      .map((el) => {
        if (el === cursor || cursor.contains(el)) return null;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return null;
        return { left: r.left + scrollX, right: r.right + scrollX, top: r.top + scrollY, bottom: r.bottom + scrollY };
      })
      .filter(Boolean);
  };
  refreshObstacles();
  window.addEventListener("load", refreshObstacles);
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refreshObstacles, 200);
  });

  const particles = [];

  const spawnDebris = (originClientX, originClientY) => {
    const originX = originClientX + window.scrollX;
    const originY = originClientY + window.scrollY;
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];

    angles.forEach((angleDeg) => {
      const rad = (angleDeg * Math.PI) / 180;
      const dirX = Math.sin(rad);
      const dirY = -Math.cos(rad);
      const speed = 3 + Math.random() * 3;

      const el = document.createElement("div");
      el.className = "cursor-particle";
      el.innerHTML = '<svg width="7" height="7" viewBox="0 0 7 7"><path d="M3.5,0 L7,7 L0,7 Z"></path></svg>';
      document.body.appendChild(el);

      particles.push({
        el: el,
        x: originX,
        y: originY,
        vx: dirX * speed,
        vy: dirY * speed - 2,
        angle: angleDeg,
        angularVel: (Math.random() - 0.5) * 14,
        settled: false,
      });
    });

    while (particles.length > MAX_PARTICLES) {
      const oldest = particles.shift();
      oldest.el.remove();
    }
  };

  const resolveObstacle = (p, rect) => {
    const closestX = Math.max(rect.left, Math.min(p.x, rect.right));
    const closestY = Math.max(rect.top, Math.min(p.y, rect.bottom));
    const dx = p.x - closestX;
    const dy = p.y - closestY;
    const dist = Math.hypot(dx, dy);
    if (dist >= PARTICLE_RADIUS || dist <= 0.001) return;
    const overlap = PARTICLE_RADIUS - dist;
    const nx = dx / dist;
    const ny = dy / dist;
    p.x += nx * overlap;
    p.y += ny * overlap;
    const vn = p.vx * nx + p.vy * ny;
    p.vx -= (1 + OBSTACLE_RESTITUTION) * vn * nx;
    p.vy -= (1 + OBSTACLE_RESTITUTION) * vn * ny;
    p.vx *= 0.85;
    p.vy *= 0.85;
    p.settled = false;
  };

  document.addEventListener("click", (e) => {
    spawnDebris(e.clientX, e.clientY);

    // Snap to a circle immediately. If the click wasn't on something
    // interactive (is-interactive not set), releasing this class lets
    // the points grow back out via .custom-cursor__shape's own transition.
    cursor.classList.add("is-clicking");
    window.setTimeout(() => {
      cursor.classList.remove("is-clicking");
    }, 90);
  });

  const tick = () => {
    cursor.style.transform = "translate3d(" + (clientX - 11) + "px, " + (clientY - 11) + "px, 0)";

    if (particles.length) {
      const cursorDocX = clientX + window.scrollX;
      const cursorDocY = clientY + window.scrollY;
      const floorY = document.documentElement.scrollHeight - PARTICLE_RADIUS;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!p.settled) {
          p.vy += GRAVITY;
          p.vx *= AIR_DRAG;
          p.x += p.vx;
          p.y += p.vy;
          p.angle += p.angularVel;
          p.angularVel *= 0.97;

          for (let j = 0; j < obstacleRects.length; j++) {
            resolveObstacle(p, obstacleRects[j]);
          }

          if (p.y > floorY) {
            p.y = floorY;
            p.vx *= FLOOR_FRICTION;
            p.angularVel *= 0.6;
            if (Math.abs(p.vy) > SETTLE_SPEED) {
              p.vy *= -FLOOR_RESTITUTION;
            } else {
              p.vy = 0;
            }
            if (Math.abs(p.vx) < SETTLE_SPEED && Math.abs(p.vy) < SETTLE_SPEED) {
              p.settled = true;
            }
          }
        }

        // Bump off the cursor whether or not the particle had settled —
        // moving the pointer through a resting pile should disturb it.
        const dx = p.x - cursorDocX;
        const dy = p.y - cursorDocY;
        const dist = Math.hypot(dx, dy);
        const minDist = PARTICLE_RADIUS + CURSOR_RADIUS;
        if (dist < minDist && dist > 0.001) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          p.x += nx * overlap;
          p.y += ny * overlap;
          p.vx += nx * overlap * 0.6;
          p.vy += ny * overlap * 0.6 - 0.6;
          p.angularVel += (Math.random() - 0.5) * 6;
          p.settled = false;
        }

        p.el.style.transform = "translate3d(" + (p.x - PARTICLE_RADIUS) + "px, " + (p.y - PARTICLE_RADIUS) + "px, 0) rotate(" + p.angle + "deg)";
      }
    }

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
