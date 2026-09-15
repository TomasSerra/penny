import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { isFirebaseConfigured } from './lib/firebaseConfig'

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
