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
   5. Theme toggle. The site follows the OS setting (light -> rose,
      dark -> dark), live, including when the OS setting changes while
      the page is open. The nav button flips between the two by hand;
      that pick lasts for the tab's session (sessionStorage) until the
      OS setting next changes. The actual color swap is pure CSS (see
      tokens.css's [data-theme="rose"] block) — this just flips the
      attribute. A matching inline script in head.html applies it before
      first paint so there's no flash.
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

  const moonIcon = toggle.querySelector(".theme-toggle__icon--moon");
  const roseIcon = toggle.querySelector(".theme-toggle__icon--rose");
  const root = document.documentElement;

  // dark -> rose -> dark. Light is removed from the
  // rotation for now (not deleted from tokens.css, just unreachable from
  // this toggle) — a stale data-theme="light" from localStorage falls
  // back to dark via currentTheme() below rather than erroring. The icon
  // shown represents the theme that's actually active right now — the
  // label still describes what a click does.
  const ORDER = ["dark", "rose"];
  const CURRENT_ICON = { dark: moonIcon, rose: roseIcon };
  const LABEL = {
    dark: "Switch to rose theme",
    rose: "Switch to dark theme",
  };
  const ALL_ICONS = [moonIcon, roseIcon];

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
    const shown = CURRENT_ICON[theme];
    ALL_ICONS.forEach((icon) => setHidden(icon, icon !== shown));
    toggle.setAttribute("aria-label", LABEL[theme]);
    toggle.setAttribute("aria-pressed", String(theme !== "dark"));
  };

  const currentTheme = () => {
    const attr = root.getAttribute("data-theme");
    return ORDER.includes(attr) ? attr : "dark";
  };

  applyState(currentTheme());

  const setTheme = (theme) => {
    if (theme === "dark") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
    applyState(theme);
  };

  // The OS setting changing is a fresh signal of what the visitor wants
  // right now, so it wins over an earlier manual pick from the toggle.
  if (window.matchMedia) {
    const lightQuery = window.matchMedia("(prefers-color-scheme: light)");
    const followSystem = () => {
      try {
        sessionStorage.removeItem("theme");
      } catch (e) {}
      setTheme(lightQuery.matches ? "rose" : "dark");
    };
    if (lightQuery.addEventListener) {
      lightQuery.addEventListener("change", followSystem);
    } else if (lightQuery.addListener) {
      lightQuery.addListener(followSystem);
    }
  }

  toggle.addEventListener("click", () => {
    const next = ORDER[(ORDER.indexOf(currentTheme()) + 1) % ORDER.length];
    setTheme(next);
    try {
      sessionStorage.setItem("theme", next);
    } catch (e) {}
  });
})();

