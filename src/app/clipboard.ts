/* `navigator.clipboard` needs a secure page and a browser that grants it; an
   older iOS or an embedded browser may not. The fallback selects a hidden
   field and asks the page to copy it, which still works almost everywhere. */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard !== undefined) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* Refused: fall through to the older route. */
  }
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  field.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
  }
}
