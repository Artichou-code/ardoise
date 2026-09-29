export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Méthode non autorisée' }, { status: 405, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const game = body?.game;
    if (!game || !game.id) {
      return Response.json({ error: 'Données de match invalides' }, { status: 400, headers: corsHeaders });
    }

    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const payloadJson = JSON.stringify(game);

    await env.DB.prepare(
      `INSERT INTO shared_games (game_id, game_code, payload_json, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(game_id) DO UPDATE SET
         payload_json = excluded.payload_json`
    )
      .bind(game.id, gameCode, payloadJson)
      .run();

    return Response.json({ success: true, gameId: game.id, gameCode }, { headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
