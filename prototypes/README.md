# /prototypes/

Standalone interactive prototype exports live here — one folder per
prototype, each with its own self-contained `index.html` (plus any CSS/JS/
image assets the export bundles alongside it). These are plain static
files: Jekyll copies them through untouched (no site nav/footer wrapped
around them, no Liquid processing), since a page with no YAML front matter
at the top is passed through as-is.

## Current prototypes

| Folder                        | Portfolio entry              | Upload path                              |
|--------------------------------|-------------------------------|-------------------------------------------|
| `tba-maternal-health/`         | TBA Maternal-Health Prototype | `prototypes/tba-maternal-health/index.html` |
| `rehnuma/`                     | Rehnuma                       | `prototypes/rehnuma/index.html`           |

## Adding a new prototype

1. Pick a short kebab-case slug for the project, e.g. `my-prototype`.
2. Upload the exported HTML as `prototypes/my-prototype/index.html`.
   If the export includes its own CSS/JS/images, upload those into the
   same `prototypes/my-prototype/` folder too (keep whatever relative
   paths the export already uses inside that folder — don't rename them
   unless you also update the references inside the HTML).
3. Background: your site's background is `#0D0E10`. If the prototype
   has any transparent/background areas meant to blend with the site
   (e.g. around its edges), match that color so there's no visible seam
   when it opens.
4. In `_data/work.yml`, find that project's entry and remove the
   `pending: true` and `suffix: "· soon"` lines from its "View Prototype"
   link so the button goes live. The `url` is already pre-set to
   `/prototypes/<slug>/`.

## Background color reference

- Base: `#0D0E10`
- Raised panel: `#17181B`
- Card: `#1E1F23`
- Accent (butter yellow): `#F2E3A0` / deep `#D9C67E`
