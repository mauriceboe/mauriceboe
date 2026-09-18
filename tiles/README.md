# The tiles

Every image in `../assets` is rendered from `tiles.html`, which follows the TREK release
style line: the same glass recipe, the same Poppins, the same restraint. Two themes, because
a profile is read on a white page as often as on a black one.

```bash
npm install playwright && npx playwright install chromium
node refresh.mjs   # pulls today's stars, pulls, locales and release into the template
node export.mjs    # renders every tile twice, 2x, transparent outside the corners
cp build/*-dark.png build/*-light.png ../assets/
```

`.github/workflows/tiles.yml` does exactly that once a day and commits only when a number
moved. Change the design here and nowhere else, then run the two scripts.
