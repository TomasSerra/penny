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

// Desktop scrollbars stay hidden until their element scrolls (see index.css).
if (window.matchMedia('(pointer: fine)').matches) {
  const timers = new WeakMap<Element, number>()
  document.addEventListener(
    'scroll',
    (event) => {
      // The page scrollbar takes its style from <body> in Chrome/Safari and from <html> in Firefox.
      const targets = event.target instanceof Element ? [event.target] : [document.documentElement, document.body]
      for (const target of targets) {
        target.setAttribute('data-scrolling', '')
        window.clearTimeout(timers.get(target))
        timers.set(target, window.setTimeout(() => target.removeAttribute('data-scrolling'), 800))
      }
    },
    { capture: true, passive: true },
  )
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
