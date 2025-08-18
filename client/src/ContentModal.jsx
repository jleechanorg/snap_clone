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
  
  // ============================================================================
  // COMPREHENSIVE VIDEO DEBUGGING SYSTEM
  // ============================================================================
  
  // Debug state for comprehensive video analysis
  const [debugState, setDebugState] = useState({
    extraction: {
      attempts: 0,
      methods: [],
      urls: [],
      errors: [],
      snapchatUrl: null,
      proxyResponse: null,
      htmlLength: 0,
      nextDataFound: false,
      videoElementsFound: 0,
      jsonLdScripts: 0
    },
    playback: {
      attempted: false,
      success: false,
      error: null,
      videoSrc: null,
      videoDuration: 0,
      currentTime: 0,
      paused: true,
      readyState: 0
    },
    timeline: []
  })

  // Debug logger with structured output
  const debugLog = (category, action, data = {}) => {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      category,
      action,
      data,
      itemUrl: item?.url
    }
    
    setDebugState(prev => ({
      ...prev,
      timeline: [...prev.timeline, logEntry]
    }))
    
    // Enhanced console output for immediate visibility
    console.group(`🎥 VIDEO DEBUG [${category.toUpperCase()}] ${action}`)
    console.log('⏰ Time:', timestamp)
    console.log('🔗 Item URL:', item?.url)
    if (Object.keys(data).length > 0) {
      console.table(data)
    }
    console.groupEnd()
    
    return logEntry
  }

  // Video state analyzer
  const analyzeVideoState = () => {
    if (!videoRef.current) return null
    
    const video = videoRef.current
    const state = {
      src: video.src,
      currentSrc: video.currentSrc,
      duration: video.duration,
      currentTime: video.currentTime,
      paused: video.paused,
      ended: video.ended,
      readyState: video.readyState,
      networkState: video.networkState,
      buffered: video.buffered.length,
      played: video.played.length,
      seekable: video.seekable.length,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      error: video.error
    }
    
    setDebugState(prev => ({
      ...prev,
      playback: { ...prev.playback, ...state }
    }))
    
    return state
  }
  
  // Extract video URL from Snapchat content
  const getVideoUrl = async (snapchatUrl) => {
    debugLog('EXTRACTION', 'Starting URL extraction', { snapchatUrl })
    
    setDebugState(prev => ({
      ...prev,
      extraction: {
        ...prev.extraction,
        attempts: prev.extraction.attempts + 1,
        snapchatUrl
      }
    }))

    if (!snapchatUrl) {
      debugLog('EXTRACTION', 'No URL provided', { result: 'FAIL' })
      return null
    }
    
    // Check if it's already a direct video URL
    if (snapchatUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
      debugLog('EXTRACTION', 'Direct video URL detected', { 
        url: snapchatUrl,
        result: 'SUCCESS'
      })
      return snapchatUrl
    }
    
    // For Snapchat URLs, extract the actual video URL from the page
    if (snapchatUrl.includes('snapchat.com')) {
      try {
        const proxyUrl = snapchatUrl.replace('https://www.snapchat.com', '/snap')
        debugLog('EXTRACTION', 'Fetching via proxy', { proxyUrl })
        
        const response = await fetch(proxyUrl)
        const responseData = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
        
        setDebugState(prev => ({
          ...prev,
          extraction: { ...prev.extraction, proxyResponse: responseData }
        }))
        
        if (!response.ok) {
          const error = `Failed to fetch: ${response.status}`
          debugLog('EXTRACTION', 'Proxy fetch failed', { error, response: responseData })
          throw new Error(error)
        }
        
        const html = await response.text()
        setDebugState(prev => ({
          ...prev,
          extraction: { ...prev.extraction, htmlLength: html.length }
        }))
        
        debugLog('EXTRACTION', 'HTML received', { 
          length: html.length,
          status: response.status
        })
        
        const doc = new DOMParser().parseFromString(html, 'text/html')
        const extractionResults = {}
        
        // 1. Look for __NEXT_DATA__
        const nextDataScript = doc.querySelector('#__NEXT_DATA__')
        extractionResults.nextDataFound = !!nextDataScript
        
        if (nextDataScript) {
          debugLog('EXTRACTION', '__NEXT_DATA__ found', { length: nextDataScript.textContent.length })
          
          try {
            const nextData = JSON.parse(nextDataScript.textContent)
            const pageProps = nextData?.props?.pageProps
            
            if (pageProps) {
              const checkForVideoUrl = (obj, path = '') => {
                if (!obj || typeof obj !== 'object') return []
                
                const foundUrls = []
                
                // Check for video URL properties
                const videoProps = ['videoUrl', 'contentUrl', 'url', 'src']
                for (const prop of videoProps) {
                  if (obj[prop] && typeof obj[prop] === 'string' && obj[prop].includes('.mp4')) {
                    foundUrls.push({ url: obj[prop], source: `__NEXT_DATA__.${path}.${prop}` })
                    debugLog('EXTRACTION', 'Video URL found in __NEXT_DATA__', {
                      url: obj[prop],
                      path: `${path}.${prop}`
                    })
                  }
                }
                
                // Recursively search nested objects
                for (const key in obj) {
                  if (key !== 'thumbnail' && key !== 'poster') {
                    const nested = checkForVideoUrl(obj[key], path ? `${path}.${key}` : key)
                    foundUrls.push(...nested)
                  }
                }
                
                return foundUrls
              }
              
              const videoUrls = checkForVideoUrl(pageProps, 'pageProps')
              if (videoUrls.length > 0) {
                debugLog('EXTRACTION', 'Video URLs extracted from __NEXT_DATA__', { 
                  count: videoUrls.length,
                  urls: videoUrls
                })
                return videoUrls[0].url
              }
            }
          } catch (e) {
            debugLog('EXTRACTION', '__NEXT_DATA__ parse failed', { error: e.message })
          }
        }
        
        // 2. Look for video elements
        const videoElements = doc.querySelectorAll('video')
        extractionResults.videoElementsFound = videoElements.length
        
        debugLog('EXTRACTION', 'Video elements scan', { count: videoElements.length })
        
        for (const video of videoElements) {
          if (video.src && video.src.includes('.mp4')) {
            debugLog('EXTRACTION', 'Video element with MP4 src found', { src: video.src })
            return video.src
          }
          
          const sources = video.querySelectorAll('source')
          for (const source of sources) {
            if (source.src && source.src.includes('.mp4')) {
              debugLog('EXTRACTION', 'Video source element found', { src: source.src })
              return source.src
            }
          }
        }
        
        // 3. Look for JSON-LD structured data
        const scripts = doc.querySelectorAll('script[type="application/ld+json"]')
        extractionResults.jsonLdScripts = scripts.length
        
        debugLog('EXTRACTION', 'JSON-LD scripts scan', { count: scripts.length })
        
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent)
            
            const extractVideoFromLD = (obj) => {
              if (!obj) return null
              
              if (obj['@type'] === 'VideoObject') {
                if (obj.contentUrl && obj.contentUrl.includes('.mp4')) {
                  debugLog('EXTRACTION', 'Video URL found in JSON-LD', { 
                    url: obj.contentUrl,
                    type: 'VideoObject.contentUrl'
                  })
                  return obj.contentUrl
                }
                if (obj.url && obj.url.includes('.mp4')) {
                  debugLog('EXTRACTION', 'Video URL found in JSON-LD', { 
                    url: obj.url,
                    type: 'VideoObject.url'
                  })
                  return obj.url
                }
              }
              
              if (Array.isArray(obj)) {
                for (const item of obj) {
                  const result = extractVideoFromLD(item)
                  if (result) return result
                }
              }
              
              return null
            }
            
            const videoUrl = extractVideoFromLD(data)
            if (videoUrl) return videoUrl
            
          } catch (e) {
            debugLog('EXTRACTION', 'JSON-LD parse failed', { error: e.message })
          }
        }
        
        // 4. Look for inline script variables
        const allScripts = doc.querySelectorAll('script:not([type]), script[type="text/javascript"]')
        debugLog('EXTRACTION', 'Inline scripts scan', { count: allScripts.length })
        
        for (const script of allScripts) {
          const content = script.textContent || script.innerHTML
          const videoUrlRegex = /"(https?:\/\/[^"]*\.mp4[^"]*)"/g
          let match
          
          while ((match = videoUrlRegex.exec(content)) !== null) {
            const url = match[1]
            if (!url.includes('thumb') && !url.includes('poster') && !url.match(/\d+x\d+/)) {
              debugLog('EXTRACTION', 'Video URL found in inline script', { url })
              return url
            }
          }
        }
        
        // Update extraction results
        setDebugState(prev => ({
          ...prev,
          extraction: { ...prev.extraction, ...extractionResults }
        }))
        
        debugLog('EXTRACTION', 'All methods exhausted', { 
          result: 'FAIL',
          summary: extractionResults
        })
        
        return null
        
      } catch (error) {
        debugLog('EXTRACTION', 'Extraction failed', { 
          error: error.message,
          result: 'ERROR'
        })
        
        setDebugState(prev => ({
          ...prev,
          extraction: {
            ...prev.extraction,
            errors: [...prev.extraction.errors, error.message]
          }
        }))
        
        return null
      }
    }
    
    debugLog('EXTRACTION', 'Non-Snapchat URL', { result: 'SKIP' })
    return null
  }

  const [videoUrl, setVideoUrl] = useState(null)

  // Effect to fetch video URL when modal opens
  // Enhanced useEffect with comprehensive debugging for video URL fetching
  useEffect(() => {
    if (isOpen && isVideoContent && item?.url) {
      debugLog('PLAYBACK', 'Modal opened - starting video setup', {
        isOpen,
        isVideoContent,
        itemUrl: item.url
      })
      
      setVideoLoading(true)
      setVideoError(false)
      setShowVideo(false)
      setVideoUrl(null)
      
      // Fetch the actual video URL with comprehensive debugging
      getVideoUrl(item.url)
        .then((url) => {
          if (url) {
            debugLog('PLAYBACK', 'Video URL extracted successfully', {
              extractedUrl: url,
              originalUrl: item.url
            })
            setVideoUrl(url)
            setShowVideo(true)
          } else {
            debugLog('PLAYBACK', 'No video URL found - falling back to thumbnail', {
              originalUrl: item.url,
              fallbackMode: 'thumbnail_with_play_button'
            })
            setShowVideo(false)
          }
          setVideoLoading(false)
        })
        .catch((error) => {
          debugLog('PLAYBACK', 'Video URL extraction failed', {
            error: error.message,
            originalUrl: item.url
          })
          setVideoError(true)
          setVideoLoading(false)
          setShowVideo(false)
        })
    } else {
      if (isOpen) {
        debugLog('PLAYBACK', 'Modal opened but no video setup needed', {
          isOpen,
          isVideoContent,
          hasUrl: !!item?.url,
          reason: !isVideoContent ? 'not_video_content' : 'no_url'
        })
      }
      
      setShowVideo(false)
      setVideoLoading(false)
      setVideoError(false)
      setVideoUrl(null)
    }
  }, [isOpen, isVideoContent, item?.url])

  // Enhanced video playback monitoring with comprehensive state tracking
  useEffect(() => {
    if (showVideo && videoUrl && videoRef.current) {
      debugLog('PLAYBACK', 'Setting up video element for playback', {
        videoUrl,
        videoElement: !!videoRef.current
      })
      
      setVideoLoading(true)
      
      const video = videoRef.current
      
      // Comprehensive event handlers for video state monitoring
      const handleLoadStart = () => {
        debugLog('PLAYBACK', 'Video load started', analyzeVideoState())
      }
      
      const handleCanPlay = () => {
        const state = analyzeVideoState()
        debugLog('PLAYBACK', 'Video can play - attempting autoplay', state)
        setVideoLoading(false)
        
        video.play().then(() => {
          debugLog('PLAYBACK', 'Video autoplay SUCCESS', {
            ...analyzeVideoState(),
            result: 'AUTOPLAY_SUCCESS'
          })
        }).catch((error) => {
          debugLog('PLAYBACK', 'Video autoplay FAILED', {
            error: error.message,
            ...analyzeVideoState(),
            result: 'AUTOPLAY_FAILED'
          })
          setVideoError(true)
        })
      }
      
      const handlePlay = () => {
        debugLog('PLAYBACK', 'Video started playing', analyzeVideoState())
      }
      
      const handlePause = () => {
        debugLog('PLAYBACK', 'Video paused', analyzeVideoState())
      }
      
      const handleTimeUpdate = () => {
        // Log every 5 seconds to avoid spam
        if (Math.floor(video.currentTime) % 5 === 0) {
          debugLog('PLAYBACK', 'Video progress update', {
            currentTime: video.currentTime,
            duration: video.duration,
            percentComplete: Math.round((video.currentTime / video.duration) * 100)
          })
        }
      }
      
      const handleError = (e) => {
        debugLog('PLAYBACK', 'Video error occurred', {
          error: e.target.error,
          ...analyzeVideoState(),
          result: 'VIDEO_ERROR'
        })
        setVideoError(true)
        setVideoLoading(false)
      }
      
      const handleEnded = () => {
        debugLog('PLAYBACK', 'Video playback ended', analyzeVideoState())
      }
      
      // Add all event listeners
      video.addEventListener('loadstart', handleLoadStart)
      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('play', handlePlay)
      video.addEventListener('pause', handlePause)
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('error', handleError)
      video.addEventListener('ended', handleEnded)
      
      // Set video source and trigger loading
      video.src = videoUrl
      video.load()
      
      return () => {
        debugLog('PLAYBACK', 'Cleaning up video event listeners', {})
        video.removeEventListener('loadstart', handleLoadStart)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('play', handlePlay)
        video.removeEventListener('pause', handlePause)
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('error', handleError)
        video.removeEventListener('ended', handleEnded)
      }
    }
  }, [showVideo, videoUrl])



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

  // ============================================================================
  // REAL-TIME DEBUG PANEL COMPONENT
  // ============================================================================
  
  const renderDebugPanel = () => {
    if (!import.meta.env.DEV) return null // Only show in development
    
    return (
      <div className="video-debug-panel" style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        width: '400px',
        maxHeight: '80vh',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: '#00ff00',
        fontFamily: 'Monaco, monospace',
        fontSize: '11px',
        padding: '10px',
        borderRadius: '8px',
        zIndex: 10000,
        overflow: 'auto',
        border: '1px solid #333'
      }}>
        <div style={{ 
          borderBottom: '1px solid #333', 
          marginBottom: '10px', 
          paddingBottom: '5px',
          color: '#ffff00',
          fontWeight: 'bold'
        }}>
          🎥 VIDEO DEBUG PANEL
        </div>
        
        {/* Current State */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>CURRENT STATE:</div>
          <div>Modal Open: {isOpen ? '✅' : '❌'}</div>
          <div>Video Content: {isVideoContent ? '✅' : '❌'}</div>
          <div>Video Loading: {videoLoading ? '⏳' : '✅'}</div>
          <div>Video Error: {videoError ? '❌' : '✅'}</div>
          <div>Show Video: {showVideo ? '✅' : '❌'}</div>
          <div>Video URL: {videoUrl ? '✅' : '❌'}</div>
        </div>
        
        {/* Extraction Stats */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#4ecdc4', fontWeight: 'bold' }}>EXTRACTION:</div>
          <div>Attempts: {debugState.extraction.attempts}</div>
          <div>Snapchat URL: {debugState.extraction.snapchatUrl ? '✅' : '❌'}</div>
          <div>Proxy Response: {debugState.extraction.proxyResponse?.status || 'N/A'}</div>
          <div>HTML Length: {debugState.extraction.htmlLength || 0}</div>
          <div>__NEXT_DATA__: {debugState.extraction.nextDataFound ? '✅' : '❌'}</div>
          <div>Video Elements: {debugState.extraction.videoElementsFound || 0}</div>
          <div>JSON-LD Scripts: {debugState.extraction.jsonLdScripts || 0}</div>
          <div>Errors: {debugState.extraction.errors.length}</div>
        </div>
        
        {/* Playback Stats */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#45b7d1', fontWeight: 'bold' }}>PLAYBACK:</div>
          <div>Video Src: {debugState.playback.videoSrc ? '✅' : '❌'}</div>
          <div>Paused: {debugState.playback.paused ? '⏸️' : '▶️'}</div>
          <div>Duration: {debugState.playback.videoDuration?.toFixed(2) || 'N/A'}s</div>
          <div>Current Time: {debugState.playback.currentTime?.toFixed(2) || 0}s</div>
          <div>Ready State: {debugState.playback.readyState}</div>
          <div>Playback Attempted: {debugState.playback.attempted ? '✅' : '❌'}</div>
          <div>Playback Success: {debugState.playback.success ? '✅' : '❌'}</div>
        </div>
        
        {/* Recent Timeline */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#ffa726', fontWeight: 'bold' }}>RECENT ACTIVITY:</div>
          <div style={{ maxHeight: '150px', overflow: 'auto' }}>
            {debugState.timeline.slice(-5).reverse().map((entry, index) => (
              <div key={index} style={{ 
                fontSize: '10px', 
                marginBottom: '2px',
                color: entry.category === 'EXTRACTION' ? '#4ecdc4' : '#45b7d1'
              }}>
                [{entry.timestamp.split('T')[1]?.split('.')[0]}] {entry.category}: {entry.action}
              </div>
            ))}
          </div>
        </div>
        
        {/* Manual Controls */}
        <div style={{ borderTop: '1px solid #333', paddingTop: '5px' }}>
          <div style={{ color: '#ff9800', fontWeight: 'bold', marginBottom: '5px' }}>CONTROLS:</div>
          <button 
            onClick={() => analyzeVideoState()}
            style={{ 
              backgroundColor: '#333', 
              color: '#00ff00', 
              border: '1px solid #555',
              padding: '2px 5px',
              marginRight: '5px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Analyze Video
          </button>
          <button 
            onClick={() => console.table(debugState)}
            style={{ 
              backgroundColor: '#333', 
              color: '#00ff00', 
              border: '1px solid #555',
              padding: '2px 5px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Log State
          </button>
        </div>
      </div>
    )
  }
  const renderVideoContent = () => {
    // Debug logging
    if (import.meta.env.DEV) {
      console.log('Video render state:', {
        videoUrl,
        showVideo,
        videoError,
        videoLoading,
        itemUrl: item?.url,
        isVideoContent
      })
    }

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
    <>
      <div className={overlayClasses} onClick={onClose}>
        <div className={containerClasses} onClick={(e) => e.stopPropagation()}>
          {renderContent()}
        </div>
      </div>
      {renderDebugPanel()}
    </>
  )
}