# ameemah.github.io

Personal portfolio. Built with **Jekyll**, which GitHub Pages runs automatically
on every push — you don't install anything. Shared chrome (nav, footer, head)
lives in ONE place each, so a change propagates to every page.

---

## Where to edit what

| You want to change... | Edit this | Applies to |
|---|---|---|
| **Nav links / labels** | `_config.yml` → `nav_links` | every page |
| **Footer (email, LinkedIn, location)** | `_config.yml` | every page |
| **Nav markup/structure** | `_includes/nav.html` | every page |
| **Footer markup** | `_includes/footer.html` | every page |
| **`<head>` / meta / fonts** | `_includes/head.html` | every page |
| **Page wrapper** | `_layouts/default.html` | every page |
| **Colors, type, spacing** | `assets/css/tokens.css` | whole site |
| **A component's look** | `assets/css/components.css` | everywhere it's used |
| **A page's actual content** | that page's `.html` (below the `---`) | that page only |

The big win: **the nav is now defined once.** To add a link, add an entry under
`nav_links` in `_config.yml`. Done — it shows on every page.

---

## Structure

```
ameemah.github.io/
├── _config.yml              Site settings + nav_links + footer data
├── _includes/
│   ├── head.html            <head> — shared
│   ├── nav.html             global nav — rendered from _config nav_links
│   └── footer.html          footer — shared
├── _layouts/
│   ├── default.html         head + nav + {content} + footer
│   └── case-study.html      default + scroll-spy JS
├── index.html               Homepage  (front-matter + content only)
├── 404.html
├── work/
│   ├── index.html           Work listing
│   └── beyond-euphemisms/index.html   Case study (layout: case-study)
├── studio/index.html
├── cv/index.html
├── contact/index.html
├── assets/
│   ├── css/                 tokens · reset · base · layout · components · main
│   └── js/main.js           section-rail scroll-spy
├── Gemfile                  local dev only (GitHub ignores it)
└── README.md
```

### How a page works now
Each page is just front-matter + its unique content. Example top of a page:

```
---
layout: default      # or case-study
title: Work          # used in <title>; set to false to omit
description: ...      # meta description
active: work         # highlights the matching nav link
nav_tag: Case Study  # OPTIONAL — shows the "/ Case Study" tag (case studies only)
---
```

Everything below the closing `---` is the page body. Nav, head, and footer are
injected by the layout — you never copy them again.

---

## Adding a new case study
1. Create `work/<slug>/index.html`.
2. Front-matter: `layout: case-study`, `title:`, `active: work`,
   `nav_tag: Case Study`.
3. Body: a `<header class="hero">…</header>`, then the
   `<div class="layout-with-rail">` with a `.rail` (section list) and
   `.rail-content` wrapping your `<section>`s. Copy the existing case study
   as a template.
4. Add a `.work-card` for it in `work/index.html`.

## Adding a new top-level page (e.g. /writing/)
1. Create `writing/index.html` with `layout: default` + `active: writing`.
2. Add to `_config.yml` → `nav_links`. That's the only nav edit needed.

---

## Local preview (optional)
GitHub builds the site for you, so this is only if you want to see changes
before pushing. Requires Ruby:
```
bundle install
bundle exec jekyll serve
```
Then open http://localhost:4000. If you don't want to install Ruby, just push
and check the live site (rebuilds in ~1 min).

> Plain double-click of an `.html` file will NOT render correctly anymore —
> the pages are now Jekyll source (front-matter + Liquid), not finished HTML.
> Use `jekyll serve` locally, or just rely on the GitHub build.

---

## Deploy
Push to `main`. GitHub Pages detects Jekyll and builds automatically.
Settings → Pages → Source: "Deploy from a branch" → `main` / root.
Live in ~1 min at https://ameemah.github.io. **Hard-refresh** after deploys.

---

## TODO
- [ ] Drop CV file at `/assets/ameemah-humayun-cv.pdf`
- [ ] Fill in Studio + Contact content
- [ ] Real Paper link for the SOUPS study (currently `#`) in work/index.html
- [ ] Favicon + OG share image
- [ ] Build out remaining case studies
