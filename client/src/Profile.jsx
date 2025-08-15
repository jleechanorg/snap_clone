import './App.css'

export default function Profile({ data }) {
  if (!data) return null
  const { title, description, image, subscriberCount } = data
  return (
    <div className="profile">
      {image && <img className="avatar" src={image} alt={title} />}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {subscriberCount && <p className="subs">{subscriberCount.toLocaleString()} subscribers</p>}
    </div>
  )
}
