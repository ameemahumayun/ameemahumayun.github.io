# ameemahumayun.github.io

Personal portfolio. Built with **Jekyll**, which GitHub Pages runs automatically
on every push — nothing to install. Shared chrome (nav, footer, head) lives in
ONE place each, so a change propagates to every page.

https://ameemahumayun.github.io/

---

## Where to edit what

| You want to change... | Edit this | Applies to |
|---|---|---|
| **Nav links / labels / order** | `_config.yml` → `nav_links` | every page |
| **Footer (email, LinkedIn, location)** | `_config.yml` | every page |
| **Nav markup/structure** | `_includes/nav.html` | every page |
| **Footer markup** | `_includes/footer.html` | every page |
| **`<head>` / meta / fonts** | `_includes/head.html` | every page |
| **Page wrapper** | `_layouts/default.html` | every page |
| **Accent color, type, spacing** | `assets/css/tokens.css` | whole site |
| **A component's look** | `assets/css/components.css` | everywhere it's used |
| **Header sizing, nav, sections** | `assets/css/layout.css` | whole site |
| **A page's actual content** | that page's `.html` (below the `---`) | that page only |

**The nav is defined once.** To add/rename/reorder a link, edit the
`nav_links` list in `_config.yml`. No HTML editing.

---

## Stack

Static site — **Jekyll** (static site generator) + **Liquid** templating,
plain **HTML / CSS / vanilla JS**, hosted on **GitHub Pages**. No frameworks,
no backend, no database.

---

## Structure

ameemahumayun.github.io/
├── _config.yml              Site settings + nav_links + footer data
├── _includes/
│   ├── head.html            <head> — shared
│   ├── nav.html             global nav — rendered from _config nav_links
│   └── footer.html          footer — shared
├── _layouts/
│   ├── default.html         head + nav + {content} + footer
│   └── case-study.html      default + scroll-spy JS
├── index.html               Homepage (hero + recent-updates timeline)
├── 404.html
├── work/
│   ├── index.html           Work listing (work-cards)
│   └── beyond-euphemisms/index.html   Case study (layout: case-study)
├── studio/index.html        Artwork / creative work
├── cv/index.html            CV: download buttons + collapsible accordion
├── contact/index.html
├── assets/
│   ├── css/                 tokens · reset · base · layout · components · main
│   ├── js/main.js           section-rail scroll-spy
│   ├── cv/                  the three CV PDFs go here
│   └── images/
├── Gemfile                  local dev only (GitHub ignores it)
└── README.md

---

## Design language

Warm dark editorial. Warm near-black background, warm bone body text, a single
**muted accent** (current value in `tokens.css` — `--color-accent` /
`--color-accent-deep`). Two fonts: **Nunito Sans** (structural) and **Fraunces
italic** via the `.serif` class — used for editorial accent phrases and, crucially,
the **romanized Urdu terms** in the case study (the site's visual signature).
Structure is built on **hairline rules, not boxes**. Restrained, minimal,
senior-portfolio tone — no decorative taglines.

Rule: never put raw hex/px values in pages or in non-token CSS. Everything
flows from the variables in `tokens.css`, so the whole site restyles from one
file. (Two intentional exceptions: the muted "broken-text" colors inside the
case-study `.terminal` block.)

---

## How a page works

Each page is front-matter + its unique content. The nav, head, and footer are
injected by the layout — never copied per page.

layout: default      # or case-study
title: Work          # used in <title>; set to false to omit
description: ...      # meta description
active: work         # highlights the matching nav link (must equal a nav key)
nav_tag: Case Study  # OPTIONAL — shows the "/ Case Study" contextual tag

**Active nav highlight:** a page's `active:` value must exactly match the
`key:` of the nav link in `_config.yml`. (`home` ↔ `home`, `work` ↔ `work`.)

---

## Headers: two kinds

- **`.hero`** — the larger header. Used on the homepage, CV, Contact, and case
  studies. Markup: `<header class="hero"><div class="hero__inner">…`
- **`.page-head`** — the compact header. Used on listing/utility pages (Work,
  Studio). Markup: `<header class="page-head"><div class="page-head__inner">`
  with `<h1 class="page-head__title">` and `<p class="page-head__intro">`.

To convert one to the other, swap those class names.

---

## Components (in `components.css`, numbered index at top)

section-num · eyebrow-rule · meta · ledger · quote · callout · duo · stages ·
framework · insight · eval · terminal · failure · principle · confidential ·
outcomes · cite · section rail (`.rail`) · work-card · page-head · hero avatar ·
accordion + subaccordion (collapsible CV) · timeline.

Build new pages by assembling these classes — don't write new CSS per page.

---

## Common tasks

**Add a case study**
1. Create `work/<slug>/index.html`.
2. Front-matter: `layout: case-study`, `title:`, `active: work`, `nav_tag: Case Study`.
3. Body: a `<header class="hero">`, then `<div class="layout-with-rail">` with a
   `.rail` (section list) + `.rail-content` wrapping your `<section>`s. Copy the
   existing case study as a template.
4. Add a `.work-card` for it in `work/index.html`.

**Add a top-level page** (e.g. `/writing/`)
1. Create `writing/index.html` with `layout: default` + `active: writing`.
2. Add it to `nav_links` in `_config.yml` (with a matching `key: writing`).

**Add a CV section** — copy a `<details class="accordion__item">` block in
`cv/index.html`. Add `open` to its `<details>` tag to have it expand on load.

**Add a recent-updates entry** — copy a `.timeline__item` block in `index.html`,
newest at the top.

**Change the accent color** — edit `--color-accent` and `--color-accent-deep`
in `tokens.css`. Test legibility of small uppercase labels against the dark bg.

---

## Local preview (optional)

GitHub builds the site for you; this is only for previewing before pushing.
Requires Ruby:

### bundle install
### bundle exec jekyll serve   # → http://localhost:4000

Don't want Ruby? Just push and check the live site (~1 min rebuild).

> Double-clicking an `.html` file will NOT render correctly — pages are Jekyll
> source (front-matter + Liquid), not finished HTML. Use `jekyll serve` or the
> GitHub build.

---

## Deploy

Push to `main`. GitHub Pages detects Jekyll and builds automatically.
Settings → Pages → Source: "Deploy from a branch" → `main` / root.
Live in ~1 min at https://ameemahumayun.github.io.

**Caching:** after a deploy, hard-refresh (Ctrl/Cmd+Shift+R) or use DevTools →
Network → "Disable cache" while editing. Returning visitors get fresh files
automatically (short cache lifetime); the stale-view issue is only a
you-while-editing thing.

---

## TODO
- [ ] Drop the three CV PDFs in `/assets/cv/` (research, uiux, general)
- [ ] Fill in Studio content (currently placeholder)
- [ ] Real Paper link for the SOUPS study (currently `#`) in work/index.html
- [ ] Real LinkedIn/external links open in new tab (`target="_blank" rel="noopener"`)
- [ ] Favicon + OG share image
- [ ] Build out remaining case studies (shared-devices, fetal-sex-disclosure, rehnuma)
