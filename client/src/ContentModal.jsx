import { useEffect } from 'react'
import './App.css'

export default function ContentModal({ item, isOpen, onClose }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const handlePopstate = () => {
      onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      window.addEventListener('popstate', handlePopstate)
      
      // Add URL state for bookmarking
      const currentUrl = new URL(window.location)
      currentUrl.searchParams.set('content', item?.description || 'content')
      window.history.pushState(null, '', currentUrl)
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('popstate', handlePopstate)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, item])

  if (!isOpen || !item) return null

  const renderContent = () => {
    if (item.isProfile) {
      // For profile tiles, redirect to the profile page within our app
      const username = item.url?.match(/\/add\/([^?]+)/)?.[1]
      if (username) {
        window.location.href = `/?username=${username}`
        return null
      }
    }

    // For video/story content
    return (
      <div className="modal-content">
        <div className="modal-header">
          <h3>{item.user}</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          {item.thumbnail && (
            <img 
              src={item.thumbnail} 
              alt={item.description || 'Content'} 
              className="modal-image"
            />
          )}
          
          {item.description && (
            <p className="modal-description">{item.description}</p>
          )}
          
          {item.views && (
            <div className="modal-stats">
              <span>👁 {item.views} views</span>
              {item.comments && <span>💬 {item.comments}</span>}
              {item.shares && <span>🔄 {item.shares}</span>}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="action-btn">
            {item.isStory ? 'View Story' : 'Watch Video'}
          </button>
          <button className="action-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {renderContent()}
      </div>
    </div>
  )
}