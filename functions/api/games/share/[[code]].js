export async function onRequest(context) {
  const { request, env, params } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return Response.json({ error: 'Méthode non autorisée' }, { status: 405, headers: corsHeaders });
  }

  try {
    const rawParam = Array.isArray(params.code) ? params.code.join('/') : (params.code || '');
    const codeOrId = rawParam.trim();

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
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
