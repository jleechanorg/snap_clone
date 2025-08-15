import { useEffect, useState } from 'react'
import './App.css'
import Profile from './Profile'
import Header from './Header'
import Footer from './Footer'
import Tabs from './Tabs'

function App() {
  const params = new URLSearchParams(window.location.search)
  const username = params.get('username')

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!username) return
    setLoading(true)
    fetch(`/snap/@${username}?locale=en-US`)
      .then((res) => res.text())
      .then((html) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const title = doc.querySelector('meta[property="og:title"]')?.content
        const description = doc.querySelector('meta[property="og:description"]')?.content
        const image = doc.querySelector('meta[property="og:image"]')?.content
        const nextData = doc.getElementById('__NEXT_DATA__')?.textContent
        let subscriberCount
        if (nextData) {
          try {
            const json = JSON.parse(nextData)
            subscriberCount = json?.props?.pageProps?.publicProfile?.subscriberCount
          } catch (e) {
            // ignore JSON parse errors
          }
        }
        setData({ title, description, image, subscriberCount })
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [username])

  if (!username) {
    return <p>Provide a username query parameter, e.g. ?username=moonlightbae</p>
  }

  if (loading) return <p>Loading…</p>
  if (error) return <p>Error loading profile.</p>

  return (
    <div className="app">
      <Header />
      <Profile data={data} />
      <Tabs username={username} />
      <Footer />
    </div>
  )
}

export default App
