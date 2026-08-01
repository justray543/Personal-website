# Ray Jinglong Chen — personal site

Online CV. Business development in digital assets and fintech, Berlin.

Static: four HTML pages, one stylesheet, two scripts. No framework, no build
step, no dependencies beyond a Google Fonts link.

## Notable pieces

- `assets/map.js` — interactive EU–APAC map. The dotted landmass is generated at
  runtime by point-in-polygon testing a grid against schematic continent
  outlines, so there is no geodata dependency and it works offline.
- `assets/site.js` — canvas light-band field, cursor glow, decrypt-on-hover
  headings, scroll reveals, theme handling.
- `assets/site.css` — every text colour verified at WCAG AA (>= 4.5:1) in both
  light and dark themes.

## Run locally

    python3 -m http.server 8080

Then open http://localhost:8080
