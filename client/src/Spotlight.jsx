import './App.css'

export default function Spotlight({ items }) {
  if (!items) return null
  if (items.length === 0) return <p>No Spotlight results.</p>
  
  const handleItemClick = (item) => {
    if (item.url) {
      // Navigate directly like real Snapchat
      window.location.href = item.url
    }
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
    </div>
  )
}
