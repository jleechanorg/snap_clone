import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import './App.css'
import OptimizedImage from './components/OptimizedImage'

// Optimized lazy loading with better error boundaries and preloading
const Spotlight = lazy(() => import(/* webpackChunkName: "spotlight" */ './Spotlight'))
const Stories = lazy(() => import(/* webpackChunkName: "stories" */ './Stories'))

// Loading component optimized for accessibility and UX
const TabLoadingSpinner = ({ tabType }) => (
  <div className="tab-loading" role="status" aria-live="polite">
    <div className="loading-spinner"></div>
    <span className="sr-only">Loading {tabType} content...</span>
  </div>
)

export default function Tabs({ username, displayName }) {
  const [items, setItems] = useState([])
  const [activeTab, setActiveTab] = useState('spotlight')
  const [availableTabs, setAvailableTabs] = useState(new Set(['spotlight', 'lenses', 'tagged', 'related']))
  const [loading, setLoading] = useState(false)
  const tabRefs = useRef({})

  useEffect(() => {
    if (!username) return
    checkAllTabsForContent()
  }, [username])

  useEffect(() => {
    if (!username || !availableTabs.has(activeTab)) return
    fetchTabContent(activeTab)
  }, [username, activeTab, availableTabs])

  async function checkAllTabsForContent() {
    // First, get the actual tabs from the real Snapchat page
    const realTabs = await parseTabsFromRealPage()
    const tabsWithContent = new Set()
    
    // Only check tabs that actually exist on the real page
    for (const tab of realTabs) {
      const hasContent = await checkTabHasContent(tab)
      if (hasContent) {
        tabsWithContent.add(tab)
      }
    }
    
    setAvailableTabs(tabsWithContent)
    
    // If current active tab has no content, switch to first available tab
    if (!tabsWithContent.has(activeTab)) {
      const firstAvailable = realTabs.find(tab => tabsWithContent.has(tab))
      if (firstAvailable) {
        setActiveTab(firstAvailable)
      }
    }
  }

  async function parseTabsFromRealPage() {
    try {
      const res = await fetch(`/snap/@${username}?locale=en-US`)
      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      
      const availableTabs = []
      
      // Check for actual tab navigation elements in the UI (this matches real Snapchat behavior)
      // Look for tab buttons in the navigation
      const tabElements = doc.querySelectorAll('button[role="tab"], [role="tablist"] button, button[aria-selected]')
      
      for (const tabElement of tabElements) {
        const tabText = tabElement.textContent?.trim().toLowerCase()
        if (tabText === 'spotlight') availableTabs.push('spotlight')
        else if (tabText === 'lenses') availableTabs.push('lenses')
        else if (tabText === 'tagged') availableTabs.push('tagged')
        else if (tabText === 'related') availableTabs.push('related')
      }
      
      // Fallback: if no tab navigation found, look for tab-specific content
      if (availableTabs.length === 0) {
        if (import.meta.env.DEV) {
          console.log('No tab navigation found, falling back to content detection');
        }
        if (await hasContentForTab('spotlight')) availableTabs.push('spotlight')
        if (await hasContentForTab('lenses')) availableTabs.push('lenses') 
        if (await hasContentForTab('tagged')) availableTabs.push('tagged')
        if (await hasContentForTab('related')) availableTabs.push('related')
      }
      
      if (import.meta.env.DEV) {
        console.log(`Real tabs found for ${username}:`, availableTabs);
      }
      return availableTabs
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error parsing real tabs:', error);
      }
      return []
    }
  }

  async function hasContentForTab(tab) {
    try {
      let url, selector
      
      switch (tab) {
        case 'spotlight':
          url = `/snap/@${username}?locale=en-US&tab=Spotlight`
          selector = 'a[href*="/spotlight/"] img'
          break
        case 'lenses':
          url = `/snap/@${username}?locale=en-US&tab=Lenses`
          selector = 'a[href*="/unlock/"] img'
          break
        case 'tagged':
          url = `/snap/@${username}?locale=en-US&tab=Tagged`
          selector = 'a[href*="/spotlight/"] img'
          break
        case 'related':
          url = `/snap/@${username}?locale=en-US`
          selector = 'a[href*="/add/"] h5'
          break
        default:
          return false
      }

      const res = await fetch(url)
      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const elements = doc.querySelectorAll(selector)
      
      return elements.length > 0
    } catch (error) {
      return false
    }
  }

  async function checkTabHasContent(tab) {
    try {
      // Simple selector-based check for content existence
      // Since parseTabsFromRealPage already confirmed the tab exists,
      // we just need to verify it has actual content items
      let url, selector
      
      switch (tab) {
        case 'spotlight':
          url = `/snap/@${username}?locale=en-US&tab=Spotlight`
          selector = 'a[href*="/spotlight/"] img'
          break
        case 'lenses':
          url = `/snap/@${username}?locale=en-US&tab=Lenses`
          selector = 'a[href*="/unlock/"] img'
          break
        case 'tagged':
          url = `/snap/@${username}?locale=en-US&tab=Tagged`
          selector = 'a[href*="/spotlight/"] img, script[type="application/ld+json"]'
          break
        case 'related':
          url = `/snap/@${username}?locale=en-US`
          selector = 'a[href*="/add/"] h5'
          break
        default:
          return false
      }

      const res = await fetch(url)
      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const elements = doc.querySelectorAll(selector)
      
      return elements.length > 0
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Error checking content for ${tab}:`, error);
      }
      return false
    }
  }

  async function fetchTabContent(tab) {
    setLoading(true)
    try {
      let url, selector, dataMapper
      
      switch (tab) {
        case 'spotlight':
          url = `/snap/@${username}?locale=en-US&tab=Spotlight`
          selector = 'a[href*="/spotlight/"]' // Links to individual spotlight videos  
          dataMapper = (tile) => {
            const linkText = tile.textContent?.trim() || ''
            const numbers = linkText.match(/\d+[kK]?/g) || []
            const [views, comments, shares] = numbers.slice(0, 3)
            
            const user = tile.href?.match(/@([^/]+)/)?.[1]
            const description = linkText.replace(/\d+[kK]?\s*/g, '').trim()
            
            return {
              thumbnail: tile.querySelector('img')?.src,
              user: user,
              description: description,
              views: views,
              comments: comments, 
              shares: shares
            }
          }
          break
        case 'lenses':
          url = `/snap/@${username}?locale=en-US&tab=Lenses`
          selector = 'a[href*="/unlock/"]' // Lenses are unlock links
          dataMapper = (tile) => ({
            thumbnail: tile.querySelector('img')?.src,
            user: username, // Lenses are created by the profile owner
            description: tile.querySelector('p')?.textContent
          })
          break
        case 'tagged':
          url = `/snap/@${username}?locale=en-US&tab=Tagged`
          // Use a different approach for tagged content - look for all content that mentions the user
          selector = 'a[href*="/spotlight/"], script[type="application/ld+json"]'
          dataMapper = (element) => {
            // If it's a JSON-LD script, parse the structured data
            if (element.tagName === 'SCRIPT') {
              try {
                const data = JSON.parse(element.textContent)
                if (data['@type'] === 'VideoObject' && data.keywords && data.keywords.includes('#' + username.replace(/\d+$/, ''))) {
                  const creatorName = data.creator?.alternateName
                  const description = data.name || data.description
                  
                  return {
                    thumbnail: data.thumbnailUrl,
                    user: creatorName,
                    description: description,
                    views: null, // JSON-LD doesn't always have view counts
                    comments: null,
                    shares: null
                  }
                }
                return null
              } catch (e) {
                return null
              }
            }
            
            // Fallback to regular link parsing with improved description extraction
            const linkText = element.textContent?.trim() || ''
            const numbers = linkText.match(/\d+[kK]?/g) || []
            const userName = element.href?.match(/@([^/]+)/)?.[1]
            
            // Look for description with hashtags in nearby elements
            let description = null
            
            // Check parent containers for hashtag descriptions
            let container = element.closest('div')
            for (let i = 0; i < 3 && container; i++) {
              const paragraphs = container.querySelectorAll('p')
              for (const p of paragraphs) {
                const text = p.textContent?.trim()
                if (text && (text.includes('#') || text.length > 20)) {
                  description = text
                  break
                }
              }
              if (description) break
              container = container.parentElement
            }
            
            return {
              thumbnail: element.querySelector('img')?.src,
              user: userName,
              description: description,
              views: numbers[0],
              comments: numbers[1],
              shares: numbers[2]
            }
          }
          break
        case 'related':
          url = `/snap/@${username}?locale=en-US`
          // Look for profile recommendation links in the main page
          selector = 'a[href*="/add/"]'
          dataMapper = (element) => {
            // Extract username from the add link
            const addLink = element.href
            const usernameMatch = addLink.match(/\/add\/([^?]+)/)
            if (!usernameMatch) return null
            
            const relatedUsername = usernameMatch[1]
            
            // Extract name and image from the element
            const nameElement = element.querySelector('h5')
            const imageElement = element.querySelector('img')
            const paragraphElement = element.querySelector('p')
            
            if (import.meta.env.DEV) {
              console.log(`Mapping element for ${relatedUsername}:`, {
                hasName: !!nameElement,
                hasImage: !!imageElement,
                name: nameElement?.textContent.trim(),
                imageSrc: imageElement?.src
              });
            }
            
            if (!nameElement) return null
            
            // Get thumbnail URL - try multiple sources and fallback to Snapchat standard URL
            let thumbnailUrl = null
            if (imageElement) {
              thumbnailUrl = imageElement.src || imageElement.getAttribute('data-src') || imageElement.getAttribute('data-lazy')
            }
            
            // If no image found, generate fallback using Snapchat's Bitmoji/avatar service
            if (!thumbnailUrl || thumbnailUrl === '') {
              // Use Snapchat's web capture API for profile previews (similar to og:image)
              thumbnailUrl = `https://us-east1-aws.api.snapchat.com/web-capture/www.snapchat.com/add/${relatedUsername}/preview/square.jpeg?xp_id=1`
            }
            
            return {
              thumbnail: thumbnailUrl,
              user: nameElement.textContent.trim(),
              description: paragraphElement?.textContent.trim(),
              isProfile: true
            }
          }
          break
        default:
          return
      }

      const res = await fetch(url)
      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      
      const elements = [...doc.querySelectorAll(selector)]
      
      // Debug logging for Related tab
      if (tab === 'related') {
        if (import.meta.env.DEV) {
          console.log(`Related tab debug: Found ${elements.length} elements with selector ${selector}`);
          elements.slice(0, 5).forEach((el, i) => {
            console.log(`Element ${i}:`, el.href, el.textContent?.slice(0, 50));
          });
        }
      }
      
      let data = elements.map(dataMapper).filter(item => {
        if (!item) return false
        
        // For profile tiles (Related tab), only require user name (thumbnails optional)
        if (item.isProfile) {
          return !!item.user
        }
        
        // For content tiles, require both thumbnail and user name 
        if (!item.isProfile) {
          return !!(item.thumbnail && item.user)
        }
        
        return true
      })
      
      // For Tagged tab, filter out entries that are from the profile owner to show diverse users
      if (tab === 'tagged') {
        data = data.filter(item => item.user !== username)
        // Remove duplicates based on user + description combination
        const seen = new Set()
        data = data.filter(item => {
          const key = `${item.user}:${item.description}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
      }
      
      
      setItems(data)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Error fetching ${tab} content:`, error);
      }
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const getTabTitle = (tab) => {
    const tabTitles = {
      spotlight: 'Spotlight results',
      lenses: 'Lenses',
      tagged: 'Tagged content',
      related: 'Related content'
    }
    return tabTitles[tab]
  }

  const handleTabKeyDown = (event, tab) => {
    const availableTabsArray = Array.from(availableTabs)
    const currentIndex = availableTabsArray.indexOf(tab)
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : availableTabsArray.length - 1
        const prevTab = availableTabsArray[prevIndex]
        setActiveTab(prevTab)
        // Small delay to ensure state updates before focusing
        setTimeout(() => tabRefs.current[prevTab]?.focus(), 0)
        break
      case 'ArrowRight':
        event.preventDefault()
        const nextIndex = currentIndex < availableTabsArray.length - 1 ? currentIndex + 1 : 0
        const nextTab = availableTabsArray[nextIndex]
        setActiveTab(nextTab)
        setTimeout(() => tabRefs.current[nextTab]?.focus(), 0)
        break
      case 'Home':
        event.preventDefault()
        const firstTab = availableTabsArray[0]
        setActiveTab(firstTab)
        setTimeout(() => tabRefs.current[firstTab]?.focus(), 0)
        break
      case 'End':
        event.preventDefault()
        const lastTab = availableTabsArray[availableTabsArray.length - 1]
        setActiveTab(lastTab)
        setTimeout(() => tabRefs.current[lastTab]?.focus(), 0)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        setActiveTab(tab)
        break
    }
  }

  return (
    <div className="spotlight-content">
      {/* Tab Navigation */}
      <div className="tab-navigation" role="tablist" aria-label="Profile content tabs">
        {availableTabs.has('spotlight') && (
          <button 
            ref={el => tabRefs.current['spotlight'] = el}
            className={`tab-button ${activeTab === 'spotlight' ? 'active' : ''}`}
            onClick={() => setActiveTab('spotlight')}
            onKeyDown={(e) => handleTabKeyDown(e, 'spotlight')}
            role="tab"
            aria-selected={activeTab === 'spotlight'}
            aria-controls="spotlight-panel"
            id="spotlight-tab"
            tabIndex={activeTab === 'spotlight' ? 0 : -1}
          >
            Spotlight
          </button>
        )}
        {availableTabs.has('lenses') && (
          <button 
            ref={el => tabRefs.current['lenses'] = el}
            className={`tab-button ${activeTab === 'lenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('lenses')}
            onKeyDown={(e) => handleTabKeyDown(e, 'lenses')}
            role="tab"
            aria-selected={activeTab === 'lenses'}
            aria-controls="lenses-panel"
            id="lenses-tab"
            tabIndex={activeTab === 'lenses' ? 0 : -1}
          >
            Lenses
          </button>
        )}
        {availableTabs.has('tagged') && (
          <button 
            ref={el => tabRefs.current['tagged'] = el}
            className={`tab-button ${activeTab === 'tagged' ? 'active' : ''}`}
            onClick={() => setActiveTab('tagged')}
            onKeyDown={(e) => handleTabKeyDown(e, 'tagged')}
            role="tab"
            aria-selected={activeTab === 'tagged'}
            aria-controls="tagged-panel"
            id="tagged-tab"
            tabIndex={activeTab === 'tagged' ? 0 : -1}
          >
            Tagged
          </button>
        )}
        {availableTabs.has('related') && (
          <button 
            ref={el => tabRefs.current['related'] = el}
            className={`tab-button ${activeTab === 'related' ? 'active' : ''}`}
            onClick={() => setActiveTab('related')}
            onKeyDown={(e) => handleTabKeyDown(e, 'related')}
            role="tab"
            aria-selected={activeTab === 'related'}
            aria-controls="related-panel"
            id="related-tab"
            tabIndex={activeTab === 'related' ? 0 : -1}
          >
            Related
          </button>
        )}
      </div>

      {/* Sort Filter */}
      <div className="sort-filter">
        <span className="sort-label" id="sort-label">Sort by:</span>
        <button className="sort-button" aria-labelledby="sort-label" aria-expanded="false">
          <span>Recent</span>
          <span className="sort-arrow" aria-hidden="true">▼</span>
        </button>
      </div>
      
      <Suspense fallback={<TabLoadingSpinner tabType={activeTab} />}>
        <div 
          className="content-grid"
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={`${activeTab}-tab`}
          aria-live="polite"
          aria-busy={loading}
          aria-atomic="false"
        >
          {loading && (
            <div className="loading-message" role="status" aria-live="polite" aria-atomic="true">
              Loading {getTabTitle(activeTab).toLowerCase()}...
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="empty-message" role="status" aria-live="polite" aria-atomic="true">
              No {getTabTitle(activeTab).toLowerCase()} available for this profile.
            </div>
          )}
          {!loading && items.map((item, index) => (
            <article key={index} className={`content-tile ${item.isProfile ? 'profile-tile' : ''}`} tabIndex="0" role="button" aria-label={item.isProfile ? `View profile of ${item.user}` : `View content by ${item.user}`}>
              {item.thumbnail && (
                <OptimizedImage
                  src={item.thumbnail} 
                  alt={item.isProfile 
                    ? `Profile picture of ${item.user}` 
                    : `Thumbnail image for ${item.description || 'content'} by ${item.user}`
                  } 
                  className={item.isProfile ? "profile-image" : "tile-image"} 
                  loading="lazy"
                  sizes="(max-width: 768px) 33vw, 25vw"
                />
              )}
              <div className="tile-content">
                {item.user && (
                  <h4 className="tile-user">{item.user}</h4>
                )}
                {item.description && (
                  <p className="tile-description">{item.description}</p>
                )}
                {!item.isProfile && (
                  <div className="tile-stats" aria-label="Content statistics">
                    {item.views && (
                      <span className="stat-item">
                        <span role="img" aria-label="views" aria-hidden="true">❤️</span>
                        <span aria-label={`${item.views} views`}>{item.views}</span>
                      </span>
                    )}
                    {item.comments && (
                      <span className="stat-item">
                        <span role="img" aria-label="comments" aria-hidden="true">💬</span>
                        <span aria-label={`${item.comments} comments`}>{item.comments}</span>
                      </span>
                    )}
                    {item.shares && (
                      <span className="stat-item">
                        <span role="img" aria-label="shares" aria-hidden="true">🔗</span>
                        <span aria-label={`${item.shares} shares`}>{item.shares}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </Suspense>
    </div>
  )
}