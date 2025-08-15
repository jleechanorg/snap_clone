import { useEffect, useState, lazy, Suspense } from 'react'
import './App.css'
import { 
  updateMetaTags, 
  generateProfileStructuredData, 
  injectStructuredData,
  generateProfileTitle,
  generateProfileDescription,
  setupSEOErrorTracking
} from './utils/seo'
import OptimizedImage from './components/OptimizedImage'

// Lazy load heavy components with preloading
const Tabs = lazy(() => import(/* webpackChunkName: "tabs" */ './Tabs'))

// Preload critical components when user might need them
const preloadTabs = () => {
  const componentImport = import('./Tabs')
  return componentImport
}

function App() {
  const params = new URLSearchParams(window.location.search)
  const username = params.get('username')

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Setup SEO error tracking on component mount
    setupSEOErrorTracking()
    
    // Preload Tabs component when we have a username
    if (username) {
      preloadTabs()
    }
  }, [username])

  useEffect(() => {
    if (!username) return
    setLoading(true)
    fetch(`/snap/@${username}?locale=en-US`)
      .then((res) => res.text())
      .then((html) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const title = doc.querySelector('meta[property="og:title"]')?.content
        const description = doc.querySelector('meta[property="og:description"]')?.content
        const image = doc.querySelector('meta[property="og:image"]')?.content
        const nextData = doc.getElementById('__NEXT_DATA__')?.textContent
        let subscriberCount, bio, userType
        if (nextData) {
          try {
            const json = JSON.parse(nextData)
            const profile = json?.props?.pageProps?.userProfile?.publicProfileInfo
            
            // Format subscriber count (e.g., "12743200" -> "13M")
            if (profile?.subscriberCount) {
              const count = parseInt(profile.subscriberCount)
              if (count >= 1000000) {
                subscriberCount = Math.round(count / 1000000) + 'M'
              } else if (count >= 1000) {
                subscriberCount = Math.round(count / 1000) + 'K'
              } else {
                subscriberCount = count.toString()
              }
            }
            
            bio = profile?.bio
            
            // Extract userType from subcategoryStringId (e.g., "public-profile-subcategory-v3-artist" -> "Artist")
            if (profile?.subcategoryStringId) {
              const subcategory = profile.subcategoryStringId.replace('public-profile-subcategory-v3-', '')
              userType = subcategory.charAt(0).toUpperCase() + subcategory.slice(1)
            }
          } catch (e) {
            console.warn('Failed to parse profile data:', e)
          }
        }
        setData({ title, description, image, subscriberCount, bio, userType })
      })
      .catch((err) => {
        console.error('Failed to fetch profile data:', err)
        setError(err)
      })
      .finally(() => setLoading(false))
  }, [username])

  // Update SEO meta tags when data changes
  useEffect(() => {
    if (!username) return

    const profileUrl = `${window.location.origin}${window.location.pathname}?username=${username}`

    if (data) {
      // Profile data is available - use dynamic content
      const profileTitle = generateProfileTitle(data.title, username, data.userType)
      const profileDescription = generateProfileDescription(data.title, username, data.bio, data.subscriberCount)

      // Update meta tags with profile data
      updateMetaTags({
        title: profileTitle,
        description: profileDescription,
        image: data.image,
        url: profileUrl,
        username,
        displayName: data.title
      })

      // Generate and inject structured data
      const structuredData = generateProfileStructuredData({
        username,
        displayName: data.title,
        bio: data.bio,
        image: data.image,
        subscriberCount: data.subscriberCount,
        userType: data.userType,
        url: profileUrl
      })

      injectStructuredData(structuredData)
    } else if (username && !loading) {
      // Profile data loading or failed - use fallback meta tags
      const fallbackTitle = `@${username} - Snapchat Profile | Stories & Spotlight`
      const fallbackDescription = `View @${username}'s Snapchat profile, stories, and spotlight content. Explore their latest posts and discover their content on this modern Snapchat profile viewer.`

      updateMetaTags({
        title: fallbackTitle,
        description: fallbackDescription,
        image: null,
        url: profileUrl,
        username,
        displayName: username
      })

      // Basic structured data for loading state
      const basicStructuredData = generateProfileStructuredData({
        username,
        displayName: username,
        bio: null,
        image: null,
        subscriberCount: null,
        userType: null,
        url: profileUrl
      })

      injectStructuredData(basicStructuredData)
    }
  }, [data, username, loading])

  if (!username) {
    return (
      <div className="app">
        <div className="error-container" role="alert">
          <h1>Username Required</h1>
          <p>Please provide a username query parameter, for example: ?username=moonlightbae</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container" role="status" aria-live="polite">
          <h1>Loading Profile</h1>
          <p>Loading profile information...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="app">
        <div className="error-container" role="alert">
          <h1>Error Loading Profile</h1>
          <p>There was an error loading the profile. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Skip Navigation */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      {/* Left Sidebar - Login */}
      <aside className="login-sidebar" aria-label="Login section">
        <form className="login-form" role="form" aria-label="Login form">
          <h1>Log in to Snapchat</h1>
          <p className="subtitle">Chat, Snap, and video call your friends. Watch Stories and Spotlight, all from your computer.</p>
          
          <div className="login-field">
            <label htmlFor="username-input">Username or email address</label>
            <input 
              id="username-input"
              type="text" 
              placeholder="Username or email address"
              aria-required="true"
              autoComplete="username"
            />
          </div>
          
          <button type="button" className="phone-toggle">Use phone number instead</button>
          
          <button type="submit" className="login-btn">Log in</button>
          
          <p className="download-link">
            Looking for the app? <a href="https://snapchat.com/download" target="_blank" rel="noopener noreferrer">Get it here.</a>
          </p>
        </form>
      </aside>

      {/* Right Main Content */}
      <main id="main-content" className="main-content">
        {/* Top Navigation */}
        <nav className="top-navigation" role="navigation" aria-label="Primary navigation">
          <div className="nav-brand">
            <div className="snapchat-logo" role="img" aria-label="Snapchat logo">👻</div>
            <div className="search-box" role="search">
              <span role="img" aria-label="Search icon">🔍</span>
              <label htmlFor="search-input" className="sr-only">Search</label>
              <input 
                id="search-input"
                type="text" 
                placeholder="Search"
                aria-label="Search Snapchat"
              />
            </div>
          </div>
          
          <ul className="nav-menu" role="menubar" aria-label="Primary navigation menu">
            <li role="menuitem">
              <a href="#" className="nav-item">
                <div className="nav-icon" aria-hidden="true"></div>
                <span className="nav-label">Stories</span>
              </a>
            </li>
            <li role="menuitem">
              <a href="#" className="nav-item">
                <div className="nav-icon" aria-hidden="true"></div>
                <span className="nav-label">Spotlight</span>
              </a>
            </li>
            <li role="menuitem">
              <a href="#" className="nav-item">
                <div className="nav-icon" aria-hidden="true"></div>
                <span className="nav-label">Chat</span>
              </a>
            </li>
            <li role="menuitem">
              <a href="#" className="nav-item">
                <div className="nav-icon" aria-hidden="true"></div>
                <span className="nav-label">Lenses</span>
              </a>
            </li>
            <li role="menuitem">
              <a href="#" className="nav-item">
                <div className="nav-icon" aria-hidden="true"></div>
                <span className="nav-label">Snapchat+</span>
              </a>
            </li>
            <li role="menuitem">
              <button className="download-btn">Download</button>
            </li>
          </ul>
        </nav>

        {/* Profile Section */}
        <section className="profile-section" aria-labelledby="profile-heading">
          {data?.image && (
            <OptimizedImage
              src={data.image} 
              alt={`Profile picture of ${data?.title || username}`} 
              className="profile-image" 
              loading="eager"
              sizes="(max-width: 768px) 120px, 150px"
            />
          )}
          
          <div className="profile-info">
            <div className="profile-header">
              <div>
                <h2 id="profile-heading" className="profile-name">{data?.title || 'Loading...'}</h2>
              </div>
              <button className="share-btn" aria-label="Share profile">
                <span role="img" aria-hidden="true">📤</span> Share
              </button>
            </div>
            
            <div className="profile-meta">
              <span className="profile-username">@{username}</span>
              {data?.userType && (
                <span className="user-type" aria-label={`User type: ${data.userType}`}> • {data.userType}</span>
              )}
              {data?.subscriberCount && (
                <span className="follower-count" aria-label={`${data.subscriberCount} followers`}> • {data.subscriberCount} followers</span>
              )}
              <span className="last-updated"> • Last updated 8/15/2025</span>
            </div>
          </div>
        </section>

        {/* Profile Bio */}
        {data?.bio && (
          <section className="profile-bio" aria-labelledby="bio-heading">
            <h2 id="bio-heading" className="sr-only">Biography</h2>
            {data.bio}
          </section>
        )}

        {/* Content Area */}
        <section className="content-area" aria-labelledby="content-heading">
          <h2 id="content-heading" className="sr-only">Profile Content</h2>
          <Suspense fallback={
            <div className="tabs-loading" role="status" aria-live="polite">
              <div className="loading-spinner"></div>
              <span>Loading content...</span>
            </div>
          }>
            <Tabs username={username} displayName={data?.title} />
          </Suspense>
        </section>

        </main>
        
        {/* Footer */}
        <footer className="footer" role="contentinfo">
          <div className="footer-columns">
            <div className="footer-section">
              <h3>Company</h3>
              <ul>
                <li><a href="#" aria-label="Visit Snap Inc. page">Snap Inc.</a></li>
                <li><a href="#" aria-label="View career opportunities">Careers</a></li>
                <li><a href="#" aria-label="Read news and updates">News</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h3>Community</h3>
              <ul>
                <li><a href="#" aria-label="Get support and help">Support</a></li>
                <li><a href="#" aria-label="Read community guidelines">Community Guidelines</a></li>
                <li><a href="#" aria-label="Visit safety center">Safety Center</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h3>Advertising</h3>
              <ul>
                <li><a href="#" aria-label="Purchase advertising">Buy Ads</a></li>
                <li><a href="#" aria-label="Read advertising policies">Advertising Policies</a></li>
                <li><a href="#" aria-label="Browse political ads library">Political Ads Library</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h3>Legal</h3>
              <ul>
                <li><a href="#" aria-label="Visit privacy center">Privacy Center</a></li>
                <li><a href="#" aria-label="Manage your privacy choices">Your Privacy Choices</a></li>
                <li><a href="#" aria-label="Read cookie policy">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <label htmlFor="language-selector" className="sr-only">Select language</label>
            <select id="language-selector" className="language-selector" aria-label="Language selection">
              <option value="en-US">English (US)</option>
            </select>
            
            <nav className="legal-links" aria-label="Legal links">
              <a href="https://snap.com/en-US/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              <a href="https://snap.com/en-US/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            </nav>
          </div>
        </footer>
    </div>
  )
}

export default App