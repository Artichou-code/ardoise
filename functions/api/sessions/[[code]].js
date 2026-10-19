export async function onRequest(context) {
  const { request, env, params } = context;
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
      const sessionCode = `TAB-${rand}`;

      const initialGames = Array.isArray(body.games)
        ? body.games
        : Array.isArray(body.state?.games)
        ? body.state.games
        : [];

      const cf = request.cf || {};
      const detectedCity = cf.city || null;
      const detectedCountry = cf.country || null;
      const customCity = body.customCity ? String(body.customCity).trim() : null;
      const finalCity = customCity || (body.city ? String(body.city).trim() : null) || detectedCity || null;

      const stateObj = body.state || {
        name: body.name || 'Session Ardoise',
        createdAt: new Date().toISOString(),
        host: body.host || 'Hôte',
        participants: body.participants || [],
        games: initialGames,
      };

      stateObj.city = finalCity;
      stateObj.detectedCity = detectedCity;
      stateObj.customCity = customCity;
      stateObj.country = detectedCountry;

      const initialState = JSON.stringify(stateObj);

      await env.DB.prepare(
        `INSERT INTO live_sessions (session_code, host_name, state_json, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      )
        .bind(sessionCode, body.host || 'Hôte', initialState)
        .run();

      // Enregistrer l'événement de création dans scan_events pour enrichir les stats globales immédiatement
      try {
        const ua = request.headers.get('User-Agent') || '';
        let device_os = 'Autre';
        if (/iphone|ipad|ipod/i.test(ua)) device_os = 'iOS';
        else if (/android/i.test(ua)) device_os = 'Android';
        else if (/macintosh|mac os x/i.test(ua)) device_os = 'macOS';
        else if (/windows/i.test(ua)) device_os = 'Windows';
        else if (/linux/i.test(ua)) device_os = 'Linux';
        const is_pwa = body.is_pwa ? 1 : 0;

        await env.DB.prepare(
          `INSERT INTO scan_events (event_type, session_code, user_agent, country, city, device_os, is_pwa) 
           VALUES ('session_create', ?, ?, ?, ?, ?, ?)`
        )
          .bind(sessionCode, ua.slice(0, 300), detectedCountry, finalCity, device_os, is_pwa)
          .run();
      } catch (_) {}

      return Response.json({
        success: true,
        sessionCode,
        city: finalCity,
        detectedCity,
        country: detectedCountry,
      }, { headers: corsHeaders });
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

      const cf = request.cf || {};
      const currentDetectedCity = parsedState.detectedCity || cf.city || null;
      const currentCity = parsedState.customCity || parsedState.city || currentDetectedCity || null;
      const currentCountry = parsedState.country || cf.country || null;

      if (!parsedState.city && currentCity) parsedState.city = currentCity;
      if (!parsedState.detectedCity && currentDetectedCity) parsedState.detectedCity = currentDetectedCity;
      if (!parsedState.country && currentCountry) parsedState.country = currentCountry;

      return Response.json(
        {
          success: true,
          sessionCode: row.session_code,
          hostName: row.host_name,
          closed: isClosed,
          state: parsedState,
          city: currentCity,
          detectedCity: currentDetectedCity,
          customCity: parsedState.customCity || null,
          country: currentCountry,
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

      // Action atomique : Mettre à jour la ville (nom manuel ou correction de détection)
      if (body.action === 'update_city') {
        const rawNewCity = (body.city || '').trim();
        const newCity = rawNewCity || null;
        const existing = await env.DB.prepare(
          'SELECT state_json FROM live_sessions WHERE session_code = ?'
        )
          .bind(sessionCode)
          .first();

        if (!existing) {
          return Response.json({ error: 'Session introuvable' }, { status: 404, headers: corsHeaders });
        }

        let currentState = {};
        try {
          currentState = JSON.parse(existing.state_json || '{}');
        } catch {}

        currentState.customCity = newCity;
        currentState.city = newCity || currentState.detectedCity || null;
        currentState.updatedAt = new Date().toISOString();

        await env.DB.prepare(
          `UPDATE live_sessions
           SET state_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE session_code = ?`
        )
          .bind(JSON.stringify(currentState), sessionCode)
          .run();

        // Mettre à jour également scan_events pour que le Top Villes et le détail soient fidèles
        if (newCity) {
          try {
            await env.DB.prepare(
              `UPDATE scan_events SET city = ? WHERE session_code = ?`
            )
              .bind(newCity, sessionCode)
              .run();
          } catch (_) {}
        }

        return Response.json({
          success: true,
          sessionCode,
          city: currentState.city,
          customCity: currentState.customCity,
          state: currentState,
        }, { headers: corsHeaders });
      }

      // Action atomique : Pousser une partie sans faire de GET préalable côté client
      if (body.action === 'push_game' && body.game && body.game.id) {
        const existing = await env.DB.prepare(
          'SELECT state_json, closed FROM live_sessions WHERE session_code = ?'
        )
          .bind(sessionCode)
          .first();

        if (!existing) {
          return Response.json({ error: 'Session introuvable' }, { status: 404, headers: corsHeaders });
        }
        if (existing.closed) {
          return Response.json({ error: 'Session clôturée', closed: true }, { status: 400, headers: corsHeaders });
        }

        let currentState = {};
        try {
          currentState = JSON.parse(existing.state_json || '{}');
        } catch {}

        if (currentState.closed) {
          return Response.json({ error: 'Session clôturée', closed: true }, { status: 400, headers: corsHeaders });
        }

        const games = Array.isArray(currentState.games) ? [...currentState.games] : [];
        const idx = games.findIndex((g) => g && g.id === body.game.id);
        if (idx >= 0) {
          games[idx] = body.game;
        } else {
          games.unshift(body.game);
        }
        currentState.games = games;
        currentState.updatedAt = new Date().toISOString();

        await env.DB.prepare(
          `UPDATE live_sessions
           SET state_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE session_code = ?`
        )
          .bind(JSON.stringify(currentState), sessionCode)
          .run();

        return Response.json({ success: true, sessionCode, state: currentState }, { headers: corsHeaders });
      }

      // Action atomique : Mettre à jour le brouillon (draft) d'un joueur en direct (collaboratif)
      if (body.action === 'update_draft' && body.gameId) {
        const existing = await env.DB.prepare(
          'SELECT state_json, closed FROM live_sessions WHERE session_code = ?'
        )
          .bind(sessionCode)
          .first();

        if (!existing) {
          return Response.json({ error: 'Session introuvable' }, { status: 404, headers: corsHeaders });
        }
        if (existing.closed) {
          return Response.json({ error: 'Session clôturée', closed: true }, { status: 400, headers: corsHeaders });
        }

        let currentState = {};
        try {
          currentState = JSON.parse(existing.state_json || '{}');
        } catch {}

        if (currentState.closed) {
          return Response.json({ error: 'Session clôturée', closed: true }, { status: 400, headers: corsHeaders });
        }

        const games = Array.isArray(currentState.games) ? [...currentState.games] : [];
        const idx = games.findIndex((g) => g && g.id === body.gameId);
        if (idx === -1) {
          return Response.json({ error: 'Partie introuvable' }, { status: 404, headers: corsHeaders });
        }

        const game = { ...games[idx] };
        const currentDraft = game.draft && typeof game.draft === 'object' ? { ...game.draft } : {};
        const byPlayer = currentDraft.byPlayer ? { ...currentDraft.byPlayer } : {};

        if (body.playerId) {
          if (body.data === null || body.data === undefined) {
            delete byPlayer[body.playerId];
          } else {
            byPlayer[body.playerId] = {
              ...(byPlayer[body.playerId] || {}),
              ...body.data,
              updatedAt: Date.now(),
            };
          }
        } else if (body.byPlayer && typeof body.byPlayer === 'object') {
          Object.assign(byPlayer, body.byPlayer);
        }

        game.draft = {
          roundIndex: body.roundIndex != null ? body.roundIndex : (game.rounds?.length || 0) + 1,
          updatedAt: Date.now(),
          byPlayer,
        };

        games[idx] = game;
        currentState.games = games;
        currentState.updatedAt = new Date().toISOString();

        await env.DB.prepare(
          `UPDATE live_sessions
           SET state_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE session_code = ?`
        )
          .bind(JSON.stringify(currentState), sessionCode)
          .run();

        return Response.json({ success: true, sessionCode, draft: game.draft }, { headers: corsHeaders });
      }

      // Action atomique : Valider une manche avec verrouillage optimiste anti-collision (OCC)
      if (body.action === 'commit_round' && body.gameId && body.roundData) {
        const existing = await env.DB.prepare(
          'SELECT state_json, closed FROM live_sessions WHERE session_code = ?'
        )
          .bind(sessionCode)
          .first();

        if (!existing) {
          return Response.json({ error: 'Session introuvable' }, { status: 404, headers: corsHeaders });
        }
        if (existing.closed) {
          return Response.json({ error: 'Session clôturée', closed: true }, { status: 400, headers: corsHeaders });
        }

        let currentState = {};
        try {
          currentState = JSON.parse(existing.state_json || '{}');
        } catch {}

        if (currentState.closed) {
          return Response.json({ error: 'Session clôturée', closed: true }, { status: 400, headers: corsHeaders });
        }

        const games = Array.isArray(currentState.games) ? [...currentState.games] : [];
        const idx = games.findIndex((g) => g && g.id === body.gameId);
        if (idx === -1) {
          return Response.json({ error: 'Partie introuvable' }, { status: 404, headers: corsHeaders });
        }

        const game = { ...games[idx] };
        const rounds = Array.isArray(game.rounds) ? [...game.rounds] : [];
        const targetRoundIndex = Number(body.roundIndex) || (rounds.length + 1);

        // Anti-collision : Si la manche a déjà été validée par un autre joueur à l'instant (rounds.length >= targetRoundIndex)
        if (rounds.length >= targetRoundIndex) {
          return Response.json({
            success: true,
            sessionCode,
            alreadyCommitted: true,
            roundIndex: targetRoundIndex,
            currentRoundsCount: rounds.length,
            game,
          }, { headers: corsHeaders });
        }

        // Première validation reçue : insertion de la manche
        const newRound = {
          ...body.roundData,
          savedAt: Date.now(),
        };
        rounds.push(newRound);
        game.rounds = rounds;
        if (body.roundData.scores) {
          game.scores = body.roundData.scores;
        }
        if (body.status) {
          game.status = body.status;
        }
        if (body.winner) {
          game.winner = body.winner;
        }
        // Vider le brouillon de la manche terminée
        game.draft = null;
        game.updatedAt = Date.now();

        games[idx] = game;
        currentState.games = games;
        currentState.updatedAt = new Date().toISOString();

        await env.DB.prepare(
          `UPDATE live_sessions
           SET state_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE session_code = ?`
        )
          .bind(JSON.stringify(currentState), sessionCode)
          .run();

        return Response.json({
          success: true,
          sessionCode,
          alreadyCommitted: false,
          roundIndex: targetRoundIndex,
          game,
          state: currentState,
        }, { headers: corsHeaders });
      }

      // Action atomique : Retirer une partie
      if (body.action === 'remove_game' && body.gameId) {
        const existing = await env.DB.prepare(
          'SELECT state_json, closed FROM live_sessions WHERE session_code = ?'
        )
          .bind(sessionCode)
          .first();

        if (existing) {
          let currentState = {};
          try {
            currentState = JSON.parse(existing.state_json || '{}');
          } catch {}
          const games = Array.isArray(currentState.games) ? currentState.games.filter(g => g && g.id !== body.gameId) : [];
          currentState.games = games;
          currentState.updatedAt = new Date().toISOString();

          await env.DB.prepare(
            `UPDATE live_sessions
             SET state_json = ?, updated_at = CURRENT_TIMESTAMP
             WHERE session_code = ?`
          )
            .bind(JSON.stringify(currentState), sessionCode)
            .run();
        }
        return Response.json({ success: true, sessionCode }, { headers: corsHeaders });
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

      const cityToUpdate = (stateObj.customCity || stateObj.city || '').trim();
      if (cityToUpdate) {
        try {
          await env.DB.prepare(
            `UPDATE scan_events SET city = ? WHERE session_code = ?`
          )
            .bind(cityToUpdate, sessionCode)
            .run();
        } catch (_) {}
      }

      return Response.json({ success: true, sessionCode, closed: isClosed }, { headers: corsHeaders });
    }

    return Response.json({ error: 'Méthode non autorisée' }, { status: 405, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
