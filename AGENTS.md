# Maintaining Figures

- Read `README.md` and `CONTRIBUTING.md` before changing the catalog.
- `data/figures.json` is the canonical image index. Keep existing IDs stable and preserve source/author attribution.
- Store image files under `figures/`. Do not commit PDF documents, credentials, local absolute paths, downloaded paper text, or generated `_site/` files.
- Use `scripts/add_figure.py` for new images when practical. Other conferences and original images can use their own `venue` value.
- Shared choices live in `data/collections.json`; personal browser favorites are local to the viewer.
- Update the `updated` date in `data/config.json` when changing curated content.
- Run `python scripts/build_site.py` before publishing. For UI changes, verify search, image preview, comparison and shared links in the browser.
- Changes merged into `main` are published by `.github/workflows/pages.yml`.
