/**
 * Utility functions for URL generation and navigation
 */

/**
 * Creates a URL-safe slug from a title string
 * @param {string} title - The title to convert to a slug
 * @param {number} maxLength - Maximum length of the generated slug (default: 50)
 * @returns {string} URL-safe slug
 */
export function createUrlSlug(title, maxLength = 50) {
  if (!title) return 'untitled'
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')  // Replace non-alphanumeric with dashes
    .replace(/-+/g, '-')         // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '')       // Remove leading/trailing dashes
    .slice(0, maxLength)         // Limit length
    || 'untitled'                // Fallback if empty after processing
}

/**
 * Navigates to a username profile using URL parameters (SPA-friendly)
 * @param {string} username - The username to navigate to
 */
export function navigateToProfile(username) {
  if (!username) return
  
  // Use SPA-friendly navigation instead of window.location.href
  const url = new URL(window.location)
  url.searchParams.set('username', username)
  window.history.pushState({}, '', url.toString())
  
  // Trigger a custom event to notify components of the navigation
  window.dispatchEvent(new CustomEvent('profile-navigation', { 
    detail: { username } 
  }))
}

/**
 * Opens external Snapchat URL while preserving SPA state
 * @param {string} snapchatUrl - The Snapchat URL to open
 */
export function openSnapchatContent(snapchatUrl) {
  if (!snapchatUrl) return
  
  // Open in new tab to preserve current app state
  window.open(snapchatUrl, '_blank', 'noopener,noreferrer')
}