export async function onRequest(context) {
  const { request, env, params } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extraire la clé de synchronisation
    const keyParam = Array.isArray(params.key) ? params.key.join('/') : (params.key || '');
    const syncKey = keyParam.trim().toUpperCase();

    if (!syncKey) {
      return Response.json({ error: 'Clé de carnet requise' }, { status: 400, headers: corsHeaders });
    }

    if (!env.DB) {
      return Response.json({ error: 'Base de données non configurée' }, { status: 500, headers: corsHeaders });
    }

    // 1. GET - Récupérer le carnet distant
    if (request.method === 'GET') {
      const row = await env.DB.prepare(
        'SELECT sync_key, payload_json, version, updated_at FROM sync_notebooks WHERE sync_key = ?'
      )
        .bind(syncKey)
        .first();

      if (!row) {
        return Response.json(
          { found: false, message: 'Aucun carnet trouvé pour cette clé' },
          { status: 404, headers: corsHeaders }
        );
      }

      return Response.json(
        {
          found: true,
          syncKey: row.sync_key,
          payload: JSON.parse(row.payload_json),
          version: row.version,
          updatedAt: row.updated_at,
        },
        { headers: corsHeaders }
      );
    }

    // 2. POST - Sauvegarder ou mettre à jour le carnet distant
    if (request.method === 'POST') {
      const body = await request.json();
      if (!body || !body.payload) {
        return Response.json({ error: 'Payload de carnet requis' }, { status: 400, headers: corsHeaders });
      }

      const payloadJson = typeof body.payload === 'string' ? body.payload : JSON.stringify(body.payload);

      await env.DB.prepare(
        `INSERT INTO sync_notebooks (sync_key, payload_json, version, updated_at)
         VALUES (?, ?, 1, CURRENT_TIMESTAMP)
         ON CONFLICT(sync_key) DO UPDATE SET
           payload_json = excluded.payload_json,
           version = sync_notebooks.version + 1,
           updated_at = CURRENT_TIMESTAMP`
      )
        .bind(syncKey, payloadJson)
        .run();

      const updated = await env.DB.prepare(
        'SELECT version, updated_at FROM sync_notebooks WHERE sync_key = ?'
      )
        .bind(syncKey)
        .first();

      return Response.json(
        {
          success: true,
          syncKey,
          version: updated?.version || 1,
          updatedAt: updated?.updated_at,
        },
        { headers: corsHeaders }
      );
    }

    return Response.json({ error: 'Méthode non supportée' }, { status: 405, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
