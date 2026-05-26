// Копирование текста в буфер обмена с fallback для http-сайтов.
// navigator.clipboard работает только в HTTPS и на localhost; на http нужен старый execCommand.
export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // упало — пробуем fallback
    }
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  ta.setAttribute('readonly', '')
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    return true
  } catch {
    return false
  } finally {
    document.body.removeChild(ta)
  }
}
