import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@app/router/AppRouter'

type Theme = 'light' | 'dark'
const THEME_STORAGE_KEY = 'beta-admin-web-theme'

function App() {
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    const initialTheme: Theme = storedTheme === 'light' ? 'light' : 'dark'
    localStorage.setItem(THEME_STORAGE_KEY, initialTheme)
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [])

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}

export default App
