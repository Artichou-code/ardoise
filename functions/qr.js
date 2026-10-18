/**
 * /qr — Redirect tracker pour le QR code de partage de l'application.
 * Le QR code dans ShareAppModal pointe vers ardoise.art-crea.fr/qr
 * Cette function logue le scan dans D1 avec géolocalisation et device, puis redirige vers l'accueil.
 */
export async function onRequest(context) {
  const { request, env } = context

  // Log silencieux dans D1 (fail silently si DB indispo)
  if (env.DB) {
    try {
      const ua = request.headers.get('User-Agent') || ''
      const cf = request.cf || {}
      const country = cf.country || null
      const city = cf.city || null

      let device_os = 'Autre'
      if (/iphone|ipad|ipod/i.test(ua)) device_os = 'iOS'
      else if (/android/i.test(ua)) device_os = 'Android'
      else if (/macintosh|mac os x/i.test(ua)) device_os = 'macOS'
      else if (/windows/i.test(ua)) device_os = 'Windows'
      else if (/linux/i.test(ua)) device_os = 'Linux'

      await env.DB.prepare(
        `INSERT INTO scan_events (event_type, session_code, user_agent, country, city, device_os, is_pwa) 
         VALUES (?, NULL, ?, ?, ?, ?, 0)`
      )
        .bind('qr_share_scan', ua.slice(0, 300), country, city, device_os)
        .run()

      // Synchronisation asynchrone des statistiques vers LINK (si disponible)
      if (context.waitUntil) {
        context.waitUntil(
          fetch('https://link.art-crea.fr/go/Wamz?source=ardoise_qr', {
            headers: {
              'User-Agent': ua,
              'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
            },
          }).catch(() => {})
        )
      }
    } catch {
      // fail silently — on ne bloque pas la redirection
    }
  }

  // Redirection 302 vers l'accueil
  return Response.redirect('https://ardoise.art-crea.fr/', 302)
}
