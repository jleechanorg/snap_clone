import { useEffect, useState, useRef, useCallback } from 'react'
import './App.css'
import { createUrlSlug, navigateToProfile, openSnapchatContent } from './utils/urlUtils'

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
  const debugLog = useCallback((category, action, data = {}) => {
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
  }, [item?.url])

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
  
  // Enhanced video URL extraction with sophisticated methods
  const getVideoUrl = async (snapchatUrl) => {
    debugLog('EXTRACTION', 'Starting enhanced URL extraction', { snapchatUrl })
    
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
        
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
          }
        })
        
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

        // ===================================================================
        // METHOD 1: Enhanced __NEXT_DATA__ Deep Analysis
        // ===================================================================
        const nextDataScript = doc.querySelector('#__NEXT_DATA__')
        extractionResults.nextDataFound = !!nextDataScript
        
        if (nextDataScript) {
          debugLog('EXTRACTION', 'Enhanced __NEXT_DATA__ analysis starting', { 
            length: nextDataScript.textContent.length 
          })
          
          try {
            const nextData = JSON.parse(nextDataScript.textContent)
            
            // Deep recursive search with enhanced property detection
            const deepVideoSearch = (obj, path = '', depth = 0) => {
              if (!obj || typeof obj !== 'object' || depth > 10) return []
              
              const foundUrls = []
              
              // Enhanced video property patterns
              const videoProps = [
                'videoUrl', 'contentUrl', 'url', 'src', 'href',
                'mediaUrl', 'playbackUrl', 'streamUrl', 'hlsUrl', 'dashUrl',
                'videoPlaybackUrl', 'directUrl', 'cdnUrl', 'assetUrl',
                'mp4Url', 'webmUrl', 'videoSrc', 'videoHref', 'playUrl',
                'media_url', 'video_url', 'stream_url', 'playback_url'
              ]
              
              // Check for video URLs in current object
              for (const prop of videoProps) {
                const value = obj[prop]
                if (value && typeof value === 'string') {
                  // Enhanced URL validation
                  if (value.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || 
                      value.includes('cf-st.sc-cdn.net') ||
                      value.includes('snap-dev.storage.googleapis.com') ||
                      value.includes('snapchat.com/') && value.includes('media')) {
                    
                    foundUrls.push({ 
                      url: value, 
                      source: `__NEXT_DATA__.${path}.${prop}`,
                      confidence: value.includes('.mp4') ? 'high' : 'medium'
                    })
                    
                    debugLog('EXTRACTION', 'Enhanced video URL found in __NEXT_DATA__', {
                      url: value,
                      path: `${path}.${prop}`,
                      confidence: value.includes('.mp4') ? 'high' : 'medium'
                    })
                  }
                }
              }
              
              // Check for base64 encoded content
              if (typeof obj === 'string' && obj.length > 100 && obj.includes('http')) {
                try {
                  const decoded = atob(obj)
                  if (decoded.includes('.mp4') || decoded.includes('video')) {
                    debugLog('EXTRACTION', 'Base64 encoded content found', { 
                      original: obj.substring(0, 50),
                      decoded: decoded.substring(0, 100)
                    })
                  }
                } catch {
                  // Not base64, continue
                }
              }
              
              // Recursively search nested objects and arrays
              if (Array.isArray(obj)) {
                obj.forEach((item, index) => {
                  const nested = deepVideoSearch(item, `${path}[${index}]`, depth + 1)
                  foundUrls.push(...nested)
                })
              } else {
                for (const key in obj) {
                  if (Object.prototype.hasOwnProperty.call(obj, key) && 
                      !['thumbnail', 'poster', 'preview', 'icon'].includes(key.toLowerCase())) {
                    const nested = deepVideoSearch(obj[key], path ? `${path}.${key}` : key, depth + 1)
                    foundUrls.push(...nested)
                  }
                }
              }
              
              return foundUrls
            }
            
            const videoUrls = deepVideoSearch(nextData, 'nextData')
            if (videoUrls.length > 0) {
              // Sort by confidence and return highest confidence URL
              const sortedUrls = videoUrls.sort((a, b) => 
                (b.confidence === 'high' ? 1 : 0) - (a.confidence === 'high' ? 1 : 0)
              )
              
              debugLog('EXTRACTION', 'Enhanced video URLs extracted from __NEXT_DATA__', { 
                count: videoUrls.length,
                urls: sortedUrls,
                selected: sortedUrls[0]
              })
              return sortedUrls[0].url
            }
            
          } catch (e) {
            debugLog('EXTRACTION', 'Enhanced __NEXT_DATA__ parse failed', { error: e.message })
          }
        }

        // ===================================================================
        // METHOD 2: Advanced DOM Data Attribute Analysis
        // ===================================================================
        debugLog('EXTRACTION', 'Starting advanced DOM analysis')
        
        // Check all elements for video-related data attributes
        const allElements = doc.querySelectorAll('*[data-*]')
        extractionResults.dataAttributeElements = allElements.length
        
        for (const element of allElements) {
          const attributes = element.attributes
          for (const attr of attributes) {
            if (attr.name.startsWith('data-') && attr.value) {
              const attrName = attr.name.toLowerCase()
              const attrValue = attr.value
              
              // Check for video-related data attributes
              if ((attrName.includes('video') || 
                   attrName.includes('media') || 
                   attrName.includes('src') || 
                   attrName.includes('url')) &&
                  (attrValue.includes('.mp4') || 
                   attrValue.includes('cf-st.sc-cdn.net') ||
                   attrValue.includes('googleapis.com'))) {
                
                debugLog('EXTRACTION', 'Video URL found in data attribute', { 
                  attribute: attrName,
                  url: attrValue,
                  element: element.tagName
                })
                return attrValue
              }
            }
          }
        }

        // ===================================================================
        // METHOD 3: Enhanced Video Elements with All Attributes
        // ===================================================================
        const videoElements = doc.querySelectorAll('video, source')
        extractionResults.videoElementsFound = videoElements.length
        
        debugLog('EXTRACTION', 'Enhanced video elements analysis', { count: videoElements.length })
        
        for (const element of videoElements) {
          // Check all possible src attributes
          const srcAttributes = ['src', 'data-src', 'data-video-src', 'data-url', 'data-media-url']
          
          for (const attr of srcAttributes) {
            const value = element.getAttribute(attr)
            if (value && (value.includes('.mp4') || 
                         value.includes('cf-st.sc-cdn.net') ||
                         value.includes('googleapis.com'))) {
              debugLog('EXTRACTION', 'Video source found in element attribute', { 
                attribute: attr,
                src: value,
                element: element.tagName
              })
              return value
            }
          }
        }

        // ===================================================================
        // METHOD 4: CSS Background Analysis for Video Posters
        // ===================================================================
        debugLog('EXTRACTION', 'Starting CSS background analysis')
        
        const elementsWithBackground = doc.querySelectorAll('*[style*="background"]')
        for (const element of elementsWithBackground) {
          const style = element.getAttribute('style') || ''
          const backgroundMatch = style.match(/background[^:]*:\s*url\(['"]?([^'"]+)['"]?\)/)
          
          if (backgroundMatch && backgroundMatch[1]) {
            const bgUrl = backgroundMatch[1]
            // If background shows a poster, try to derive video URL
            if (bgUrl.includes('poster') || bgUrl.includes('thumb')) {
              const videoUrl = bgUrl.replace(/poster|thumb/g, 'video').replace(/\.(jpg|jpeg|png|webp)$/i, '.mp4')
              
              debugLog('EXTRACTION', 'Potential video URL derived from background poster', {
                posterUrl: bgUrl,
                derivedVideoUrl: videoUrl
              })
              
              // Validate derived URL
              try {
                const testResponse = await fetch(videoUrl.replace('https://www.snapchat.com', '/snap'), { method: 'HEAD' })
                if (testResponse.ok) {
                  return videoUrl
                }
              } catch {
                // Continue with other methods
              }
            }
          }
        }

        // ===================================================================
        // METHOD 5: Apollo Client State Analysis
        // ===================================================================
        debugLog('EXTRACTION', 'Starting Apollo Client state analysis')
        
        const apolloScripts = doc.querySelectorAll('script:not([src])')
        for (const script of apolloScripts) {
          const content = script.textContent || script.innerHTML
          
          // Look for Apollo Client cache data
          if (content.includes('__APOLLO_STATE__') || content.includes('apolloState')) {
            try {
              // Extract Apollo state data
              const apolloMatch = content.match(/"__APOLLO_STATE__":\s*({.*?})/s) ||
                                 content.match(/apolloState:\s*({.*?})/s)
              
              if (apolloMatch) {
                const apolloData = JSON.parse(apolloMatch[1])
                debugLog('EXTRACTION', 'Apollo state found', { keys: Object.keys(apolloData) })
                
                // Search Apollo cache for video data
                const apolloVideoSearch = (obj, path = '') => {
                  if (!obj || typeof obj !== 'object') return null
                  
                  for (const key in obj) {
                    const value = obj[key]
                    if (typeof value === 'string' && 
                        (value.includes('.mp4') || 
                         value.includes('cf-st.sc-cdn.net'))) {
                      debugLog('EXTRACTION', 'Video URL found in Apollo state', {
                        path: `${path}.${key}`,
                        url: value
                      })
                      return value
                    }
                    
                    if (typeof value === 'object') {
                      const nested = apolloVideoSearch(value, `${path}.${key}`)
                      if (nested) return nested
                    }
                  }
                  return null
                }
                
                const apolloVideo = apolloVideoSearch(apolloData, 'apolloState')
                if (apolloVideo) return apolloVideo
              }
            } catch (e) {
              debugLog('EXTRACTION', 'Apollo state parse failed', { error: e.message })
            }
          }
        }

        // ===================================================================
        // METHOD 6: Network Request Pattern Reconstruction
        // ===================================================================
        debugLog('EXTRACTION', 'Starting network pattern reconstruction')
        
        // Extract potential video IDs from URL and reconstruct CDN URLs
        const spotlightMatch = snapchatUrl.match(/\/spotlight\/([^/?]+)/)
        
        if (spotlightMatch) {
          const videoId = spotlightMatch[1]
          debugLog('EXTRACTION', 'Video ID extracted from URL', { videoId })
          
          // Try common Snapchat CDN patterns
          const cdnPatterns = [
            `https://cf-st.sc-cdn.net/d/${videoId}.mp4`,
            `https://cf-st.sc-cdn.net/d/${videoId}_720.mp4`,
            `https://cf-st.sc-cdn.net/d/${videoId}_1080.mp4`,
            `https://snap-dev.storage.googleapis.com/spotlight/${videoId}.mp4`,
            `https://snap-dev.storage.googleapis.com/spotlight/${videoId}/video.mp4`
          ]
          
          for (const pattern of cdnPatterns) {
            try {
              debugLog('EXTRACTION', 'Testing CDN pattern', { pattern })
              const testUrl = pattern.replace('https://cf-st.sc-cdn.net', '/snap').replace('https://snap-dev.storage.googleapis.com', '/snap')
              const testResponse = await fetch(testUrl, { method: 'HEAD' })
              
              if (testResponse.ok && testResponse.headers.get('content-type')?.includes('video')) {
                debugLog('EXTRACTION', 'CDN pattern match found', { 
                  pattern,
                  contentType: testResponse.headers.get('content-type')
                })
                return pattern
              }
            } catch {
              // Continue with next pattern
            }
          }
        }

        // ===================================================================
        // METHOD 7: Enhanced Script Analysis with Obfuscation Handling
        // ===================================================================
        const allScripts = doc.querySelectorAll('script:not([type]), script[type="text/javascript"]')
        debugLog('EXTRACTION', 'Enhanced script analysis', { count: allScripts.length })
        
        for (const script of allScripts) {
          const content = script.textContent || script.innerHTML
          
          // Multiple regex patterns for video URLs
          const videoPatterns = [
            /"(https?:\/\/[^"]*\.mp4[^"]*)"/g,
            /'(https?:\/\/[^']*\.mp4[^']*)'/g,
            /url:\s*["']([^"']*\.mp4[^"']*)['"]/g,
            /src:\s*["']([^"']*\.mp4[^"']*)['"]/g,
            /videoUrl:\s*["']([^"']*\.mp4[^"']*)['"]/g,
            /"(https?:\/\/cf-st\.sc-cdn\.net[^"]*)"/g,
            /"(https?:\/\/[^"]*googleapis\.com[^"]*\.mp4[^"]*)"/g
          ]
          
          for (const pattern of videoPatterns) {
            let match
            while ((match = pattern.exec(content)) !== null) {
              const url = match[1]
              if (!url.includes('thumb') && 
                  !url.includes('poster') && 
                  !url.includes('preview') &&
                  !url.match(/\d+x\d+/) &&
                  url.length > 20) {
                
                debugLog('EXTRACTION', 'Enhanced video URL found in script', { 
                  url,
                  pattern: pattern.source
                })
                return url
              }
            }
          }
          
          // Look for obfuscated or encoded URLs
          if (content.length > 1000) {
            // Check for hex-encoded URLs
            const hexMatches = content.match(/[0-9a-f]{32,}/g)
            if (hexMatches) {
              for (const hex of hexMatches.slice(0, 5)) { // Limit to prevent performance issues
                try {
                  // Convert hex to text in browser environment
                  let decoded = ''
                  for (let i = 0; i < hex.length; i += 2) {
                    decoded += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
                  }
                  if (decoded.includes('.mp4') || decoded.includes('video')) {
                    debugLog('EXTRACTION', 'Potential hex-encoded video data found', {
                      hex: hex.substring(0, 20),
                      decoded: decoded.substring(0, 100)
                    })
                  }
                } catch {
                  // Continue
                }
              }
            }
          }
        }

        // ===================================================================
        // METHOD 8: Manifest File Analysis
        // ===================================================================
        debugLog('EXTRACTION', 'Starting manifest file analysis')
        
        // Look for HLS or DASH manifests
        const manifestPatterns = [
          /["'](https?:\/\/[^"']*\.m3u8[^"']*)['"]/g,
          /["'](https?:\/\/[^"']*\.mpd[^"']*)['"]/g
        ]
        
        for (const script of allScripts) {
          const content = script.textContent || script.innerHTML
          
          for (const pattern of manifestPatterns) {
            let match
            while ((match = pattern.exec(content)) !== null) {
              const manifestUrl = match[1]
              debugLog('EXTRACTION', 'Manifest file found', { manifestUrl })
              
              try {
                const manifestResponse = await fetch(manifestUrl.replace('https://www.snapchat.com', '/snap'))
                if (manifestResponse.ok) {
                  const manifestContent = await manifestResponse.text()
                  
                  // Parse manifest for video segments
                  if (manifestUrl.includes('.m3u8')) {
                    const videoSegments = manifestContent.match(/https?:\/\/[^\s]+\.ts/g)
                    if (videoSegments && videoSegments.length > 0) {
                      const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/'))
                      const firstSegment = videoSegments[0]
                      const reconstructedUrl = firstSegment.startsWith('http') ? firstSegment : `${baseUrl}/${firstSegment}`
                      
                      debugLog('EXTRACTION', 'HLS video segments found', {
                        manifestUrl,
                        segmentCount: videoSegments.length,
                        firstSegment: reconstructedUrl
                      })
                      return reconstructedUrl
                    }
                  }
                }
              } catch (e) {
                debugLog('EXTRACTION', 'Manifest fetch failed', { 
                  manifestUrl,
                  error: e.message 
                })
              }
            }
          }
        }

        // Update extraction results with enhanced data
        setDebugState(prev => ({
          ...prev,
          extraction: { 
            ...prev.extraction, 
            ...extractionResults,
            enhancedMethodsUsed: 8,
            dataAttributeElements: extractionResults.dataAttributeElements || 0
          }
        }))
        
        debugLog('EXTRACTION', 'All enhanced methods exhausted', { 
          result: 'FAIL',
          summary: extractionResults,
          methodsUsed: 8
        })
        
        return null
        
      } catch (error) {
        debugLog('EXTRACTION', 'Enhanced extraction failed', { 
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
    const handleKeyDown = (event) => {
      // Prevent default behavior for media keys
      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) {
        event.preventDefault()
      }
      
      switch (event.code) {
        case 'Escape':
          onClose()
          break
        case 'Space':
          // Space bar to play/pause video
          handleVideoClick()
          break
        case 'ArrowLeft':
          // Skip backward 10 seconds
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
          }
          break
        case 'ArrowRight':
          // Skip forward 10 seconds
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(
              videoRef.current.duration || 0, 
              videoRef.current.currentTime + 10
            )
          }
          break
        case 'ArrowUp':
          // Volume up
          if (videoRef.current) {
            videoRef.current.volume = Math.min(1, videoRef.current.volume + 0.1)
          }
          break
        case 'ArrowDown':
          // Volume down
          if (videoRef.current) {
            videoRef.current.volume = Math.max(0, videoRef.current.volume - 0.1)
          }
          break
        case 'KeyM':
          // Mute/unmute
          if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted
          }
          break
        case 'KeyF':
          // Toggle fullscreen
          if (videoRef.current) {
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else {
              videoRef.current.requestFullscreen()
            }
          }
          break
        default:
          break
      }
    }

    const handlePopstate = () => {
      onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      window.addEventListener('popstate', handlePopstate)
      
      // Add URL state for bookmarking (like real Snapchat)
      const currentUrl = new URL(window.location)
      if (item?.url) {
        // Extract video ID from Snapchat URL for hash
        const videoId = item.url.split('/spotlight/')[1] || createUrlSlug(item.description)
        currentUrl.hash = `#spotlight/${videoId}`
        window.history.pushState(null, '', currentUrl)
      }
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
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
        
        {/* Enhanced Extraction Stats */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#4ecdc4', fontWeight: 'bold' }}>ENHANCED EXTRACTION:</div>
          <div>Attempts: {debugState.extraction.attempts}</div>
          <div>Snapchat URL: {debugState.extraction.snapchatUrl ? '✅' : '❌'}</div>
          <div>Proxy Response: {debugState.extraction.proxyResponse?.status || 'N/A'}</div>
          <div>HTML Length: {debugState.extraction.htmlLength || 0}</div>
          <div>Methods Used: {debugState.extraction.enhancedMethodsUsed || 'Legacy'}</div>
          <div>__NEXT_DATA__: {debugState.extraction.nextDataFound ? '✅' : '❌'}</div>
          <div>Video Elements: {debugState.extraction.videoElementsFound || 0}</div>
          <div>Data Attributes: {debugState.extraction.dataAttributeElements || 0}</div>
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
      // For profile tiles, navigate to the profile page within our app (SPA-friendly)
      const username = item.url?.match(/\/add\/([^?]+)/)?.[1]
      if (username) {
        navigateToProfile(username)
        onClose() // Close modal after navigation
        return null
      }
    }

    // For video/story content - render video modal like real Snapchat with enhanced layout
    return (
      <div className="modal-content spotlight-modal">
        {/* Sticky Header */}
        <header className="modal-header-sticky">
          <div className="modal-user-info">
            <div className="user-avatar">
              <img src={item.avatar || '/default-avatar.png'} alt={item.user} />
            </div>
            <div className="user-details">
              <h3>{item.user}</h3>
              {item.views && <span className="view-count">👁 {item.views}</span>}
            </div>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">✕</button>
        </header>
        
        {/* Main Content Area */}
        <main className="modal-content-area">
          <div className="video-main">
            {item.thumbnail && renderVideoContent()}
          </div>
          
          {/* Content Sidebar for Desktop */}
          <aside className="content-sidebar">
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
          </aside>
        </main>
        
        {/* Bottom Action Bar */}
        <footer className="modal-actions-bar">
          <div className="stats-display">
            {item.views && <span>👁 {item.views}</span>}
            {item.comments && <span>💬 {item.comments}</span>}
            {item.shares && <span>🔄 {item.shares}</span>}
          </div>
          
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => openSnapchatContent(item.url)}
              disabled={!item.url}
            >
              {item.isStory ? 'View on Snapchat' : 'Watch on Snapchat'}
            </button>
            <button className="action-btn secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </footer>
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