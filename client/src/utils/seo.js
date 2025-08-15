// SEO utility functions for dynamic meta tag updates and structured data

/**
 * Updates document title and meta tags dynamically
 * @param {Object} options - SEO options
 * @param {string} options.title - Page title
 * @param {string} options.description - Page description
 * @param {string} options.image - OG image URL
 * @param {string} options.url - Canonical URL
 * @param {string} options.username - Snapchat username
 * @param {string} options.displayName - User's display name
 */
export function updateMetaTags({
  title,
  description,
  image,
  url = window.location.href,
  username,
  displayName
}) {
  // Update document title
  if (title) {
    document.title = title;
  }

  // Helper function to update or create meta tag
  const updateMeta = (selector, content) => {
    if (!content) return;
    
    let meta = document.querySelector(selector);
    if (meta) {
      meta.setAttribute('content', content);
    } else {
      meta = document.createElement('meta');
      const parts = selector.match(/\[(.+?)=["'](.+?)["']\]/);
      if (parts) {
        meta.setAttribute(parts[1], parts[2]);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    }
  };

  // Update basic meta tags
  updateMeta('meta[name="title"]', title);
  updateMeta('meta[name="description"]', description);

  // Update Open Graph tags
  updateMeta('meta[property="og:title"]', title);
  updateMeta('meta[property="og:description"]', description);
  updateMeta('meta[property="og:image"]', image);
  updateMeta('meta[property="og:url"]', url);

  // Update Twitter Card tags
  updateMeta('meta[property="twitter:title"]', title);
  updateMeta('meta[property="twitter:description"]', description);
  updateMeta('meta[property="twitter:image"]', image);
  updateMeta('meta[property="twitter:url"]', url);

  // Update canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', url);
  }
}

/**
 * Generates structured data (JSON-LD) for a profile page
 * @param {Object} profileData - Profile information
 * @returns {string} JSON-LD structured data
 */
export function generateProfileStructuredData(profileData) {
  const {
    username,
    displayName,
    bio,
    image,
    subscriberCount,
    userType,
    url = window.location.href
  } = profileData;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": displayName || username,
      "alternateName": username,
      "description": bio,
      "image": image,
      "url": url,
      "sameAs": [`https://www.snapchat.com/add/${username}`],
      "interactionStatistic": subscriberCount ? {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/FollowAction",
        "userInteractionCount": parseInt(subscriberCount.replace(/[^0-9]/g, '')) || 0
      } : undefined,
      "jobTitle": userType === 'Artist' ? 'Artist' : undefined,
      "knowsAbout": userType
    },
    "about": {
      "@type": "WebPage",
      "name": `${displayName || username} - Snapchat Profile`,
      "description": bio || `View ${displayName || username}'s Snapchat profile, stories, and spotlight content.`,
      "url": url
    },
    "publisher": {
      "@type": "Organization",
      "name": "Snapchat Profile Clone",
      "url": window.location.origin
    }
  };

  // Remove undefined values
  return JSON.stringify(structuredData, (key, value) => 
    value === undefined ? undefined : value, 2);
}

/**
 * Injects structured data into the page
 * @param {string} structuredData - JSON-LD string
 */
export function injectStructuredData(structuredData) {
  // Remove existing structured data
  const existing = document.querySelector('script[type="application/ld+json"][data-profile]');
  if (existing) {
    existing.remove();
  }

  // Create new script tag
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-profile', 'true');
  script.textContent = structuredData;
  document.head.appendChild(script);
}

/**
 * Generates SEO-friendly title for profile pages
 * @param {string} displayName - User's display name
 * @param {string} username - User's username
 * @param {string} userType - User type (Artist, etc.)
 * @returns {string} SEO title
 */
export function generateProfileTitle(displayName, username, userType) {
  let title = displayName || username;
  
  if (userType) {
    title += ` (${userType})`;
  }
  
  title += ' - Snapchat Profile | Stories & Spotlight';
  
  return title;
}

/**
 * Generates SEO-friendly description for profile pages
 * @param {string} displayName - User's display name
 * @param {string} username - User's username
 * @param {string} bio - User's bio
 * @param {string} subscriberCount - Follower count
 * @returns {string} SEO description
 */
export function generateProfileDescription(displayName, username, bio, subscriberCount) {
  let description = `View ${displayName || username}'s Snapchat profile`;
  
  if (subscriberCount) {
    description += ` with ${subscriberCount} followers`;
  }
  
  if (bio) {
    description += `. ${bio.slice(0, 100)}${bio.length > 100 ? '...' : ''}`;
  } else {
    description += '. Watch their stories, spotlight content, and discover their latest posts.';
  }
  
  return description;
}

/**
 * Sets up error tracking for SEO monitoring
 */
export function setupSEOErrorTracking() {
  // Track 404s and other navigation errors
  window.addEventListener('error', (event) => {
    if (event.target.tagName === 'IMG' && event.target.src.includes('snapchat.com')) {
      console.warn('SEO Warning: Failed to load Snapchat image:', event.target.src);
    }
  });

  // Track fetch errors for API calls
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args)
      .catch(error => {
        console.warn('SEO Warning: API fetch failed:', args[0], error);
        throw error;
      });
  };
}