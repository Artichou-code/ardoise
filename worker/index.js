export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Health check
      if (url.pathname === '/' || url.pathname === '/api/health') {
        return Response.json({ status: 'ok', service: 'ardoise-sync-api' }, { headers: corsHeaders });
      }

      // 2. GET /api/sync/:key - Récupération du carnet complet
      if (request.method === 'GET' && url.pathname.startsWith('/api/sync/')) {
        const key = url.pathname.replace('/api/sync/', '').trim().toUpperCase();
        if (!key) {
          return Response.json({ error: 'Clé de carnet requise' }, { status: 400, headers: corsHeaders });
        }
        const row = await env.DB.prepare('SELECT sync_key, payload_json, version, updated_at FROM sync_notebooks WHERE sync_key = ?')
          .bind(key)
          .first();

        if (!row) {
          return Response.json({ found: false, message: 'Aucun carnet trouvé pour cette clé' }, { status: 404, headers: corsHeaders });
        }

        return Response.json({
          found: true,
          syncKey: row.sync_key,
          payload: JSON.parse(row.payload_json),
          version: row.version,
          updatedAt: row.updated_at
        }, { headers: corsHeaders });
      }

      // 3. POST /api/sync/:key - Sauvegarde / Mise à jour du carnet complet
      if (request.method === 'POST' && url.pathname.startsWith('/api/sync/')) {
        const key = url.pathname.replace('/api/sync/', '').trim().toUpperCase();
        if (!key) {
          return Response.json({ error: 'Clé de carnet requise' }, { status: 400, headers: corsHeaders });
        }
        const body = await request.json();
        const payloadJson = typeof body.payload === 'string' ? body.payload : JSON.stringify(body.payload);

        await env.DB.prepare(`
          INSERT INTO sync_notebooks (sync_key, payload_json, version, updated_at)
          VALUES (?, ?, 1, CURRENT_TIMESTAMP)
          ON CONFLICT(sync_key) DO UPDATE SET
            payload_json = excluded.payload_json,
            version = sync_notebooks.version + 1,
            updated_at = CURRENT_TIMESTAMP
        `).bind(key, payloadJson).run();

        const updated = await env.DB.prepare('SELECT version, updated_at FROM sync_notebooks WHERE sync_key = ?')
          .bind(key)
          .first();

        return Response.json({
          success: true,
          syncKey: key,
          version: updated?.version || 1,
          updatedAt: updated?.updated_at
        }, { headers: corsHeaders });
      }

      // 4. POST /api/games/share - Partage d'une feuille de match unique
      if (request.method === 'POST' && url.pathname === '/api/games/share') {
        const body = await request.json();
        const game = body.game;
        if (!game || !game.id) {
          return Response.json({ error: 'Partie invalide' }, { status: 400, headers: corsHeaders });
        }
        const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const payloadJson = JSON.stringify(game);

        await env.DB.prepare(`
          INSERT INTO shared_games (game_id, game_code, payload_json, created_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(game_id) DO UPDATE SET
            payload_json = excluded.payload_json
        `).bind(game.id, gameCode, payloadJson).run();

        return Response.json({
          success: true,
          gameId: game.id,
          gameCode
        }, { headers: corsHeaders });
      }

      // 5. GET /api/games/share/:idOrCode - Récupération d'un match partagé
      if (request.method === 'GET' && url.pathname.startsWith('/api/games/share/')) {
        const idOrCode = url.pathname.replace('/api/games/share/', '').trim();
        const row = await env.DB.prepare(`
          SELECT payload_json, created_at FROM shared_games
          WHERE game_id = ? OR game_code = ?
        `).bind(idOrCode, idOrCode.toUpperCase()).first();

        if (!row) {
          return Response.json({ error: 'Partie non trouvée' }, { status: 404, headers: corsHeaders });
        }

        return Response.json({
          success: true,
          game: JSON.parse(row.payload_json),
          createdAt: row.created_at
        }, { headers: corsHeaders });
      }

      // 6. Routes Sessions de Journée (pour Étape 3)
      if (request.method === 'POST' && url.pathname === '/api/sessions/create') {
        const body = await request.json();
        const sessionCode = 'ARD-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const state = JSON.stringify(body.state || { games: [], players: [] });
        await env.DB.prepare(`
          INSERT INTO live_sessions (session_code, host_name, state_json)
          VALUES (?, ?, ?)
        `).bind(sessionCode, body.hostName || 'Hôte', state).run();

        return Response.json({ success: true, sessionCode }, { headers: corsHeaders });
      }

      if (request.method === 'GET' && url.pathname.startsWith('/api/sessions/')) {
        const code = url.pathname.replace('/api/sessions/', '').trim().toUpperCase();
        const row = await env.DB.prepare('SELECT session_code, host_name, state_json, updated_at FROM live_sessions WHERE session_code = ?')
          .bind(code)
          .first();

        if (!row) {
          return Response.json({ error: 'Session introuvable' }, { status: 404, headers: corsHeaders });
        }

        return Response.json({
          sessionCode: row.session_code,
          hostName: row.host_name,
          state: JSON.parse(row.state_json),
          updatedAt: row.updated_at
        }, { headers: corsHeaders });
      }

      if (request.method === 'POST' && url.pathname.startsWith('/api/sessions/') && url.pathname.endsWith('/update')) {
        const code = url.pathname.replace('/api/sessions/', '').replace('/update', '').trim().toUpperCase();
        const body = await request.json();
        const state = JSON.stringify(body.state);
        await env.DB.prepare('UPDATE live_sessions SET state_json = ?, updated_at = CURRENT_TIMESTAMP WHERE session_code = ?')
          .bind(state, code)
          .run();

        return Response.json({ success: true, sessionCode: code }, { headers: corsHeaders });
      }

      return Response.json({ error: 'Endpoint non trouvé' }, { status: 404, headers: corsHeaders });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
    }
  }
};
