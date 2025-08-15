# Snapchat Profile Clone

A React + Vite application that rebuilds public Snapchat profile pages.
It fetches live HTML for a given username, parses metadata, images, and tab content, and re-renders the entire page using React components. Each top-level tab (Stories, Spotlight, etc.) is implemented via dedicated components.

## Features

- Rebuilds Snapchat profile pages with React components rather than embedding raw HTML.
- Fetches profile data at runtime and parses the relevant metadata and assets.
- Implements core tabs such as **Stories** and **Spotlight** with dedicated React components.
- Uses Vite for a fast development workflow with hot module replacement.

## Development
```
cd client
npm install
npm run dev
```
Then open `http://localhost:5173/?username=moonlightbae` in a browser.

## Additional Scripts

Inside the `client` directory you can run:

- `npm run build` – bundle the application for production.
- `npm run lint` – check the codebase with ESLint.

See [SPEC.md](SPEC.md) for the project specification.
