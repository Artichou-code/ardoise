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

    const ua = request.headers.get('User-Agent') || null

    await env.DB.prepare(
      `INSERT INTO scan_events (event_type, session_code, user_agent) VALUES (?, ?, ?)`
    )
      .bind(event_type, session_code || null, ua)
      .run()

    return Response.json({ ok: true }, { headers: corsHeaders })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders })
  }
}
