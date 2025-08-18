import { useState } from 'react'
import './App.css'
import ContentModal from './ContentModal'

export default function Spotlight({ items }) {
  const [showModal, setShowModal] = useState(false)
  const [activeContent, setActiveContent] = useState(null)
  
  if (!items) return null
  if (items.length === 0) return <p>No Spotlight results.</p>
  
  const handleItemClick = (item) => {
    setActiveContent(item)
    setShowModal(true)
  }
  
  const handleCloseModal = () => {
    setShowModal(false)
    setActiveContent(null)
  }
  
  return (
    <div className="spotlight-grid">
      {items.map((item, idx) => (
        <div 
          key={idx} 
          className={`spotlight-item ${item.url ? 'clickable' : ''}`}
          onClick={() => handleItemClick(item)}
          style={{ cursor: item.url ? 'pointer' : 'default' }}
        >
          {item.thumbnail && <img src={item.thumbnail} alt={item.user || `spotlight-${idx}`} />}
          <p className="spotlight-user">{item.user}</p>
          {item.description && <p className="spotlight-desc">{item.description}</p>}
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
