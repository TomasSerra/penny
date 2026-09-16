// iOS Safari has no Vibration API, but since iOS 18 toggling a
// `<input type="checkbox" switch>` plays a system haptic tick. It only fires
// inside a user gesture (e.g. a click handler).
export function haptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10)
    return
  }
  if (typeof document === 'undefined') return

  const label = document.createElement('label')
  label.ariaHidden = 'true'
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.head.appendChild(label)
  label.click()
  label.remove()
}
