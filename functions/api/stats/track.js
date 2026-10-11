export async function onRequest(context) {
  const { request, env } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Méthode non autorisée' }, { status: 405, headers: corsHeaders })
  }

  if (!env.DB) {
    return Response.json({ error: 'DB non configurée' }, { status: 500, headers: corsHeaders })
  }

  try {
    const body = await request.json()
    const { event_type, session_code } = body

    if (!event_type) {
      return Response.json({ error: 'event_type requis' }, { status: 400, headers: corsHeaders })
    }

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

    const is_pwa = body.is_pwa ? 1 : 0

    await env.DB.prepare(
      `INSERT INTO scan_events (event_type, session_code, user_agent, country, city, device_os, is_pwa) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(event_type, session_code || null, ua.slice(0, 300), country, city, device_os, is_pwa)
      .run()

    return Response.json({ ok: true }, { headers: corsHeaders })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders })
  }
}
