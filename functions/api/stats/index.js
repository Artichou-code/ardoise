export async function onRequest(context) {
  const { env } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (!env.DB) {
    return Response.json({ error: 'DB non configurée' }, { status: 500, headers: corsHeaders })
  }

  try {
    // Totaux globaux scan_events
    const totals = await env.DB.prepare(
      `SELECT event_type, COUNT(*) as count FROM scan_events GROUP BY event_type`
    ).all()

    // Total sessions créées
    const sessionsTotal = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM live_sessions`
    ).first()

    // Total sessions closes
    const sessionsClosed = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM live_sessions WHERE closed = 1`
    ).first()

    // Total joueurs ayant rejoint (participants cumulés)
    const participantsRaw = await env.DB.prepare(
      `SELECT json_array_length(json_extract(state_json,'$.participants')) as nb FROM live_sessions`
    ).all()
    const totalParticipants = participantsRaw.results.reduce((acc, r) => acc + (r.nb || 0), 0)

    // Total parties partagées
    const sharedTotal = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM shared_games`
    ).first()

    // Historique 30j par event_type
    const history = await env.DB.prepare(
      `SELECT date(created_at) as day, event_type, COUNT(*) as count
       FROM scan_events
       WHERE created_at >= date('now', '-30 days')
       GROUP BY day, event_type
       ORDER BY day DESC`
    ).all()

    // Sessions par jour sur 30j
    const sessionsHistory = await env.DB.prepare(
      `SELECT date(created_at) as day, COUNT(*) as count
       FROM live_sessions
       WHERE created_at >= date('now', '-30 days')
       GROUP BY day
       ORDER BY day DESC`
    ).all()

    const totalsMap = {}
    for (const row of totals.results) {
      totalsMap[row.event_type] = row.count
    }

    return Response.json(
      {
        totals: totalsMap,
        sessions: {
          total: sessionsTotal?.count || 0,
          closed: sessionsClosed?.count || 0,
          totalParticipants,
        },
        sharedGames: sharedTotal?.count || 0,
        history: history.results,
        sessionsHistory: sessionsHistory.results,
      },
      { headers: corsHeaders }
    )
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders })
  }
}
