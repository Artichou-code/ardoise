/**
 * /qr — Redirect tracker pour le QR code de partage de l'application.
 * Le QR code dans ShareAppModal pointe vers ardoise.art-crea.fr/qr
 * Cette function logue le scan dans D1 puis redirige vers l'accueil.
 */
export async function onRequest(context) {
  const { request, env } = context

  // Log silencieux dans D1 (fail silently si DB indispo)
  if (env.DB) {
    try {
      const ua = request.headers.get('User-Agent') || null
      await env.DB.prepare(
        `INSERT INTO scan_events (event_type, session_code, user_agent) VALUES (?, NULL, ?)`
      )
        .bind('qr_share_scan', ua)
        .run()
    } catch {
      // fail silently — on ne bloque pas la redirection
    }
  }

  // Redirection 302 vers l'accueil
  return Response.redirect('https://ardoise.art-crea.fr/', 302)
}
