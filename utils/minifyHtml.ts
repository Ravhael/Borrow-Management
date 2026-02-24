// Lightweight HTML minifier tailored for our email templates.
// Goal: remove comments, collapse whitespace and minify inline styles without changing layout.

export function minifyHtmlForEmail(html: string) {
  if (typeof html !== 'string' || !html.trim()) return html

  let out = String(html)

  // 1) strip HTML comments (but not conditional IE comments) — keep conditional comments (<!-- [if ...]>)
  out = out.replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, '')

  // 2) minify inline style attributes carefully
  out = out.replace(/style=\"([^\"]*)\"/g, (_m, css) => {
    // Trim and collapse whitespace
    let s = css.trim().replace(/\s*:\s*/g, ':').replace(/\s*;\s*/g, ';')
    // remove trailing semicolon
    s = s.replace(/;$/, '')
    // collapse multiple spaces inside values
    s = s.replace(/\s{2,}/g, ' ')
    return `style=\"${s}\"`
  })

  // 3) remove newlines and tabs, collapse to single space
  out = out.replace(/[\r\n\t]+/g, ' ')

  // 4) remove redundant whitespace between tags
  out = out.replace(/>\s+</g, '><')

  // 5) collapse consecutive spaces
  out = out.replace(/\s{2,}/g, ' ')

  // 6) trim leading/trailing
  return out.trim()
}

export default minifyHtmlForEmail
