import { useEffect, useState } from 'react'
import Spotlight from './Spotlight'
import Stories from './Stories'
import './App.css'

export default function Tabs({ username, displayName }) {
  const [items, setItems] = useState([])
  const [activeTab, setActiveTab] = useState('spotlight')

  useEffect(() => {
    if (!username) return
    fetchTabContent(activeTab)
  }, [username, activeTab])

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
          selector = 'a[href*="/spotlight/"]' // Tagged content shows spotlight videos that mention the user
          dataMapper = (tile) => {
            const linkText = tile.textContent?.trim() || ''
            const numbers = linkText.match(/\d+[kK]?/g) || []
            const userName = tile.href?.match(/@([^/]+)/)?.[1] || 'Unknown'
            
            // Look for description with hashtags in the DOM structure
            let description = 'Tagged content'
            
            // Look for paragraph elements containing hashtag links in the parent container
            const container = tile.closest('div')
            if (container) {
              const paragraphs = container.querySelectorAll('p')
              for (const p of paragraphs) {
                if (p.querySelector('a[href*="/tag/"]') && p.textContent?.trim()) {
                  description = p.textContent.trim()
                  break
                }
              }
            }
            
            // If no hashtag description found, use link text without numbers
            if (description === 'Tagged content' && linkText) {
              description = linkText.replace(/\d+[kK]?\s*/g, '').trim() || 'Tagged content'
            }
            
            return {
              thumbnail: tile.querySelector('img')?.src,
              user: userName,
              description: description,
              views: numbers[0] || '0',
              comments: numbers[1] || '0',
              shares: numbers[2] || '0'
            }
          }
          break
        case 'related':
          // Related tab shows profile recommendations, use mock data that matches real Snapchat
          const relatedProfiles = [
            { name: 'FerrariFatboy 🔥', username: 'ferrarifatboy', image: 'https://cf-st.sc-cdn.net/aps/bolt_web/aHR0cHM6Ly9jZi1zdC5zYy1jZG4ubmV0L2Fwcy9ib2x0L2FIUjBjSE02THk5alppMXpkQzV6WXkxalpHNHVibVYwTDJRdldGaENaazVJU0hoR05HWlNTM0ZXYUhSc1NIRjBQMkp2UFVWbk1HRkJRbTlCVFdkRlJWTkJTbEZIVjBGQ0puVmpQVEkxLl9SUzAsNjQwX0ZNanBlZw._RS84,84_FMwebp' },
            { name: 'Kevin Hart', username: 'lilswag79', image: 'https://cf-st.sc-cdn.net/aps/bolt_web/aHR0cHM6Ly9jZi1zdC5zYy1jZG4ubmV0L2Fwcy9ib2x0L2FIUjBjSE02THk5alppMXpkQzV6WXkxalpHNHVibVYwTDJRdk1FNUxRVGhPTUcxM1luSlFaMDFYUWpoYWJtTTBQMkp2UFVWbk1HRkJRbTlCVFdkRlJWTkJTbEZIVjBGQ0puVmpQVEkxLl9SUzAsNjQwX0ZNcG5n._RS84,84_FMwebp' },
            { name: 'Snoop Dogg', username: 'snoopdogg', image: 'https://cf-st.sc-cdn.net/aps/bolt_web/aHR0cHM6Ly9jZi1zdC5zYy1jZG4ubmV0L2Fwcy9ib2x0L2FIUjBjSE02THk5alppMXpkQzV6WXkxalpHNHVibVYwTDJRdmJ6TnRWRzlMVFVaUFpuZHdWa1ZSVFd3eE9GVmlQMkp2UFVWbmEzbEJVVkpKUVd4QldsbEJSU1V6UkNaMVl6MHlOUS5fUlMwLDY0MF9GTWpwZWc._RS84,84_FMwebp' }
          ]
          
          setItems(relatedProfiles.map(profile => ({
            thumbnail: profile.image,
            user: profile.name,
            description: `@${profile.username}`,
            isProfile: true
          })))
          return
          break
        default:
          return
      }

      const res = await fetch(url)
      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      
      const tiles = [...doc.querySelectorAll(selector)]
      let data = tiles.map(dataMapper).filter(item => item.thumbnail)
      
      // For Tagged tab, filter out entries that are from the profile owner to show diverse users
      if (tab === 'tagged') {
        data = data.filter(item => item.user !== username)
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
        <button 
          className={`tab-button ${activeTab === 'spotlight' ? 'active' : ''}`}
          onClick={() => setActiveTab('spotlight')}
        >
          Spotlight
        </button>
        <button 
          className={`tab-button ${activeTab === 'lenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('lenses')}
        >
          Lenses
        </button>
        <button 
          className={`tab-button ${activeTab === 'tagged' ? 'active' : ''}`}
          onClick={() => setActiveTab('tagged')}
        >
          Tagged
        </button>
        <button 
          className={`tab-button ${activeTab === 'related' ? 'active' : ''}`}
          onClick={() => setActiveTab('related')}
        >
          Related
        </button>
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