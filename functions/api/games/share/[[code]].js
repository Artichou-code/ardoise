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

    // 1. POST : Créer ou mettre à jour un partage de partie(s)
    if (request.method === 'POST') {
      const body = await request.json();
      const isBatch = Array.isArray(body?.games) && body.games.length > 0;
      const singleGame = body?.game;

      if (!isBatch && (!singleGame || !singleGame.id)) {
        return Response.json({ error: 'Données de match invalides' }, { status: 400, headers: corsHeaders });
      }

      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let randCode = '';
      for (let i = 0; i < 6; i++) {
        randCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const gameCode = `ARD-${randCode.slice(0, 4)}`;

      let recordId;
      let payloadObj;

      if (isBatch) {
        const validGames = body.games.filter(g => g && g.id);
        if (validGames.length === 0) {
          return Response.json({ error: 'Aucune partie valide à partager' }, { status: 400, headers: corsHeaders });
        }
        recordId = validGames.length === 1 ? validGames[0].id : `batch_${Date.now()}_${randCode}`;
        payloadObj = {
          type: 'batch',
          games: validGames,
          players: Array.isArray(body.players) ? body.players : [],
          sharedAt: new Date().toISOString(),
        };
      } else {
        recordId = singleGame.id;
        payloadObj = {
          type: 'batch',
          games: [singleGame],
          players: Array.isArray(singleGame.players) ? singleGame.players : [],
          sharedAt: new Date().toISOString(),
        };
      }

      const payloadJson = JSON.stringify(payloadObj);

      await env.DB.prepare(
        `INSERT INTO shared_games (game_id, game_code, payload_json, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(game_id) DO UPDATE SET
           game_code = excluded.game_code,
           payload_json = excluded.payload_json`
      )
        .bind(recordId, gameCode, payloadJson)
        .run();

      const row = await env.DB.prepare(
        'SELECT game_code FROM shared_games WHERE game_id = ?'
      )
        .bind(recordId)
        .first();

      const finalCode = row?.game_code || gameCode;

      return Response.json(
        {
          success: true,
          gameId: recordId,
          gameCode: finalCode,
          count: payloadObj.games.length,
        },
        { headers: corsHeaders }
      );
    }

    // 2. GET : Récupérer une ou plusieurs parties partagées par code ou ID
    if (request.method === 'GET') {
      if (!codeOrId) {
        return Response.json({ error: 'Identifiant de match requis' }, { status: 400, headers: corsHeaders });
      }

      const cleanUpper = codeOrId.toUpperCase();
      const withPrefix = cleanUpper.startsWith('ARD-') ? cleanUpper : `ARD-${cleanUpper}`;

      const row = await env.DB.prepare(
        `SELECT payload_json, created_at FROM shared_games
         WHERE game_id = ? OR game_code = ? OR game_code = ?`
      )
        .bind(codeOrId, cleanUpper, withPrefix)
        .first();

      if (!row) {
        return Response.json({ error: 'Partage introuvable ou expiré' }, { status: 404, headers: corsHeaders });
      }

      const parsed = JSON.parse(row.payload_json);
      const gamesList = Array.isArray(parsed.games)
        ? parsed.games
        : parsed && parsed.id
        ? [parsed]
        : [];
      const playersList = Array.isArray(parsed.players)
        ? parsed.players
        : gamesList.flatMap(g => g.players || []);

      return Response.json(
        {
          success: true,
          games: gamesList,
          game: gamesList[0] || null,
          players: playersList,
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
