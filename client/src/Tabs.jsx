import { useEffect, useState } from 'react'
import Spotlight from './Spotlight'
import Stories from './Stories'
import './App.css'

const TABS = ['Search', 'Stories', 'Spotlight', 'Chat', 'Lenses', 'Snapchat+', 'Download']

export default function Tabs({ username }) {
  const [active, setActive] = useState('Spotlight')
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!username) return
    fetchTab(active)
  }, [active, username])

  async function fetchTab(tab) {
    const res = await fetch(`/snap/@${username}?locale=en-US&tab=${tab}`)
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')
    if (tab === 'Spotlight') {
      const tiles = [...doc.querySelectorAll('.SpotlightResultTile_container__NK4Xj')]
      const data = tiles.map(tile => ({
        thumbnail: tile.querySelector('img')?.src,
        user: tile.querySelector('.SpotlightResultTile_profileLink__cjGsP')?.textContent,
        description: tile.querySelector('.SpotlightResultTile_description__x_CF_')?.textContent
      }))
      setItems(data)
    } else if (tab === 'Stories') {
      const cards = [...doc.querySelectorAll('.StoryCard')]
      const data = cards.map(card => ({
        thumbnail: card.querySelector('img')?.src,
        title: card.querySelector('.StoryDescription_topic__Cziej')?.textContent,
        description: card.querySelector('.StoryDescription_description__N0drI')?.textContent
      }))
      setItems(data)
    } else {
      setItems([])
    }
  }

  function renderContent() {
    if (active === 'Spotlight') return <Spotlight items={items} />
    if (active === 'Stories') return <Stories items={items} />
    return <p className="placeholder">{active} tab not implemented.</p>
  }

  return (
    <div className="tabs">
      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={active === tab ? 'active' : ''}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      <div className="tab-content">{renderContent()}</div>
    </div>
  )
}
