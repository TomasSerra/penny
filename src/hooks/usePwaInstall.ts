import { useEffect, useState } from 'react'
import { useMediaQuery } from './useMediaQuery'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const displayStandalone = useMediaQuery('(display-mode: standalone)')
  const standalone = displayStandalone || (navigator as Navigator & { standalone?: boolean }).standalone === true
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function install() {
    if (!promptEvent) return
    await promptEvent.prompt()
    setPromptEvent(null)
  }

  return { standalone, isIOS, canInstall: Boolean(promptEvent), install }
}
