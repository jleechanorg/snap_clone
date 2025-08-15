# Snapchat Profile React Clone Spec

## Overview
This project creates a React application that can render public Snapchat profile pages.
It fetches the live profile HTML for a given username, extracts relevant strings and assets,
then reconstructs the page with React components instead of injecting the original markup.

The goal is to support URLs of the form:
```
http://localhost:5173/?username=moonlightbae
```
The application will fetch `https://www.snapchat.com/@<username>?locale=en-US` and rebuild the UI.

## Functional Requirements
1. Parse the `username` query parameter from the browser URL.
2. Fetch the corresponding Snapchat profile HTML.
3. Extract user-facing data (display name, handle, description, profile image, lens previews).
4. Recreate the page layout using React components and standard CSS.
5. Handle arbitrary usernames that resolve to public Snapchat profiles.
6. Render top-level tabs (Search, Stories, Spotlight, Chat, Lenses, Snapchat+, Download).
   - For the Spotlight and Stories tabs, fetch the tab-specific HTML and parse each result tile.
   - Other tabs may display placeholder content.
7. Include header and footer sections with login prompt and site links.

## Non‑Functional Requirements
- Do not insert the raw HTML from Snapchat into the DOM. Instead, parse the values and re-render.
- Avoid downloading or committing large static resources from Snapchat; fetch at runtime.
- Keep the client lightweight; do not include `node_modules` in the repository.

## Data Fetching Strategy
- Use the browser `fetch` API to download the profile HTML. The Vite dev server will proxy the
  request to avoid CORS restrictions.
- Parse the returned HTML string with the DOMParser API to pull out:
  - `<meta property="og:title">` for the display name.
  - `<meta property="og:description">` for the bio text.
  - `<meta property="og:image">` for the profile image.
  - `<script id="__NEXT_DATA__">` JSON for additional data such as subscriber counts.
- When a tab is selected, fetch `https://www.snapchat.com/@<username>?tab=<tab>` and parse the
  resulting HTML for tiles and metadata.

## React Components
- **App** – top level component that reads `username` from `window.location.search` and manages state.
- **Header** – renders login prompt and tagline.
- **Profile** – presentational component for user info.
- **Tabs** – navigation for page sections and container for tab content.
- **Spotlight** – renders spotlight result tiles.
- **Stories** – renders story tiles.
- **Footer** – site-wide footer links.
- **Loader/Error** – lightweight components for loading and error states.

## Future Enhancements
- Add server-side proxy to handle strict CORS environments.
- Expand parsing for additional tabs and richer metadata.
- Support localisation by passing the `locale` parameter.
