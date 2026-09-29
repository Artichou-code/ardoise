export async function onRequest(context) {
  const { request, env, params } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawParam = Array.isArray(params.code) ? params.code.join('/') : (params.code || '');
    const codeOrId = rawParam.trim();

    if (!env.DB) {
      return Response.json({ error: 'Base de données non configurée' }, { status: 500, headers: corsHeaders });
    }

    // 1. POST : Créer ou mettre à jour un partage de partie
    if (request.method === 'POST') {
      const body = await request.json();
      const game = body?.game;
      if (!game || !game.id) {
        return Response.json({ error: 'Données de match invalides' }, { status: 400, headers: corsHeaders });
      }

      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let gameCode = '';
      for (let i = 0; i < 6; i++) {
        gameCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

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
    }

    // 2. GET : Récupérer une partie partagée par son code ou son ID
    if (request.method === 'GET') {
      if (!codeOrId) {
        return Response.json({ error: 'Identifiant de match requis' }, { status: 400, headers: corsHeaders });
      }

      const row = await env.DB.prepare(
        `SELECT payload_json, created_at FROM shared_games
         WHERE game_id = ? OR game_code = ?`
      )
        .bind(codeOrId, codeOrId.toUpperCase())
        .first();

      if (!row) {
        return Response.json({ error: 'Partie non trouvée' }, { status: 404, headers: corsHeaders });
      }

      return Response.json(
        {
          success: true,
          game: JSON.parse(row.payload_json),
          createdAt: row.created_at,
        },
        { headers: corsHeaders }
      );
    }

    return Response.json({ error: 'Méthode non autorisée' }, { status: 405, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
