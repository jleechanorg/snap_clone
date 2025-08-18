import { useEffect, useState, useRef } from 'react'
import './App.css'

export default function ContentModal({ item, isOpen, onClose }) {
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const videoRef = useRef(null)

  // Determine content type for background and video behavior
  const isVideoContent = item?.url?.includes('/spotlight/') || (!item?.isStory && !item?.isProfile)
  const isStoryContent = item?.isStory
  
  // Extract video URL from Snapchat URL
  const getVideoUrl = (snapchatUrl) => {
    if (!snapchatUrl) return null
    
    // For real implementation, this would need to extract actual video URLs
    // For now, we'll use a placeholder approach since we can't access real Snapchat videos
    // In a real app, this would involve API calls to get direct video URLs
    
    // Check if it's a direct video URL (mp4, webm, etc.)
    if (snapchatUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
      return snapchatUrl
    }
    
    // For demo purposes, if we have a spotlight URL, we can use a sample video
    // This would be replaced with actual Snapchat API integration
    if (snapchatUrl.includes('/spotlight/') || snapchatUrl.includes('snapchat.com')) {
      // Use a sample video URL for demonstration (commented out to avoid external dependencies)
      // In production, this would extract the real video URL from Snapchat's API
      // return 'https://sample-videos.com/zip/10/mp4/480/SampleVideo_1280x720_1mb.mp4'
    }
    
    // For Snapchat URLs, we'd need to extract the actual video URL through their API
    // This is a placeholder that would be replaced with actual video URL extraction
    return null
  }

  const videoUrl = getVideoUrl(item?.url)

  useEffect(() => {
    if (isOpen && isVideoContent && videoUrl) {
      // Start video loading process
      setVideoLoading(true)
      setVideoError(false)
      setShowVideo(false)
      
      // Simulate video loading delay (in real app, this would be actual video loading)
      const timer = setTimeout(() => {
        setVideoLoading(false)
        setShowVideo(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    } else {
      setShowVideo(false)
      setVideoLoading(false)
      setVideoError(false)
    }
  }, [isOpen, isVideoContent, videoUrl])

  // Auto-play video when it becomes visible
  useEffect(() => {
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        setVideoError(true)
      })
    }
  }, [showVideo])

  // Handle video click to toggle play/pause
  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === ' ' || event.key === 'Spacebar') {
        // Space bar to play/pause video
        event.preventDefault()
        handleVideoClick()
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

  const handleVideoLoadStart = () => {
    setVideoLoading(true)
  }

  const handleVideoCanPlay = () => {
    setVideoLoading(false)
  }

  const handleVideoError = () => {
    setVideoLoading(false)
    setVideoError(true)
  }

  const renderVideoContent = () => {
    // For video content, show actual video or loading state
    if (videoUrl && showVideo && !videoError) {
      return (
        <video
          ref={videoRef}
          className="modal-video"
          autoPlay
          muted
          loop
          playsInline
          poster={item.thumbnail}
          onClick={handleVideoClick}
          onLoadStart={handleVideoLoadStart}
          onCanPlay={handleVideoCanPlay}
          onError={handleVideoError}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl.replace('.mp4', '.webm')} type="video/webm" />
          {/* Fallback to thumbnail if video fails */}
          <img src={item.thumbnail} alt={item.description || 'Content'} className="modal-video-thumbnail" />
        </video>
      )
    }
    
    // Show loading state
    if (videoLoading) {
      return (
        <div className="video-loading-container">
          <img 
            src={item.thumbnail} 
            alt={item.description || 'Content'} 
            className="modal-video-thumbnail loading"
          />
          <div className="video-loading-overlay">
            <div className="video-loading-spinner"></div>
            <span>Loading video...</span>
          </div>
        </div>
      )
    }
    
    // Fallback to thumbnail with play overlay (for URLs we can't extract video from)
    return (
      <div className="video-placeholder">
        <img 
          src={item.thumbnail} 
          alt={item.description || 'Content'} 
          className="modal-video-thumbnail"
        />
        <div className="play-overlay">
          <div className="play-button">▶</div>
          {videoError && (
            <div className="video-error-message">
              Video unavailable
            </div>
          )}
        </div>
      </div>
    )
  }

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
          {item.thumbnail && renderVideoContent()}
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

  // Dynamic overlay classes based on content type
  const overlayClasses = [
    'modal-overlay',
    isVideoContent ? 'spotlight-overlay' : 'story-overlay',
    isStoryContent ? 'story-content' : ''
  ].filter(Boolean).join(' ')

  const containerClasses = [
    'modal-container',
    isVideoContent ? 'spotlight-container' : 'story-container'
  ].filter(Boolean).join(' ')

  return (
    <div className={overlayClasses} onClick={onClose}>
      <div className={containerClasses} onClick={(e) => e.stopPropagation()}>
        {renderContent()}
      </div>
    </div>
  )
}