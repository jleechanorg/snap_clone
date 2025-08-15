import { useEffect, useState, lazy, Suspense } from 'react'
import './App.css'

// Lazy load the Tabs component to reduce initial bundle size
const Tabs = lazy(() => import('./Tabs'))

function App() {
  const params = new URLSearchParams(window.location.search)
  const username = params.get('username')

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!username) return
    setLoading(true)
    
    // Use AbortController for better performance and cleanup
    const abortController = new AbortController()
    
    fetch(`/snap/@${username}?locale=en-US`, {
      signal: abortController.signal,
      headers: {
        'Cache-Control': 'public, max-age=300' // 5 minute cache
      }
    })
      .then((res) => res.text())
      .then((html) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const title = doc.querySelector('meta[property="og:title"]')?.content
        const description = doc.querySelector('meta[property="og:description"]')?.content
        
        // Try to get the working profile image from srcset first, then fallback to og:image
        let image = doc.querySelector('meta[property="og:image"]')?.content
        const profileImg = doc.querySelector('img[alt="Profile Picture"]')
        if (profileImg?.srcset) {
          // Extract the URL from srcset (format: "url size")
          const srcsetUrl = profileImg.srcset.split(' ')[0]
          if (srcsetUrl && srcsetUrl.startsWith('https://')) {
            image = srcsetUrl
          }
        }
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
          } catch (err) {
            // Log error in development for debugging
            if (import.meta.env.DEV) {
              console.warn('Failed to parse Next.js data:', err)
            }
          }
        }
        setData({ title, description, image, subscriberCount, bio, userType })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err)
        }
      })
      .finally(() => setLoading(false))
    
    return () => {
      abortController.abort()
    }
  }, [username])

  if (!username) {
    return <p>Provide a username query parameter, e.g. ?username=moonlightbae</p>
  }

  if (loading) return <p>Loading…</p>
  if (error) return <p>Error loading profile.</p>

  return (
    <div className="app">
      {/* Left Sidebar - Login */}
      <div className="login-sidebar">
        <div className="login-form">
          <h1>Log in to Snapchat</h1>
          <p className="subtitle">Chat, Snap, and video call your friends. Watch Stories and Spotlight, all from your computer.</p>
          
          <div className="login-field">
            <label>Username or email address</label>
            <input type="text" placeholder="Username or email address" />
          </div>
          
          <button className="phone-toggle">Use phone number instead</button>
          
          <button className="login-btn">Log in</button>
          
          <p className="download-link">
            Looking for the app? <a href="https://snapchat.com/download">Get it here.</a>
          </p>
        </div>
      </div>

      {/* Right Main Content */}
      <div className="main-content">
        {/* Top Navigation */}
        <nav className="top-navigation">
          <div className="nav-brand">
            <div className="snapchat-logo">👻</div>
            <div className="search-box">
              <span>🔍</span>
              <input type="text" placeholder="Search" />
            </div>
          </div>
          
          <div className="nav-menu">
            <a href="#" className="nav-item">
              <div className="nav-icon"></div>
              <span className="nav-label">Stories</span>
            </a>
            <a href="#" className="nav-item">
              <div className="nav-icon"></div>
              <span className="nav-label">Spotlight</span>
            </a>
            <a href="#" className="nav-item">
              <div className="nav-icon"></div>
              <span className="nav-label">Chat</span>
            </a>
            <a href="#" className="nav-item">
              <div className="nav-icon"></div>
              <span className="nav-label">Lenses</span>
            </a>
            <a href="#" className="nav-item">
              <div className="nav-icon"></div>
              <span className="nav-label">Snapchat+</span>
            </a>
            <button className="download-btn">Download</button>
          </div>
        </nav>

        {/* Profile Section */}
        <div className="profile-section">
          {data?.image && (
            <img 
              src={data.image} 
              alt="Profile Picture" 
              className="profile-image" 
              width="120" 
              height="120"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
          )}
          
          <div className="profile-info">
            <div className="profile-header">
              <div>
                <h2 className="profile-name">{data?.title || 'Loading...'}</h2>
              </div>
              <button className="share-btn">
                <span>📤</span> Share
              </button>
            </div>
            
            <div className="profile-meta">
              <span className="profile-username">{username}•</span>
              {data?.userType && (
                <span className="user-type">{data.userType}•</span>
              )}
              {data?.subscriberCount && (
                <span className="follower-count">{data.subscriberCount.toLocaleString()} followers•</span>
              )}
              <span className="last-updated">Last updated 8/15/2025</span>
            </div>
          </div>
        </div>

        {/* Profile Bio */}
        {data?.bio && (
          <div className="profile-bio">
            {data.bio}
          </div>
        )}

        {/* Content Area */}
        <div className="content-area">
          <Suspense fallback={
            <div className="loading-container">
              <div className="spinner"></div>
              <span className="sr-only">Loading content...</span>
            </div>
          }>
            <Tabs username={username} displayName={data?.title} />
          </Suspense>
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-columns">
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="#">Snap Inc.</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">News</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Community</h4>
              <ul>
                <li><a href="#">Support</a></li>
                <li><a href="#">Community Guidelines</a></li>
                <li><a href="#">Safety Center</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Advertising</h4>
              <ul>
                <li><a href="#">Buy Ads</a></li>
                <li><a href="#">Advertising Policies</a></li>
                <li><a href="#">Political Ads Library</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Center</a></li>
                <li><a href="#">Your Privacy Choices</a></li>
                <li><a href="#">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <select className="language-selector">
              <option>English (US)</option>
            </select>
            
            <div className="legal-links">
              <a href="https://snap.com/en-US/privacy">Privacy Policy</a>
              <a href="https://snap.com/en-US/terms">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App