(function () {
  "use strict";

  if (!window.matchMedia) return;
  // No mouse to skin on touch devices, and no explosions there either
  // (by request) — in both cases, and for reduced-motion, just leave the
  // plain cursor:url() from base.css.
  if (window.matchMedia("(pointer: coarse)").matches) return;
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
  // The hero portrait's own <img> can run wider than the circle it's
  // cropped to (see .hero__avatar--round in components.css, which pans
  // the photo within the frame) — collide against .hero__avatar-frame,
  // the actual clipped circle on screen, and skip the img entirely.
  const SOLID_SELECTOR = "img:not(.hero__avatar--round), .text-highlight";
  const CONTAINER_SELECTOR = ".work-card, .contact-form__field input, .contact-form__field textarea, .contact-form__submit";
  // Every other obstacle here is a rectangle, resolved as an axis-aligned
  // box — fine for a square-ish card or input, but a bounding box drawn
  // around a circle still has 4 corners poking out past its round edge,
  // where debris would visibly stop on nothing. Truly round elements get
  // real circle-vs-circle collision instead (resolveCircle below).
  const CIRCLE_SELECTOR = ".hero__avatar-frame";

  const CURSOR_RADIUS = 6.5;
  const PARTICLE_RADIUS = 2.5;
  const GRAVITY = 0.42;
  const AIR_DRAG = 0.992;
  const OBSTACLE_RESTITUTION = 0.4;
  const SETTLE_SPEED = 0.05;
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
  // The exact star from the nav's explosions toggle (#debris-toggle), at
  // that icon's exact 13px size — see components.css; a click pops it
  // slightly and flings the debris, but the resting shape never changes.
  cursor.innerHTML =
    '<svg width="13" height="13" viewBox="0 0 22 22"><path class="custom-cursor__shape" d="M11.0,0.5 L12.65,7.03 L18.42,3.58 L14.97,9.35 L21.5,11.0 L14.97,12.65 L18.42,18.42 L12.65,14.97 L11.0,21.5 L9.35,14.97 L3.58,18.42 L7.03,12.65 L0.5,11.0 L7.03,9.35 L3.58,3.58 L9.35,7.03 Z"></path></svg>';

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
  let circleRects = [];
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
    const circles = [];

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

    document.querySelectorAll(CIRCLE_SELECTOR).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      circles.push({
        cx: r.left + scrollX + r.width / 2,
        cy: r.top + scrollY + r.height / 2,
        radius: Math.min(r.width, r.height) / 2,
      });
    });

    solidRects = solid;
    containerRects = containers;
    circleRects = circles;
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
    // A tiny copy of the cursor's star (same path as the nav toggle icon).
    el.innerHTML = '<svg width="5" height="5" viewBox="0 0 22 22"><path d="M11.0,0.5 L12.65,7.03 L18.42,3.58 L14.97,9.35 L21.5,11.0 L14.97,12.65 L18.42,18.42 L12.65,14.97 L11.0,21.5 L9.35,14.97 L3.58,18.42 L7.03,12.65 L0.5,11.0 L7.03,9.35 L3.58,3.58 L9.35,7.03 Z"></path></svg>';
    document.body.appendChild(el);
    return el;
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
        // debris that came from clicking inside it — and is still there
        // when the page unloads (see the settle block in tick(), which
        // clears this if it ends up resting anywhere else) — carries
        // across a navigation. Everything else is just local scatter for
        // the page it happened on and is meant to vanish with it.
        fromNav: !!fromNav,
      });
    });
  };

  // Persisted per visitor, independent of theme — defaults on. Declared
  // here (ahead of the save/rehydrate logic below) since turning
  // explosions off should also stop the nav pile from persisting and
  // being restored, not just stop new clicks from spawning debris.
  let debrisEnabled = true;
  try {
    debrisEnabled = localStorage.getItem("debrisEnabled") !== "off";
  } catch (e) {}

  // Persist whatever nav-origin debris is currently falling/resting so a
  // nav click's own page navigation doesn't erase it — the next page
  // picks those particles back up and keeps simulating them. Debris from
  // clicking anywhere else on the page is left out, since it belongs to
  // that page, not the (identical, cross-page) nav bar.
  const saveDebris = () => {
    try {
      const data = debrisEnabled
        ? particles.filter((p) => p.fromNav).map((p) => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, angle: p.angle, angularVel: p.angularVel }))
        : [];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  };
  window.addEventListener("pagehide", saveDebris);
  window.addEventListener("beforeunload", saveDebris);

  (() => {
    if (!debrisEnabled) return;
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

  // True circle-vs-circle collision (both the obstacle and the particle
  // are round), for elements like the hero portrait where an AABB rect
  // would still have 4 corners sticking out past the actual circular
  // edge debris should bounce off.
  const resolveCircle = (p, circle) => {
    const dx = p.x - circle.cx;
    const dy = p.y - circle.cy;
    const dist = Math.hypot(dx, dy);
    const minDist = circle.radius + PARTICLE_RADIUS;
    if (dist >= minDist || dist <= 0.001) return false;
    const overlap = minDist - dist;
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

  // Two debris circles overlapping each other — pushed apart so they
  // never visibly pass through one another. A still-moving particle
  // landing on a resting pile knocks it loose (impulse + wakes both up);
  // two particles already at rest just touching are separated without
  // being woken, so a settled pile doesn't jitter itself forever.
  const resolveParticleCollision = (a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    const minDist = PARTICLE_RADIUS * 2;
    if (dist >= minDist) return;

    const nx = dist > 0.001 ? dx / dist : 1;
    const ny = dist > 0.001 ? dy / dist : 0;
    const overlap = minDist - dist;
    const aMovable = !a.settled;
    const bMovable = !b.settled;

    if (aMovable && bMovable) {
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;
    } else if (aMovable) {
      a.x -= nx * overlap;
      a.y -= ny * overlap;
    } else if (bMovable) {
      b.x += nx * overlap;
      b.y += ny * overlap;
    } else {
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;
      return;
    }

    const velAlongNormal = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (velAlongNormal < 0) {
      const impulse = -(1 + OBSTACLE_RESTITUTION) * velAlongNormal * 0.5;
      a.vx -= impulse * nx;
      a.vy -= impulse * ny;
      b.vx += impulse * nx;
      b.vy += impulse * ny;
    }

    a.settled = false;
    b.settled = false;
    a.stuckToNav = false;
    b.stuckToNav = false;
  };

  // No separate clear button anymore — turning explosions off sweeps the
  // board too, so flipping it back on always starts clean rather than
  // leaving stale debris around that can no longer be clicked away.
  const clearAllDebris = () => {
    particles.forEach((p) => p.el.remove());
    particles.length = 0;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const toggleButton = document.getElementById("debris-toggle");
  // The crossed-out look itself is driven by data-debris="off" on <html>
  // (CSS in layout.css), which head.html's pre-paint script already sets
  // before first paint — this only needs to keep it (and the button's
  // a11y attributes) in sync from here on, not set it from scratch.
  const applyToggleState = () => {
    if (debrisEnabled) {
      document.documentElement.removeAttribute("data-debris");
    } else {
      document.documentElement.setAttribute("data-debris", "off");
    }
    if (!toggleButton) return;
    toggleButton.setAttribute("aria-pressed", String(!debrisEnabled));
    toggleButton.setAttribute("aria-label", debrisEnabled ? "Turn off click explosions" : "Turn on click explosions");
  };
  applyToggleState();

  if (toggleButton) {
    toggleButton.addEventListener("click", (e) => {
      debrisEnabled = !debrisEnabled;
      try {
        localStorage.setItem("debrisEnabled", debrisEnabled ? "on" : "off");
      } catch (e2) {}
      if (debrisEnabled) {
        // Flipping it back on should feel the same as any other click
        // that explodes — not a silent state change.
        spawnDebris(e.clientX, e.clientY, true);
        cursor.classList.add("is-clicking");
        window.setTimeout(() => cursor.classList.remove("is-clicking"), 90);
      } else {
        clearAllDebris();
      }
      applyToggleState();
    });
  }

  const explodeAt = (e) => {
    // A utility control, not something to explode debris from — that
    // would be fighting its own purpose.
    if (e.target.closest("#debris-toggle")) return;
    if (!debrisEnabled) return;

    spawnDebris(e.clientX, e.clientY, !!e.target.closest(".nav"));

    cursor.classList.add("is-clicking");
    window.setTimeout(() => {
      cursor.classList.remove("is-clicking");
    }, 90);
  };

  // A mouse explodes on press, not release: a "click" only fires once
  // the button comes back up, but a text field (the contact form's
  // Name/Email) focuses and lights up its border on press — so the first
  // click into one looked like nothing exploded until the release, while
  // every later click (field already focused) didn't show that gap.
  // Touch stays on "click" so a finger that starts a scroll never bursts.
  // The flag stops that press's own click from bursting a second time.
  let burstOnPress = false;
  document.addEventListener("pointerdown", (e) => {
    burstOnPress = e.pointerType === "mouse" && e.button === 0;
    if (burstOnPress) explodeAt(e);
  });
  document.addEventListener("click", (e) => {
    if (burstOnPress) {
      burstOnPress = false;
      return;
    }
    explodeAt(e);
  });

  const tick = () => {
    cursor.style.transform = "translate3d(" + (clientX - 6.5) + "px, " + (clientY - 6.5) + "px, 0)";

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
            for (let j = 0; j < circleRects.length; j++) {
              if (resolveCircle(p, circleRects[j])) restingOnTop = true;
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
              } else {
                // Landed somewhere that isn't the nav — even if it
                // started as a nav-origin burst, it's fallen out and
                // belongs to this page now, not the (identical,
                // cross-page) nav bar. Stop carrying it across a
                // navigation (see fromNav's use in saveDebris).
                p.fromNav = false;
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
      }

      // Debris-on-debris: every pair gets a shot at being pushed apart
      // (so they never visually sit on top of each other), but an
      // impulse/wake-up only happens when at least one side is actually
      // still moving — two already-resting particles just touching
      // shouldn't jitter each other awake forever.
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          resolveParticleCollision(particles[i], particles[j]);
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.el.style.transform = "translate3d(" + (p.x - PARTICLE_RADIUS) + "px, " + (p.y - PARTICLE_RADIUS) + "px, 0) rotate(" + p.angle + "deg)";
      }
    }

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
