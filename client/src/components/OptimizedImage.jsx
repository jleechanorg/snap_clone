import { useState, useCallback } from 'react'

export default function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  loading = 'lazy', 
  sizes = '(max-width: 768px) 100vw, 50vw',
  fallbackSrc = null,
  onLoad = null,
  onError = null,
  ...props 
}) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Generate WebP and AVIF versions if the image is from Snapchat's CDN
  const generateOptimizedSources = (originalSrc) => {
    if (!originalSrc) return []
    
    // Check if it's a Snapchat CDN URL that can be optimized
    if (originalSrc.includes('snapchat.com') || originalSrc.includes('snap.com')) {
      const sources = []
      
      // Try WebP format first
      const webpUrl = originalSrc.replace(/\.(jpg|jpeg|png)($|\?)/, '.webp$2')
      if (webpUrl !== originalSrc) {
        sources.push({
          srcSet: webpUrl,
          type: 'image/webp'
        })
      }
      
      return sources
    }
    
    return []
  }

  const handleLoad = useCallback((e) => {
    setImageLoaded(true)
    if (onLoad) onLoad(e)
  }, [onLoad])

  const handleError = useCallback((e) => {
    setImageError(true)
    if (onError) onError(e)
  }, [onError])

  const sources = generateOptimizedSources(src)
  const finalSrc = imageError && fallbackSrc ? fallbackSrc : src

  return (
    <picture>
      {sources.map((source, index) => (
        <source 
          key={index}
          srcSet={source.srcSet}
          type={source.type}
          sizes={sizes}
        />
      ))}
      <img
        src={finalSrc}
        alt={alt}
        className={`${className} ${!imageLoaded ? 'loading' : ''}`}
        loading={loading}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        sizes={sizes}
        {...props}
      />
    </picture>
  )
}