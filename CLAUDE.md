# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React application that clones public Snapchat profile pages. The app fetches live HTML from Snapchat profiles, parses metadata and content, then reconstructs the page using React components. The client is built with React 19 and Vite.

## Development Commands

All commands should be run from the `client/` directory:

```bash
cd client
npm install        # Install dependencies
npm run dev        # Start development server on http://localhost:5173
npm run build      # Build for production  
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Application Architecture

### Core Data Flow
- **URL parsing**: App reads `username` from query parameter (`?username=moonlightbae`)
- **Proxy requests**: Vite dev server proxies `/snap/*` to `https://www.snapchat.com` to bypass CORS
- **HTML parsing**: Uses DOMParser to extract metadata from Snapchat's HTML response
- **Tab content**: Fetches tab-specific content and parses DOM elements for tiles/cards

### Key Components
- **App.jsx**: Main component that handles URL parsing, data fetching, and state management
- **Profile.jsx**: Renders user info (avatar, name, bio, subscriber count) 
- **Tabs.jsx**: Tab navigation and content fetching for Stories/Spotlight tabs
- **Spotlight.jsx/Stories.jsx**: Render parsed tile content for each tab type
- **Header.jsx/Footer.jsx**: Static UI components

### Data Extraction Strategy
The app parses Snapchat's HTML to extract:
- OpenGraph meta tags (`og:title`, `og:description`, `og:image`) for profile info
- `__NEXT_DATA__` script tag for JSON data like subscriber counts
- CSS class selectors for tab content (`.SpotlightResultTile_container__NK4Xj`, `.StoryCard`)

### Vite Configuration
- Proxy configuration in `vite.config.js` rewrites `/snap` requests to `https://www.snapchat.com`
- This allows the frontend to fetch Snapchat data without CORS issues during development

## Testing & Quality

The project uses ESLint with React-specific rules. Run `npm run lint` before committing changes.