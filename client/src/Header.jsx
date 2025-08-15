import './App.css'

export default function Header() {
  return (
    <header className="header">
      <h2>Log in to Snapchat</h2>
      <p className="tagline">Chat, Snap, and video call your friends. Watch Stories and Spotlight, all from your computer.</p>
      <label className="login-field">
        <span>Username or email address</span>
        <input type="text" placeholder="Username or email address" />
      </label>
      <p className="download">Looking for the app? <a href="https://snapchat.com/download">Get it here.</a></p>
    </header>
  )
}
