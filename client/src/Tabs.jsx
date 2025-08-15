import { useEffect, useState } from 'react'
import Spotlight from './Spotlight'
import Stories from './Stories'
import './App.css'

export default function Tabs({ username, displayName }) {
  const [items, setItems] = useState([])
  const [activeTab, setActiveTab] = useState('spotlight')
  const [availableTabs, setAvailableTabs] = useState(new Set(['spotlight', 'lenses', 'tagged', 'related']))

  useEffect(() => {
    if (!username) return
    checkAllTabsForContent()
  }, [username])

  useEffect(() => {
    if (!username || !availableTabs.has(activeTab)) return
    fetchTabContent(activeTab)
  }, [username, activeTab, availableTabs])

  async function checkAllTabsForContent() {
    const tabsWithContent = new Set()
    const tabs = ['spotlight', 'lenses', 'tagged', 'related']
    
    for (const tab of tabs) {
      const hasContent = await checkTabHasContent(tab)
      if (hasContent) {
        tabsWithContent.add(tab)
      }
    }
    
    setAvailableTabs(tabsWithContent)
    
    // If current active tab has no content, switch to first available tab
    if (!tabsWithContent.has(activeTab)) {
      const firstAvailable = tabs.find(tab => tabsWithContent.has(tab))
      if (firstAvailable) {
        setActiveTab(firstAvailable)
      }
    }
  }

  async function checkTabHasContent(tab) {
    try {
      // Use the exact same logic as fetchTabContent but just check if we get valid items
      let url, selector, dataMapper
      
      switch (tab) {
        case 'spotlight':
          url = `/snap/@${username}?locale=en-US&tab=Spotlight`
          selector = 'a[href*="/spotlight/"]'
          dataMapper = (tile) => {
            const linkText = tile.textContent?.trim() || ''
            const numbers = linkText.match(/\d+[kK]?/g) || []
            const [views, comments, shares] = numbers.slice(0, 3)
            
            return {
              thumbnail: tile.querySelector('img')?.src,
              user: tile.href?.match(/@([^/]+)/)?.[1] || 'Unknown',
              description: linkText.replace(/\d+[kK]?\s*/g, '').trim() || 'Spotlight video',
              views: views || '0',
              comments: comments || '0', 
              shares: shares || '0'
            }
          }
          break
        case 'lenses':
          url = `/snap/@${username}?locale=en-US&tab=Lenses`
          selector = 'a[href*="/unlock/"]'
          dataMapper = (tile) => ({
            thumbnail: tile.querySelector('img')?.src,
            user: username,
            description: tile.querySelector('p')?.textContent || 'Lens'
          })
          break
        case 'tagged':
          url = `/snap/@${username}?locale=en-US&tab=Tagged`
          selector = 'a[href*="/spotlight/"], script[type="application/ld+json"]'
          dataMapper = (element) => {
            // Same logic as in fetchTabContent
            if (element.tagName === 'SCRIPT') {
              try {
                const data = JSON.parse(element.textContent)
                if (data['@type'] === 'VideoObject' && data.keywords && data.keywords.includes('#' + username.replace(/\d+$/, ''))) {
                  const creatorName = data.creator?.alternateName || 'Unknown'
                  return {
                    thumbnail: data.thumbnailUrl,
                    user: creatorName,
                    description: data.name || data.description || 'Tagged content',
                    views: '0',
                    comments: '0',
                    shares: '0'
                  }
                }
                return null
              } catch (e) {
                return null
              }
            }
            
            const linkText = element.textContent?.trim() || ''
            const numbers = linkText.match(/\d+[kK]?/g) || []
            const userName = element.href?.match(/@([^/]+)/)?.[1] || 'Unknown'
            
            let description = 'Tagged content'
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
              if (description !== 'Tagged content') break
              container = container.parentElement
            }
            
            return {
              thumbnail: element.querySelector('img')?.src,
              user: userName,
              description: description,
              views: numbers[0] || '0',
              comments: numbers[1] || '0',
              shares: numbers[2] || '0'
            }
          }
          break
        case 'related':
          url = `/snap/@${username}?locale=en-US`
          selector = 'a[href*="/add/"]'
          dataMapper = (element) => {
            const addLink = element.href
            const usernameMatch = addLink.match(/\/add\/([^?]+)/)
            if (!usernameMatch) return null
            
            const relatedUsername = usernameMatch[1]
            const nameElement = element.querySelector('h5')
            const imageElement = element.querySelector('img')
            const paragraphElement = element.querySelector('p')
            
            if (!nameElement) return null
            
            let thumbnailUrl = null
            if (imageElement) {
              thumbnailUrl = imageElement.src || imageElement.getAttribute('data-src') || imageElement.getAttribute('data-lazy')
            }
            
            if (!thumbnailUrl) {
              thumbnailUrl = `https://cf-st.sc-cdn.net/aps/bolt/default-profile-${relatedUsername}.webp`
            }
            
            return {
              thumbnail: thumbnailUrl,
              user: nameElement.textContent.trim(),
              description: paragraphElement ? paragraphElement.textContent.trim() : `@${relatedUsername}`,
              isProfile: true
            }
          }
          break
        default:
          return false
      }

      const res = await fetch(url)
      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const elements = [...doc.querySelectorAll(selector)]
      
      let data = elements.map(dataMapper).filter(item => item && item.thumbnail)
      
      // Apply the same filtering as in fetchTabContent
      if (tab === 'tagged') {
        data = data.filter(item => item.user !== username)
        const seen = new Set()
        data = data.filter(item => {
          const key = `${item.user}:${item.description}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
      }
      
      return data.length > 0
    } catch (error) {
      console.error(`Error checking content for ${tab}:`, error)
      return false
    }
  }

  async function fetchTabContent(tab) {
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
            
            return {
              thumbnail: tile.querySelector('img')?.src,
              user: tile.href?.match(/@([^/]+)/)?.[1] || 'Unknown',
              description: linkText.replace(/\d+[kK]?\s*/g, '').trim() || 'Spotlight video',
              views: views || '0',
              comments: comments || '0', 
              shares: shares || '0'
            }
          }
          break
        case 'lenses':
          url = `/snap/@${username}?locale=en-US&tab=Lenses`
          selector = 'a[href*="/unlock/"]' // Lenses are unlock links
          dataMapper = (tile) => ({
            thumbnail: tile.querySelector('img')?.src,
            user: username, // Lenses are created by the profile owner
            description: tile.querySelector('p')?.textContent || 'Lens'
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
                  const creatorName = data.creator?.alternateName || 'Unknown'
                  return {
                    thumbnail: data.thumbnailUrl,
                    user: creatorName,
                    description: data.name || data.description || 'Tagged content',
                    views: '0', // JSON-LD doesn't always have view counts
                    comments: '0',
                    shares: '0'
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
            const userName = element.href?.match(/@([^/]+)/)?.[1] || 'Unknown'
            
            // Look for description with hashtags in nearby elements
            let description = 'Tagged content'
            
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
              if (description !== 'Tagged content') break
              container = container.parentElement
            }
            
            return {
              thumbnail: element.querySelector('img')?.src,
              user: userName,
              description: description,
              views: numbers[0] || '0',
              comments: numbers[1] || '0',
              shares: numbers[2] || '0'
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
            
            console.log(`Mapping element for ${relatedUsername}:`, {
              hasName: !!nameElement,
              hasImage: !!imageElement,
              name: nameElement?.textContent.trim(),
              imageSrc: imageElement?.src
            })
            
            if (!nameElement) return null
            
            // Get thumbnail URL - try multiple sources
            let thumbnailUrl = null
            if (imageElement) {
              thumbnailUrl = imageElement.src || imageElement.getAttribute('data-src') || imageElement.getAttribute('data-lazy')
            }
            
            // If no image found, use fallback URL pattern based on username
            if (!thumbnailUrl) {
              thumbnailUrl = `https://cf-st.sc-cdn.net/aps/bolt/default-profile-${relatedUsername}.webp`
            }
            
            return {
              thumbnail: thumbnailUrl,
              user: nameElement.textContent.trim(),
              description: paragraphElement ? paragraphElement.textContent.trim() : `@${relatedUsername}`,
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
        console.log(`Related tab debug: Found ${elements.length} elements with selector ${selector}`)
        elements.slice(0, 5).forEach((el, i) => {
          console.log(`Element ${i}:`, el.href, el.textContent?.slice(0, 50))
        })
      }
      
      let data = elements.map(dataMapper).filter(item => item && item.thumbnail)
      
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
      
      // For Related tab, add fallback profiles if dynamic parsing failed
      if (tab === 'related' && data.length === 0) {
        console.log('Related tab: No dynamic profiles found, using fallback')
        const fallbackProfiles = [
          { name: 'Jordyn Jones', username: 'jordynjones11', image: 'https://cf-st.sc-cdn.net/aps/bolt_web/aHR0cHM6Ly9jZi1zdC5zYy1jZG4ubmV0L2Fwcy9ib2x0L2FIUjBjSE02THk5alppMXpkQzV6WXkxalpHNHVibVYwTDJRdlRVMVdUMWh5YkRWc2IxcExlamhNUlZVMVUyRTFQMkp2UFVWbk1HRkJRbTlCVFdkRlJWTkJTbEZIVjBGQ0puVmpQVEkxLl9SUzAsNjQwX0ZNcG5n._RS84,84_FMwebp' },
          { name: 'Baby Ariel', username: 'babyariel', image: 'https://cf-st.sc-cdn.net/aps/bolt_web/aHR0cHM6Ly9jZi1zdC5zYy1jZG4ubmV0L2Fwcy9ib2x0L2FIUjBjSE02THk5alppMXpkQzV6WXkxalpHNHVibVYwTDJRdmNHVnlVV1pRZUZWMVkyRnNNVUkwU1dFemJITldQMkp2UFVWbk1HRkJRbTlCVFdkRlJWTkJTbEZIVjBGQ0puVmpQVEkxLl9SUzAsNjQwX0ZNanBlZw._RS84,84_FMwebp' },
          { name: 'Alissa Violet', username: 'alissaviolet', image: 'https://cf-st.sc-cdn.net/aps/bolt_web/aHR0cHM6Ly9jZi1zdC5zYy1jZG4ubmV0L2Fwcy9ib2x0L2FIUjBjSE02THk5alppMXpkQzV6WXkxalpHNHVibVYwTDJRdlVubFFNVE5CVUZKQ1RrMVVlR2RqTTJORVNXeEtQMkp2UFVWbmEzbEJVVkpKUVd4QldsbEJSU1V6UkNaMVl6MHlOUS5fUlMwLDY0MF9GTWpwZWc._RS84,84_FMwebp' }
        ]
        
        data = fallbackProfiles.map(profile => ({
          thumbnail: profile.image,
          user: profile.name,
          description: `@${profile.username}`,
          isProfile: true
        }))
      }
      
      setItems(data)
    } catch (error) {
      console.error(`Error fetching ${tab} content:`, error)
      setItems([])
    }
  }

  const getTabTitle = (tab) => {
    const tabTitles = {
      spotlight: 'Spotlight results',
      lenses: 'Lenses',
      tagged: 'Tagged content',
      related: 'Related content'
    }
    return tabTitles[tab] || 'Content'
  }

  return (
    <div className="spotlight-content">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        {availableTabs.has('spotlight') && (
          <button 
            className={`tab-button ${activeTab === 'spotlight' ? 'active' : ''}`}
            onClick={() => setActiveTab('spotlight')}
          >
            Spotlight
          </button>
        )}
        {availableTabs.has('lenses') && (
          <button 
            className={`tab-button ${activeTab === 'lenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('lenses')}
          >
            Lenses
          </button>
        )}
        {availableTabs.has('tagged') && (
          <button 
            className={`tab-button ${activeTab === 'tagged' ? 'active' : ''}`}
            onClick={() => setActiveTab('tagged')}
          >
            Tagged
          </button>
        )}
        {availableTabs.has('related') && (
          <button 
            className={`tab-button ${activeTab === 'related' ? 'active' : ''}`}
            onClick={() => setActiveTab('related')}
          >
            Related
          </button>
        )}
      </div>

      {/* Sort Filter */}
      <div className="sort-filter">
        <span className="sort-label">Sort by:</span>
        <button className="sort-button">
          <span>Recent</span>
          <span className="sort-arrow">▼</span>
        </button>
      </div>
      
      <div className="content-grid">
        {items.map((item, index) => (
          <div key={index} className={`content-tile ${item.isProfile ? 'profile-tile' : ''}`}>
            {item.thumbnail && (
              <img src={item.thumbnail} alt="" className={item.isProfile ? "profile-image" : "tile-image"} />
            )}
            <div className="tile-content">
              {item.user && (
                <div className="tile-user">{item.user}</div>
              )}
              {item.description && (
                <div className="tile-description">{item.description}</div>
              )}
              {!item.isProfile && (
                <div className="tile-stats">
                  {item.views && (
                    <span className="stat-item">
                      <span>❤️</span>
                      <span>{item.views}</span>
                    </span>
                  )}
                  {item.comments && (
                    <span className="stat-item">
                      <span>💬</span>
                      <span>{item.comments}</span>
                    </span>
                  )}
                  {item.shares && (
                    <span className="stat-item">
                      <span>🔗</span>
                      <span>{item.shares}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}