# Brand assets

Replace the SVG files in this directory when applying a new visual identity:

- `logo.svg` is the full logo for external or future marketing surfaces.
- `logo-mark.svg` is the compact mark used by application chrome.
- `../favicon.svg` is the browser favicon and should normally match the compact mark.

The application display name is configured by `VITE_APP_NAME`; it defaults to `SaaS` in `client/src/config/brand.js`.

For a deployment-specific name, set `VITE_APP_NAME` before building the client. Public asset paths remain stable, so the SVG files can be replaced without changing Vue components.
