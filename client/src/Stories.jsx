import { useState } from 'react'
import './App.css'
import ContentModal from './ContentModal'

export default function Stories({ items }) {
  const [showModal, setShowModal] = useState(false)
  const [activeContent, setActiveContent] = useState(null)
  
  if (!items) return null
  if (items.length === 0) return <p>No Stories found.</p>
  
  const handleItemClick = (item) => {
    setActiveContent(item)
    setShowModal(true)
  }
  
  const handleCloseModal = () => {
    setShowModal(false)
    setActiveContent(null)
  }
  
  return (
    <div className="stories-grid">
      {items.map((item, idx) => (
        <div 
          key={idx} 
          className={`story-item ${item.url ? 'clickable' : ''}`}
          onClick={() => handleItemClick(item)}
          style={{ cursor: item.url ? 'pointer' : 'default' }}
        >
          {item.thumbnail && <img src={item.thumbnail} alt={item.title || `story-${idx}`} />}
          <p className="story-title">{item.title}</p>
          {item.description && <p className="story-desc">{item.description}</p>}
        </div>
      ))}
      
      {/* Content Modal */}
      <ContentModal 
        item={activeContent}
        isOpen={showModal}
        onClose={handleCloseModal}
      />
    </div>
  )
}
