# iamrommel.github.io — Published Pages hub

Single public repo hosting all GitHub Pages sites. Served at **https://iamrommel.github.io/**

## Structure
- `index.html` — landing hub that links to every published page.
- `<project>/index.html` — one folder per published page, served at `https://iamrommel.github.io/<project>/`.
- `.md` files render to HTML via Jekyll (default). HTML files are served as-is.

## Current pages
| Page | URL |
|------|-----|
| Candy Packaging Machine | https://iamrommel.github.io/candy-packing-machine/ |

## Add a new page
1. Create `new-topic/index.html` (or `new-topic.md`).
2. Add a tile linking to it in the root `index.html`.
3. Commit + push to `main` — GitHub Pages rebuilds automatically (~1 min).
