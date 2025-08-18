# Snapchat Spotlight Investigation Notes

## Current Implementation Issues
- Using `window.location.href` for full page navigation
- This is likely incorrect based on modern web patterns

## Likely Real Snapchat Behavior
Based on common video platform patterns, Snapchat probably uses:

1. **Modal/Overlay System**:
   - Video opens in a modal overlay
   - Original profile page remains in background
   - URL might update with hash fragment (e.g., #video/123) but no full navigation
   - ESC key or clicking outside closes modal

2. **Possible URL Patterns**:
   - Hash-based routing: `/@djkhaled305#spotlight/video123`
   - Query parameters: `/@djkhaled305?video=123`
   - History API pushState for clean URLs

3. **Technical Implementation**:
   - React/Next.js modal components
   - CSS fixed positioning with z-index
   - Body scroll lock when modal is open
   - Focus management for accessibility

## Manual Testing Steps Needed
1. Open DevTools Network tab
2. Click Spotlight video
3. Check if URL changes (full navigation vs hash/query)
4. Look for modal CSS classes in DOM
5. Test ESC key behavior
6. Check if page content is still behind modal

## Recommended Implementation
- Replace `window.location.href` with modal system
- Use React state for modal visibility
- Implement proper video player component
- Add keyboard navigation (ESC to close)
- Update URL with history API for deep linking