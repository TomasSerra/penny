import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { isFirebaseConfigured } from './lib/firebaseConfig'

// Android ignores -webkit-touch-callout: block the long-press menu on links and images (see index.css).
if (window.matchMedia('(pointer: coarse)').matches) {
  document.addEventListener('contextmenu', (event) => {
    const target = event.target
    if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')) return
    event.preventDefault()
  })
}

const root = createRoot(document.getElementById('root')!)

// Firebase throws on init without a config, so show setup instructions instead of a blank page.
if (isFirebaseConfigured) {
  void import('./app/App').then(({ default: App }) =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
} else {
  void import('./app/SetupScreen').then(({ SetupScreen }) => root.render(<SetupScreen />))
}
