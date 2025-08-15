import './App.css'

export default function Spotlight({ items }) {
  if (!items) return null
  if (items.length === 0) return <p>No Spotlight results.</p>
  return (
    <div className="spotlight-grid">
      {items.map((item, idx) => (
        <div key={idx} className="spotlight-item">
          {item.thumbnail && <img src={item.thumbnail} alt={item.user || `spotlight-${idx}`} />}
          <p className="spotlight-user">{item.user}</p>
          {item.description && <p className="spotlight-desc">{item.description}</p>}
        </div>
      ))}
    </div>
  )
}
