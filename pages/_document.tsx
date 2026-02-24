import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="id">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        {/*
          Defensive guard for Next dev client HMR race-condition
          ----------------------------------------------------
          In some dev-server race conditions the Next dev-client will try to
          read `window.next.router.pathname` before the router has been
          initialized which can throw `Cannot read properties of undefined`.

          Add a small safe default here so the dev-client can read a
          pathname without blowing up during refresh / HMR messages.
        */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var fallbackPath = window.location?.pathname || '/'
            if (!window.next) window.next = {}
            if (!window.next.router) {
              window.next.router = {
                pathname: fallbackPath,
                components: {},
                reload: function () {
                  try { window.location.reload() } catch (err) {}
                }
              }
            } else {
              if (typeof window.next.router.pathname === 'undefined') {
                window.next.router.pathname = fallbackPath
              }
              if (typeof window.next.router.components === 'undefined') {
                window.next.router.components = {}
              }
            }
          } catch (e) { /* defensive: nothing to do if this fails */ }
        ` }} />
        <NextScript />
      </body>
    </Html>
  )
}
