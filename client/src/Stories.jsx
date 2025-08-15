import './App.css'

export default function Stories({ items }) {
  if (!items) return null
  if (items.length === 0) return <p>No Stories found.</p>
  return (
    <div className="stories-grid">
      {items.map((item, idx) => (
        <div key={idx} className="story-item">
          {item.thumbnail && <img src={item.thumbnail} alt={item.title || `story-${idx}`} />}
          <p className="story-title">{item.title}</p>
          {item.description && <p className="story-desc">{item.description}</p>}
        </div>
      ))}
    </div>
  )
}
