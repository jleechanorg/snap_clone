import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

// Loading spinner component
const LoadingSpinner = ({ tabType }) => (
  <div className="loading-container" aria-live="polite">
    <div className="spinner" aria-hidden="true"></div>
    <span className="sr-only">Loading {tabType} content...</span>
  </div>
)

export default function Tabs({ username }) {
  const [items, setItems] = useState([])
  const [activeTab, setActiveTab] = useState('stories') // Default to stories first like real Snapchat
  const [availableTabs, setAvailableTabs] = useState(new Set(['stories', 'spotlight', 'lenses', 'tagged', 'related']))
  const [loading, setLoading] = useState(false)
  const tabRefs = useRef({})
  const requestIdRef = useRef(0)

  // Handle tile activation (click/keyboard)
  const handleTileActivate = useCallback((item) => {
    // For now, just log the interaction (could be extended to open modals, navigate, etc.)
    if (import.meta.env.DEV) {
      console.log('Tile activated:', item)
    }
    // Future: Could implement navigation, modal opening, etc.
  }, [])

  const checkAllTabsForContentCallback = useCallback(async () => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]) // Only depend on username to avoid circular dependencies with internal functions

  const fetchTabContentCallback = useCallback(async (tab) => {
    const reqId = ++requestIdRef.current
    // Start loading immediately but keep existing content visible
    setLoading(true)
    
    try {
      let url, selector, dataMapper
      
      switch (tab) {
        case 'stories':
          url = `/snap/@${username}?locale=en-US&tab=Stories`
          // Look for story containers that have both images and titles
          selector = 'a[href*="/story/"], [data-testid*="story"], div[class*="story"] img, div[class*="Story"] img'
          dataMapper = (element) => {
            let storyTitle = ''
            let thumbnailUrl = null
            
            // If it's a link, extract title and look for image
            if (element.tagName === 'A') {
              storyTitle = element.textContent?.trim() || ''
              const img = element.querySelector('img')
              if (img) {
                thumbnailUrl = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy')
              }
            }
            // If it's an image, look for nearby title
            else if (element.tagName === 'IMG') {
              thumbnailUrl = element.src || element.getAttribute('data-src') || element.getAttribute('data-lazy')
              
              // Look for title in parent containers
              let container = element.closest('div, a, article')
              for (let i = 0; i < 3 && container; i++) {
                const titleElement = container.querySelector('h1, h2, h3, h4, h5, h6, p, span')
                if (titleElement?.textContent?.trim()) {
                  storyTitle = titleElement.textContent.trim()
                  break
                }
                container = container.parentElement
              }
            }
            
            // Fallback: look for any h5 elements (original approach) if no image found
            if (!thumbnailUrl && element.tagName === 'H5') {
              storyTitle = element.textContent?.trim() || ''
            }
            
            // Skip empty or very short titles
            if (!storyTitle || storyTitle.length < 3) {
              return null
            }
            
            // Filter out common UI elements or sort options
            if (storyTitle.toLowerCase().includes('recent') || storyTitle.toLowerCase().includes('sort')) {
              return null
            }
            
            // Generate a fallback thumbnail using a reliable placeholder
            if (!thumbnailUrl) {
              // Use a reliable placeholder service instead of potentially non-existent URLs
              thumbnailUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(storyTitle.slice(0, 2))}&background=fffc00&color=000&size=200`
            }
            
            return {
              thumbnail: thumbnailUrl,
              user: username,
              description: storyTitle,
              isStory: true
            }
          }
          break
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
              } catch {
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
            
            const _relatedUsername = usernameMatch[1]
            
            // Extract name and image from the element
            const nameElement = element.querySelector('h5')
            const imageElement = element.querySelector('img')
            const paragraphElement = element.querySelector('p')
            
            // Debug logging removed for cleaner production code
            
            if (!nameElement) return null
            
            // Get thumbnail URL - try to extract working CDN URL from srcset first
            let thumbnailUrl = null
            if (imageElement) {
              // Try to get working URL from srcset (same technique as main profile image)
              if (imageElement.srcset) {
                const srcsetUrl = imageElement.srcset.split(' ')[0]
                if (srcsetUrl && srcsetUrl.startsWith('https://')) {
                  thumbnailUrl = srcsetUrl
                }
              }
              // Fallback to other image attributes
              if (!thumbnailUrl) {
                thumbnailUrl = imageElement.src || imageElement.getAttribute('data-src') || imageElement.getAttribute('data-lazy')
              }
            }
            
            // If no image found, generate fallback using a reliable avatar service
            if (!thumbnailUrl || thumbnailUrl === '') {
              // Use a reliable public avatar service instead of internal Snapchat APIs
              thumbnailUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameElement.textContent.trim())}&background=random&size=120`
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
      if (!res.ok) {
        throw new Error(`Failed to fetch ${tab} (${res.status})`)
      }
      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      
      const elements = [...doc.querySelectorAll(selector)]
      
      // Debug logging for Related tab
      if (tab === 'related' && import.meta.env.DEV) {
        console.log(`Related tab debug: Found ${elements.length} elements with selector ${selector}`)
        elements.slice(0, 5).forEach((el, i) => {
          console.log(`Element ${i}:`, el.href, el.textContent?.slice(0, 50))
        })
      }
      
      let data = elements.map(dataMapper).filter(item => {
        if (!item) return false
        
        // For profile tiles (Related tab), only require user name (thumbnails optional)
        if (item.isProfile) {
          return !!item.user
        }
        
        // For story tiles, only require user and description (no thumbnails)
        if (item.isStory) {
          return !!(item.user && item.description)
        }
        
        // For content tiles, require both thumbnail and user name 
        if (!item.isProfile && !item.isStory) {
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
      
      if (requestIdRef.current === reqId) {
        setItems(data)
      }
    } catch (error) {
      console.error(`Error fetching ${tab} content:`, error)
      // Keep existing items visible on error
    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false)
      }
    }
  }, [username])

  useEffect(() => {
    if (!username) return
    checkAllTabsForContentCallback()
  }, [username, checkAllTabsForContentCallback])

  useEffect(() => {
    if (!username || !availableTabs.has(activeTab)) return
    fetchTabContentCallback(activeTab)
  }, [username, activeTab, availableTabs, fetchTabContentCallback])

  async function parseTabsFromRealPage() {
    try {
      const res = await fetch(`/snap/@${username}?locale=en-US`)
      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      
      const availableTabs = []
      
      // Look for the actual tablist structure used by real Snapchat
      // Real Snapchat uses: tablist > tab elements with button children containing heading elements
      const tablist = doc.querySelector('[role="tablist"]')
      if (tablist) {
        const tabElements = tablist.querySelectorAll('[role="tab"]')
        
        for (const tabElement of tabElements) {
          // Extract tab name from heading element inside the tab button
          const heading = tabElement.querySelector('h5, h6, button h5, button h6')
          const tabText = heading?.textContent?.trim().toLowerCase()
          
          if (import.meta.env.DEV) {
            console.log(`Found tab element with text: "${tabText}"`);
          }
          
          if (tabText === 'stories') availableTabs.push('stories')
          else if (tabText === 'spotlight') availableTabs.push('spotlight')
          else if (tabText === 'lenses') availableTabs.push('lenses')
          else if (tabText === 'tagged') availableTabs.push('tagged')
          else if (tabText === 'related') availableTabs.push('related')
        }
      }
      
      // Fallback: if no tablist found, look for tab-specific content
      if (availableTabs.length === 0) {
        if (import.meta.env.DEV) {
          console.log('No tablist found, falling back to content detection');
        }
        if (await hasContentForTab('stories')) availableTabs.push('stories')
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
        case 'stories':
          url = `/snap/@${username}?locale=en-US&tab=Stories`
          selector = 'tabpanel h5, [role="tabpanel"] h5'
          break
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
    } catch {
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
        case 'stories':
          url = `/snap/@${username}?locale=en-US&tab=Stories`
          selector = 'tabpanel h5, [role="tabpanel"] h5'
          break
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
      console.error(`Error checking content for ${tab}:`, error)
      return false
    }
  }

  const getTabTitle = (tab) => {
    const tabTitles = {
      stories: 'Stories',
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
      case 'ArrowLeft': {
        event.preventDefault()
        const prevTab = availableTabsArray[currentIndex - 1]
        if (prevTab) {
          setActiveTab(prevTab)
          tabRefs.current[prevTab]?.focus()
        }
        break
      }
      case 'ArrowRight': {
        event.preventDefault()
        const nextTab = availableTabsArray[currentIndex + 1]
        if (nextTab) {
          setActiveTab(nextTab)
          tabRefs.current[nextTab]?.focus()
        }
        break
      }
      case 'Home': {
        event.preventDefault()
        const firstTab = availableTabsArray[0]
        if (firstTab) {
          setActiveTab(firstTab)
          tabRefs.current[firstTab]?.focus()
        }
        break
      }
      case 'End': {
        event.preventDefault()
        const lastTab = availableTabsArray[availableTabsArray.length - 1]
        if (lastTab) {
          setActiveTab(lastTab)
          tabRefs.current[lastTab]?.focus()
        }
        break
      }
    }
  }

  // Optimized image component with better error handling and loading states
  const OptimizedImage = ({ src, alt, className, loading = "lazy", sizes, width, height }) => {
    const [imgError, setImgError] = useState(false)
    const [imgLoading, setImgLoading] = useState(true)
    
    useEffect(() => {
      setImgError(false)
      setImgLoading(true)
    }, [src])
    
    if (imgError || !src) {
      return (
        <div 
          className={`${className} image-placeholder`} 
          role="img"
          aria-label={alt}
          style={{ width: width || '100%', height: height || '200px' }}
        >
          <span>📷</span>
        </div>
      )
    }
    
    return (
      <img 
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        sizes={sizes}
        width={width}
        height={height}
        onError={() => setImgError(true)}
        onLoad={() => setImgLoading(false)}
        style={{ opacity: imgLoading ? 0.5 : 1 }}
        decoding="async"
      />
    )
  }

  return (
    <div className="spotlight-content">
      {/* Tab Navigation */}
      <div className="tab-navigation" role="tablist" aria-label="Profile content tabs">
        {availableTabs.has('stories') && (
          <button 
            ref={el => tabRefs.current['stories'] = el}
            className={`tab-button ${activeTab === 'stories' ? 'active' : ''}`}
            onClick={() => setActiveTab('stories')}
            onKeyDown={(e) => handleTabKeyDown(e, 'stories')}
            role="tab"
            aria-selected={activeTab === 'stories'}
            aria-controls="stories-panel"
            id="stories-tab"
            tabIndex={activeTab === 'stories' ? 0 : -1}
          >
            Stories
          </button>
        )}
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
        <span>Sort by:</span>
        <button className="sort-button">
          Recent
          <span className="sort-arrow">▼</span>
        </button>
      </div>

      {/* Content Grid */}
      <div 
        className={`content-grid ${loading ? 'loading' : ''}`}
        role="tabpanel" 
        aria-labelledby={`${activeTab}-tab`}
        id={`${activeTab}-panel`}
      >
        {!loading && items.length === 0 && (
          <div className="empty-message" role="status" aria-live="polite" aria-atomic="true">
            No {getTabTitle(activeTab).toLowerCase()} available for this profile.
          </div>
        )}
        {items.map((item, index) => (
          <article 
            key={index} 
            className={`content-tile ${item.isProfile ? 'profile-tile' : ''} ${item.isStory ? 'story-tile' : ''}`} 
            tabIndex="0" 
            role="button" 
            aria-label={item.isProfile ? `View profile of ${item.user}` : item.isStory ? `View story: ${item.description}` : `View content by ${item.user}`}
            onClick={() => handleTileActivate(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleTileActivate(item)
              }
            }}
          >
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
                width={item.isProfile ? "60" : "280"}
                height={item.isProfile ? "60" : "200"}
              />
            )}
            <div className="tile-content">
              {item.user && (
                <h4 className="tile-user">{item.user}</h4>
              )}
              {item.description && (
                <p className="tile-description">{item.description}</p>
              )}
              {(item.views || item.comments || item.shares) && (
                <div className="tile-stats">
                  {item.views && (
                    <span className="stat-item">
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff0050'%3E%3Cpath d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'/%3E%3C/svg%3E" alt="Views" width="16" height="16" />
                      {item.views}
                    </span>
                  )}
                  {item.comments && (
                    <span className="stat-item">
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z'/%3E%3C/svg%3E" alt="Comments" width="16" height="16" />
                      {item.comments}
                    </span>
                  )}
                  {item.shares && (
                    <span className="stat-item">
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z'/%3E%3C/svg%3E" alt="Shares" width="16" height="16" />
                      {item.shares}
                    </span>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}