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
      
      // Add URL state for bookmarking (like real Snapchat)
      const currentUrl = new URL(window.location)
      if (item?.url) {
        // Extract video ID from Snapchat URL for hash
        const videoId = item.url.split('/spotlight/')[1] || item.description?.replace(/\s+/g, '-').toLowerCase()
        currentUrl.hash = `#spotlight/${videoId}`
        window.history.pushState(null, '', currentUrl)
      }
      
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

    // For video/story content - render video modal like real Snapchat
    return (
      <div className="modal-content spotlight-modal">
        <div className="modal-header">
          <div className="modal-user-info">
            <h3>{item.user}</h3>
            {item.views && <span className="view-count">👁 {item.views}</span>}
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">✕</button>
        </div>
        
        <div className="modal-video-container">
          {item.thumbnail && (
            <div className="video-placeholder">
              <img 
                src={item.thumbnail} 
                alt={item.description || 'Content'} 
                className="modal-video-thumbnail"
              />
              <div className="play-overlay">
                <div className="play-button">▶</div>
              </div>
            </div>
          )}
        </div>
        
        {item.description && (
          <div className="modal-description">
            <p>{item.description}</p>
          </div>
        )}
        
        <div className="modal-stats">
          {item.views && <span>👁 {item.views}</span>}
          {item.comments && <span>💬 {item.comments}</span>}
          {item.shares && <span>🔄 {item.shares}</span>}
        </div>
        
        <div className="modal-actions">
          <button className="action-btn primary">
            {item.isStory ? 'View on Snapchat' : 'Watch on Snapchat'}
          </button>
          <button className="action-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay spotlight-overlay" onClick={onClose}>
      <div className="modal-container spotlight-container" onClick={(e) => e.stopPropagation()}>
        {renderContent()}
      </div>
    </div>
  )
}