import './App.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-columns">
        <div>
          <h4>Company</h4>
          <ul>
            <li>Snap Inc.</li>
            <li>Careers</li>
            <li>News</li>
          </ul>
        </div>
        <div>
          <h4>Community</h4>
          <ul>
            <li>Support</li>
            <li>Community Guidelines</li>
            <li>Safety Center</li>
          </ul>
        </div>
        <div>
          <h4>Advertising</h4>
          <ul>
            <li>Buy Ads</li>
            <li>Advertising Policies</li>
            <li>Political Ads Library</li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li>Privacy Center</li>
            <li>Your Privacy Choices</li>
            <li>Cookie Policy</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <select defaultValue="en-US">
          <option value="en-US">English (US)</option>
        </select>
        <span className="legal-links">
          <a href="https://snap.com/en-US/privacy">Privacy Policy</a>
          <a href="https://snap.com/en-US/terms">Terms of Service</a>
        </span>
      </div>
    </footer>
  )
}
