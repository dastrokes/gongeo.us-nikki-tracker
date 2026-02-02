export const themeInitScript = `(function () {
  try {
    var d = document.documentElement
    var m = document.cookie.match(/(?:^|; )theme=([^;]+)/)
    var theme = m ? decodeURIComponent(m[1]) : ''
    if (theme !== 'dark' && theme !== 'light') {
      var prefersDark = false
      if (window.matchMedia) {
        prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      theme = prefersDark ? 'dark' : 'light'
      var secure = location.protocol === 'https:' ? '; Secure' : ''
      document.cookie =
        'theme=' +
        theme +
        '; Path=/; Max-Age=31536000; SameSite=Lax' +
        secure
    }
    var isDark = theme === 'dark'
    d.classList.remove('dark', 'light')
    d.classList.add(isDark ? 'dark' : 'light')
    d.style.colorScheme = isDark ? 'dark' : 'light'
  } catch (e) {}
})()`
