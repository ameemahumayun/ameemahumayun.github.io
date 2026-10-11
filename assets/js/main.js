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
   5. Theme toggle. Cycles the data-theme attribute on <html> through
      dark -> light -> rose -> dark, persists the choice to localStorage,
      and keeps the nav button's icon/label in sync. The actual color
      swap is pure CSS (see tokens.css's [data-theme="light"/"rose"]
      blocks) — this just flips the attribute. A matching inline script
      in head.html applies the stored choice before first paint so
      there's no flash.
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
  const roseIcon = toggle.querySelector(".theme-toggle__icon--rose");
  const root = document.documentElement;

  // dark -> light -> rose -> dark. The icon shown is always the *next*
  // theme a click will switch to (sun showing while dark = "tap for
  // light"), matching the convention the sun/moon pair already had.
  const ORDER = ["dark", "light", "rose"];
  const NEXT_ICON = { dark: sunIcon, light: roseIcon, rose: moonIcon };
  const LABEL = { dark: "Switch to light theme", light: "Switch to rose theme", rose: "Switch to dark theme" };

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
    const shown = NEXT_ICON[theme];
    [sunIcon, moonIcon, roseIcon].forEach((icon) => setHidden(icon, icon !== shown));
    toggle.setAttribute("aria-label", LABEL[theme]);
    toggle.setAttribute("aria-pressed", String(theme !== "dark"));
  };

  const currentTheme = () => {
    const attr = root.getAttribute("data-theme");
    return ORDER.includes(attr) ? attr : "dark";
  };

  applyState(currentTheme());

  toggle.addEventListener("click", () => {
    const next = ORDER[(ORDER.indexOf(currentTheme()) + 1) % ORDER.length];
    if (next === "dark") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", next);
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
  // Reduced-motion means no flying debris at all — leave the plain
  // cursor:url() from base.css. Touch devices DO still get the tap
  // explosion (a "click" fires on tap with real coordinates); they just
  // never see the custom cursor dot itself, since mousemove never fires
  // there and it stays parked off-screen.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Debris only lands where there's an actual design element to catch it —
  // never a bare patch of background, and not on plain body text either.
  // Three kinds of barrier:
  //  - dividers: every hairline rule on the site, each pinned to just its
  //    own visible edge rather than its (much bigger) parent's full box —
  //    using the whole nav/footer/etc. rect would let debris rest
  //    anywhere in their padding, nowhere near the actual line.
  //  - solid: images and the accent-highlighted page/section headings
  //    (Portfolio, CV, Recent Updates) — bounces off the outside only.
  //  - container: bordered boxes debris should be caught *inside* as well
  //    as outside — the work-card listings, the contact form's fields,
  //    and its send button.
  const DIVIDER_EDGES = [
    { selector: ".nav", edge: "bottom" },
    { selector: ".footer", edge: "top" },
    { selector: "#recent-updates", edge: "top" },
    { selector: ".accordion__item", edge: "bottom" },
    { selector: ".cv-entry:not(:last-child)", edge: "bottom" },
    { selector: ".cv-skills__row:not(:last-child)", edge: "bottom" },
  ];
  const DIVIDER_BAND = 6;
  const SOLID_SELECTOR = "img, .text-highlight";
  const CONTAINER_SELECTOR = ".work-card, .contact-form__field input, .contact-form__field textarea, .contact-form__submit";

  const CURSOR_RADIUS = 7;
  const PARTICLE_RADIUS = 3.5;
  const GRAVITY = 0.42;
  const AIR_DRAG = 0.992;
  const OBSTACLE_RESTITUTION = 0.4;
  const SETTLE_SPEED = 0.05;
  const MAX_PARTICLES = 140;
  // Nothing was there to catch it — let it fall out of view rather than
  // stopping on an invisible floor, and stop simulating it once it's well
  // past the page's own content.
  const FALLOUT_MARGIN = 400;
  // Splitting each frame's movement into several smaller steps (each
  // re-checking collisions) stops a fast particle from tunnelling straight
  // through a thin divider band between one frame and the next — the
  // nav's rule line is only DIVIDER_BAND px tall, easy to skip over
  // otherwise, and landing there reliably is the whole point now that
  // debris is expected to persist across a nav click's page navigation.
  const SUBSTEPS = 4;
  // A nav click navigates away, which would normally destroy its burst
  // mid-fall — stash nav-origin debris here on the way out and pick it
  // back up on the next page, so the nav reads as one continuous pile
  // rather than restarting every click. Debris from elsewhere on the page
  // is deliberately left out of this (see spawnDebris' fromNav flag).
  const STORAGE_KEY = "site-cursor-debris-v1";

  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";
  cursor.setAttribute("aria-hidden", "true");
  // A plain dot, always — see components.css; a click pops it slightly
  // and flings the debris, but the resting shape never changes.
  cursor.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 22 22"><circle class="custom-cursor__shape" cx="11" cy="11" r="5"></circle></svg>';

  document.body.appendChild(cursor);
  document.documentElement.classList.add("has-custom-cursor");

  let clientX = -100;
  let clientY = -100;

  document.addEventListener("mousemove", (e) => {
    clientX = e.clientX;
    clientY = e.clientY;
    cursor.classList.add("is-visible");
  });

  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-visible");
  });

  // ----- debris physics ------------------------------------------------
  // Document-space (not viewport) so particles and the obstacles they can
  // land on keep their relative position as the page scrolls.

  let solidRects = [];
  let containerRects = [];
  // The debris particles themselves are position:absolute, so once any of
  // them fall past the rest of the content they inflate
  // document.documentElement.scrollHeight — which would keep pushing the
  // "nothing caught it, let it go" threshold below back further than the
  // particle can fall, and it would free-fall forever. Anchor to the
  // footer's own bottom edge instead, which every page layout ends with.
  let pageBottom = 0;
  // .nav is position:sticky, so unlike every other divider its screen
  // position stays constant while its *document* position slides down by
  // the scroll amount — a document-space rect snapshotted once on load
  // would immediately go stale the moment the page scrolls. Kept in
  // viewport coordinates instead (which don't change for a stuck sticky
  // element) and converted to document space fresh every tick.
  let navDivider = null;
  const refreshObstacles = () => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const solid = [];
    const containers = [];

    const footer = document.querySelector(".footer");
    if (footer) {
      const fr = footer.getBoundingClientRect();
      pageBottom = fr.bottom + scrollY;
    }

    DIVIDER_EDGES.forEach(({ selector, edge }) => {
      document.querySelectorAll(selector).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const lineY = edge === "bottom" ? r.bottom : r.top;

        if (el.classList.contains("nav")) {
          navDivider = {
            left: r.left,
            right: r.right,
            top: lineY - DIVIDER_BAND / 2,
            bottom: lineY + DIVIDER_BAND / 2,
          };
          return;
        }

        solid.push({
          left: r.left + scrollX,
          right: r.right + scrollX,
          top: lineY + scrollY - DIVIDER_BAND / 2,
          bottom: lineY + scrollY + DIVIDER_BAND / 2,
        });
      });
    });

    document.querySelectorAll(SOLID_SELECTOR).forEach((el) => {
      if (el === cursor || cursor.contains(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      solid.push({ left: r.left + scrollX, right: r.right + scrollX, top: r.top + scrollY, bottom: r.bottom + scrollY });
    });

    document.querySelectorAll(CONTAINER_SELECTOR).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      containers.push({ left: r.left + scrollX, right: r.right + scrollX, top: r.top + scrollY, bottom: r.bottom + scrollY });
    });

    solidRects = solid;
    containerRects = containers;
  };
  refreshObstacles();
  window.addEventListener("load", refreshObstacles);
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(refreshObstacles, 200);
  });

  const particles = [];

  const createParticleEl = () => {
    const el = document.createElement("div");
    el.className = "cursor-particle";
    el.innerHTML = '<svg width="7" height="7" viewBox="0 0 7 7"><circle cx="3.5" cy="3.5" r="3"></circle></svg>';
    document.body.appendChild(el);
    return el;
  };

  const trimParticles = () => {
    while (particles.length > MAX_PARTICLES) {
      const oldest = particles.shift();
      oldest.el.remove();
    }
  };

  const spawnDebris = (originClientX, originClientY, fromNav) => {
    const originX = originClientX + window.scrollX;
    const originY = originClientY + window.scrollY;
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];

    angles.forEach((angleDeg) => {
      const rad = (angleDeg * Math.PI) / 180;
      const dirX = Math.sin(rad);
      const dirY = -Math.cos(rad);
      const speed = 4.5 + Math.random() * 3.5;

      particles.push({
        el: createParticleEl(),
        x: originX,
        y: originY,
        vx: dirX * speed,
        vy: dirY * speed - 2,
        angle: angleDeg,
        angularVel: (Math.random() - 0.5) * 14,
        settled: false,
        // The nav is the one thing that's identical on every page, so only
        // debris that came from clicking inside it carries across a
        // navigation — everything else is just local scatter for the page
        // it happened on and is meant to vanish with it.
        fromNav: !!fromNav,
      });
    });

    trimParticles();
  };

  // Persist whatever nav-origin debris is currently falling/resting so a
  // nav click's own page navigation doesn't erase it — the next page
  // picks those particles back up and keeps simulating them. Debris from
  // clicking anywhere else on the page is left out, since it belongs to
  // that page, not the (identical, cross-page) nav bar.
  const saveDebris = () => {
    try {
      const data = particles
        .filter((p) => p.fromNav)
        .map((p) => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, angle: p.angle, angularVel: p.angularVel }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  };
  window.addEventListener("pagehide", saveDebris);
  window.addEventListener("beforeunload", saveDebris);

  (() => {
    let saved;
    try {
      saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      saved = [];
    }
    saved.forEach((d) => {
      particles.push({
        el: createParticleEl(),
        x: d.x,
        y: d.y,
        vx: d.vx,
        vy: d.vy,
        angle: d.angle,
        angularVel: d.angularVel,
        // Always re-settle against this page's own obstacles rather than
        // trusting the flag from whatever page it was saved on — the
        // layout underneath it may not be identical.
        settled: false,
        // Carried over specifically because it was nav debris — keep it
        // tagged so it keeps surviving further nav navigations too.
        fromNav: true,
      });
    });
    trimParticles();
  })();

  // Returns true if p was actually resting against rect's top edge this
  // step (not just grazing a side/corner) — used to decide whether the
  // particle has come to rest on it.
  const resolveObstacle = (p, rect) => {
    const closestX = Math.max(rect.left, Math.min(p.x, rect.right));
    const closestY = Math.max(rect.top, Math.min(p.y, rect.bottom));
    const dx = p.x - closestX;
    const dy = p.y - closestY;
    const dist = Math.hypot(dx, dy);
    if (dist >= PARTICLE_RADIUS || dist <= 0.001) return false;
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
    return ny < -0.5;
  };

  // Unlike resolveObstacle, a "container" rect (work-card, a contact-form
  // field, the send button) should hold a particle whose center is
  // already inside it, not just block it from outside — bouncing it off
  // whichever of the box's 4 inner walls it gets close to, same as the
  // box's own edges do from the outside (handled by just falling back to
  // resolveObstacle when the particle isn't inside).
  const resolveContainer = (p, rect) => {
    const inside = p.x > rect.left && p.x < rect.right && p.y > rect.top && p.y < rect.bottom;
    if (!inside) return resolveObstacle(p, rect);

    let restingOnFloor = false;

    if (p.x - rect.left < PARTICLE_RADIUS) {
      p.x = rect.left + PARTICLE_RADIUS;
      if (p.vx < 0) p.vx *= -OBSTACLE_RESTITUTION;
    } else if (rect.right - p.x < PARTICLE_RADIUS) {
      p.x = rect.right - PARTICLE_RADIUS;
      if (p.vx > 0) p.vx *= -OBSTACLE_RESTITUTION;
    }

    if (p.y - rect.top < PARTICLE_RADIUS) {
      p.y = rect.top + PARTICLE_RADIUS;
      if (p.vy < 0) p.vy *= -OBSTACLE_RESTITUTION;
    } else if (rect.bottom - p.y < PARTICLE_RADIUS) {
      p.y = rect.bottom - PARTICLE_RADIUS;
      if (p.vy > 0) p.vy *= -OBSTACLE_RESTITUTION;
      // Friction: resting on the container's floor only ever reflected vy
      // — vx was untouched, so a particle with any sideways speed left
      // over just kept sliding at (almost) that speed forever, decaying
      // only via the very weak global air-drag. Without this it could
      // take upwards of 10 seconds to actually cross the settle threshold.
      p.vx *= 0.85;
      restingOnFloor = true;
    }

    return restingOnFloor;
  };

  document.addEventListener("click", (e) => {
    // The clear-debris button is a utility control, not something to
    // explode debris from — it would be fighting its own purpose.
    if (e.target.closest("#debris-clear")) return;

    spawnDebris(e.clientX, e.clientY, !!e.target.closest(".nav"));

    cursor.classList.add("is-clicking");
    window.setTimeout(() => {
      cursor.classList.remove("is-clicking");
    }, 90);
  });

  const clearButton = document.getElementById("debris-clear");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      particles.forEach((p) => p.el.remove());
      particles.length = 0;
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    });
  }

  const tick = () => {
    cursor.style.transform = "translate3d(" + (clientX - 11) + "px, " + (clientY - 11) + "px, 0)";

    if (particles.length) {
      const cursorDocX = clientX + window.scrollX;
      const cursorDocY = clientY + window.scrollY;
      const falloutY = pageBottom + FALLOUT_MARGIN;
      // .nav's document position depends on the *current* scroll (see
      // navDivider above) — re-derive it once per frame rather than once
      // per load/resize.
      const navRectDoc = navDivider && {
        left: navDivider.left + window.scrollX,
        right: navDivider.right + window.scrollX,
        top: navDivider.top + window.scrollY,
        bottom: navDivider.bottom + window.scrollY,
      };

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        let fellOut = false;

        if (!p.settled) {
          for (let s = 0; s < SUBSTEPS && !fellOut; s++) {
            p.vy += GRAVITY / SUBSTEPS;
            p.vx *= Math.pow(AIR_DRAG, 1 / SUBSTEPS);
            p.x += p.vx / SUBSTEPS;
            p.y += p.vy / SUBSTEPS;
            p.angle += p.angularVel / SUBSTEPS;

            let restingOnTop = false;
            let onNav = false;
            if (navRectDoc && resolveObstacle(p, navRectDoc)) {
              restingOnTop = true;
              onNav = true;
            }
            for (let j = 0; j < solidRects.length; j++) {
              if (resolveObstacle(p, solidRects[j])) restingOnTop = true;
            }
            for (let j = 0; j < containerRects.length; j++) {
              if (resolveContainer(p, containerRects[j])) restingOnTop = true;
            }
            if (restingOnTop && Math.abs(p.vx) < SETTLE_SPEED && Math.abs(p.vy) < SETTLE_SPEED) {
              p.vx = 0;
              p.vy = 0;
              p.angularVel = 0;
              p.settled = true;
              // Riding on the sticky nav: remember where relative to the
              // *viewport*, not the document, so it can be re-derived
              // from the live scroll position every frame below instead
              // of staying frozen at today's document coordinates.
              p.stuckToNav = onNav;
              if (onNav) {
                p.navOffsetX = p.x - window.scrollX;
                p.navOffsetY = p.y - window.scrollY;
              }
            }

            // Nothing caught it on the way down — let it go rather than
            // stopping it on a floor that isn't actually part of the page.
            if (p.y > falloutY) {
              fellOut = true;
            }
          }
          p.angularVel *= 0.97;
        } else if (p.stuckToNav) {
          p.x = p.navOffsetX + window.scrollX;
          p.y = p.navOffsetY + window.scrollY;
        }

        if (fellOut) {
          p.el.remove();
          particles.splice(i, 1);
          continue;
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
          p.stuckToNav = false;
        }

        p.el.style.transform = "translate3d(" + (p.x - PARTICLE_RADIUS) + "px, " + (p.y - PARTICLE_RADIUS) + "px, 0) rotate(" + p.angle + "deg)";
      }
    }

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
