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
    const rawParam = Array.isArray(params.code) ? params.code.join('/') : (params.code || '');
    const cleanParam = rawParam.trim();
    const isCreate = cleanParam === 'create' || cleanParam === '';

    if (!env.DB) {
      return Response.json({ error: 'Base de données non configurée' }, { status: 500, headers: corsHeaders });
    }

    // 1. Créer une nouvelle session journée
    if (request.method === 'POST' && isCreate) {
      const body = await request.json();
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let rand = '';
      for (let i = 0; i < 4; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const sessionCode = `ARD-${rand}`;

      const initialState = JSON.stringify(body.state || {
        name: body.name || 'Session Ardoise',
        createdAt: new Date().toISOString(),
        host: body.host || 'Hôte',
        participants: body.participants || [],
        games: [],
      });

      await env.DB.prepare(
        `INSERT INTO live_sessions (session_code, host_name, state_json, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
        .bind(sessionCode, body.host || 'Hôte', initialState)
        .run();

      return Response.json({ success: true, sessionCode }, { headers: corsHeaders });
    }

    // Extraction du code de session pour GET et UPDATE
    const sessionCode = cleanParam.replace(/\/update$/, '').toUpperCase();

    if (!sessionCode) {
      return Response.json({ error: 'Code de session manquant' }, { status: 400, headers: corsHeaders });
    }

    // 2. GET : Récupérer l'état de la session
    if (request.method === 'GET') {
      const row = await env.DB.prepare(
        'SELECT session_code, host_name, state_json, closed, updated_at FROM live_sessions WHERE session_code = ?'
      )
        .bind(sessionCode)
        .first();

      if (!row) {
        return Response.json({ error: 'Session introuvable' }, { status: 404, headers: corsHeaders });
      }

      const parsedState = JSON.parse(row.state_json || '{}');
      const isClosed = Boolean(row.closed || parsedState.closed);
      parsedState.closed = isClosed;

      return Response.json(
        {
          success: true,
          sessionCode: row.session_code,
          hostName: row.host_name,
          closed: isClosed,
          state: parsedState,
          updatedAt: row.updated_at,
        },
        { headers: corsHeaders }
      );
    }

    // 3. POST : Mettre à jour ou clôturer la session
    if (request.method === 'POST') {
      const body = await request.json();

      if (body.action === 'close') {
        const existing = await env.DB.prepare(
          'SELECT state_json FROM live_sessions WHERE session_code = ?'
        )
          .bind(sessionCode)
          .first();

        let currentState = {};
        if (existing && existing.state_json) {
          try {
            currentState = JSON.parse(existing.state_json);
          } catch {}
        }
        if (body.state && typeof body.state === 'object') {
          currentState = { ...currentState, ...body.state };
        }
        currentState.closed = true;
        currentState.closedAt = new Date().toISOString();

        await env.DB.prepare(
          `UPDATE live_sessions
           SET closed = 1, state_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE session_code = ?`
        )
          .bind(JSON.stringify(currentState), sessionCode)
          .run();

        return Response.json({ success: true, sessionCode, closed: true, state: currentState }, { headers: corsHeaders });
      }

      const stateObj = typeof body.state === 'string' ? JSON.parse(body.state) : (body.state || {});
      const isClosed = Boolean(stateObj.closed);
      const stateJson = JSON.stringify(stateObj);

      await env.DB.prepare(
        `UPDATE live_sessions
         SET state_json = ?, closed = CASE WHEN ? THEN 1 ELSE closed END, updated_at = CURRENT_TIMESTAMP
         WHERE session_code = ?`
      )
        .bind(stateJson, isClosed ? 1 : 0, sessionCode)
        .run();

      return Response.json({ success: true, sessionCode, closed: isClosed }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Méthode non autorisée' }, { status: 405, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
