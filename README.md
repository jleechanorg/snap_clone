# Snapchat Profile Clone

A React + Vite application that rebuilds public Snapchat profile pages.
It fetches live HTML for a given username, parses metadata, images, and tab content, and re-renders the entire page using React components. Each top-level tab (Stories, Spotlight, etc.) is implemented via dedicated components.

## Development
```
cd client
npm install
npm run dev
```
Then open `http://localhost:5173/?username=moonlightbae` in a browser.

See [SPEC.md](SPEC.md) for the project specification.
