const COUNTRY_MAP = {
  FR: { name: 'France', flag: '🇫🇷' },
  BE: { name: 'Belgique', flag: '🇧🇪' },
  CH: { name: 'Suisse', flag: '🇨🇭' },
  CA: { name: 'Canada', flag: '🇨🇦' },
  ES: { name: 'Espagne', flag: '🇪🇸' },
  IT: { name: 'Italie', flag: '🇮🇹' },
  DE: { name: 'Allemagne', flag: '🇩🇪' },
  GB: { name: 'Royaume-Uni', flag: '🇬🇧' },
  US: { name: 'États-Unis', flag: '🇺🇸' },
  LU: { name: 'Luxembourg', flag: '🇱🇺' },
  PT: { name: 'Portugal', flag: '🇵🇹' },
  NL: { name: 'Pays-Bas', flag: '🇳🇱' },
  MA: { name: 'Maroc', flag: '🇲🇦' },
  TN: { name: 'Tunisie', flag: '🇹🇳' },
  DZ: { name: 'Algérie', flag: '🇩🇿' },
}

const GAME_NAMES_MAP = {
  molkky: 'Mölkky',
  yams: "Yam's / Yahtzee",
  dixit: 'Dixit',
  uno: 'UNO',
  symbiose: 'Symbiose',
  rami: 'Rami',
  yaniv: 'Yaniv',
  caracole: 'Caracole',
  dourak: 'Dourak',
  skyjo: 'Skyjo',
  belote: 'Belote & Coinche',
  tarot: 'Tarot',
  president: 'Président',
  '6-qui-prend': '6 qui prend !',
  'dame-de-pique': 'Dame de Pique',
  barbu: 'Le Barbu',
  'flip-7': 'Flip 7',
  'sea-salt-paper': 'Sea Salt & Paper',
  ascenseur: 'Ascenseur',
  'compteur-universel': 'Compteur Libre',
}

const DOW_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

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
    // 1. Totaux globaux scan_events
    const totals = await env.DB.prepare(
      `SELECT event_type, COUNT(*) as count FROM scan_events GROUP BY event_type`
    ).all()

    // 2. Sessions créées & closes
    const sessionsTotal = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM live_sessions`
    ).first()

    const sessionsClosed = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM live_sessions WHERE closed = 1`
    ).first()

    // 3. Calculs avancés sur les sessions en direct (participants cumulés, record max et joueurs uniques)
    const sessionsRaw = await env.DB.prepare(
      `SELECT state_json, host_name FROM live_sessions`
    ).all()

    let totalParticipants = 0
    let maxParticipantsLive = 0
    const uniquePlayersSet = new Set()

    for (const row of sessionsRaw.results || []) {
      try {
        const state = JSON.parse(row.state_json || '{}')
        const pList = Array.isArray(state.participants) ? state.participants : []
        totalParticipants += pList.length
        if (pList.length > maxParticipantsLive) {
          maxParticipantsLive = pList.length
        }
        if (row.host_name) {
          uniquePlayersSet.add(row.host_name.trim().toLowerCase())
        }
        for (const p of pList) {
          if (p.name) uniquePlayersSet.add(p.name.trim().toLowerCase())
        }
      } catch (_) {}
    }

    // 4. Shared games & joueurs issus des partages
    const sharedTotal = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM shared_games`
    ).first()

    const sharedGamesRaw = await env.DB.prepare(
      `SELECT payload_json, game_type, country, city FROM shared_games`
    ).all()

    const gamesTypeCount = {}
    let totalGamesSharedCount = 0

    for (const row of sharedGamesRaw.results || []) {
      try {
        const payload = JSON.parse(row.payload_json || '{}')
        const players = Array.isArray(payload.players) ? payload.players : []
        for (const p of players) {
          if (p.name) uniquePlayersSet.add(p.name.trim().toLowerCase())
        }

        const games = Array.isArray(payload.games) ? payload.games : payload.game ? [payload.game] : []
        for (const g of games) {
          const rawType = (g.type || row.game_type || g.name || 'Inconnu').toLowerCase()
          gamesTypeCount[rawType] = (gamesTypeCount[rawType] || 0) + 1
          totalGamesSharedCount++
        }
      } catch (_) {}
    }

    // Palmarès des jeux
    const gamesPopularity = Object.entries(gamesTypeCount)
      .map(([typeKey, count]) => {
        const displayName = GAME_NAMES_MAP[typeKey] || (typeKey.charAt(0).toUpperCase() + typeKey.slice(1))
        return {
          id: typeKey,
          name: displayName,
          count,
          pct: totalGamesSharedCount > 0 ? Math.round((count / totalGamesSharedCount) * 100) : 0,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    // 5. Géolocalisation : Top Pays
    const countriesRaw = await env.DB.prepare(
      `SELECT country, COUNT(*) as count 
       FROM (
         SELECT country FROM scan_events WHERE country IS NOT NULL AND country != ''
         UNION ALL
         SELECT country FROM shared_games WHERE country IS NOT NULL AND country != ''
       )
       GROUP BY country
       ORDER BY count DESC
       LIMIT 6`
    ).all()

    const totalGeoEvents = (countriesRaw.results || []).reduce((acc, r) => acc + (r.count || 0), 0)
    const countries = (countriesRaw.results || []).map((row) => {
      const meta = COUNTRY_MAP[row.country?.toUpperCase()] || {}
      const flag = meta.flag || (row.country?.length === 2 ? String.fromCodePoint(...[...row.country.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : '🌐')
      const name = meta.name || row.country
      return {
        code: row.country,
        name,
        flag,
        count: row.count,
        pct: totalGeoEvents > 0 ? Math.round((row.count / totalGeoEvents) * 100) : 0,
      }
    })

    // 6. Géolocalisation : Top Villes
    const citiesRaw = await env.DB.prepare(
      `SELECT city, country, COUNT(*) as count 
       FROM (
         SELECT city, country FROM scan_events WHERE city IS NOT NULL AND city != ''
         UNION ALL
         SELECT city, country FROM shared_games WHERE city IS NOT NULL AND city != ''
       )
       GROUP BY city, country
       ORDER BY count DESC
       LIMIT 6`
    ).all()

    const cities = (citiesRaw.results || []).map((row) => ({
      city: row.city,
      country: row.country,
      flag: COUNTRY_MAP[row.country?.toUpperCase()]?.flag || '📍',
      count: row.count,
    }))

    // 6b. Événements récents par ville (pour inspecter le détail en cliquant sur une ville)
    const cityEventsRaw = await env.DB.prepare(
      `SELECT 
         'scan' as source,
         event_type as type,
         session_code as code,
         city,
         country,
         device_os as os,
         created_at
       FROM scan_events
       WHERE city IS NOT NULL AND city != ''
       UNION ALL
       SELECT 
         'shared_game' as source,
         game_type as type,
         game_id as code,
         city,
         country,
         'Web' as os,
         created_at
       FROM shared_games
       WHERE city IS NOT NULL AND city != ''
       ORDER BY created_at DESC
       LIMIT 60`
    ).all()

    const cityEvents = (cityEventsRaw.results || []).map((r) => ({
      source: r.source,
      type: r.type,
      code: r.code,
      city: r.city,
      country: r.country,
      os: r.os,
      createdAt: r.created_at ? r.created_at.replace(' ', 'T') + 'Z' : new Date().toISOString(),
    }))

    // 7. Matériel & OS
    const devicesRaw = await env.DB.prepare(
      `SELECT device_os, COUNT(*) as count 
       FROM scan_events 
       WHERE device_os IS NOT NULL 
       GROUP BY device_os 
       ORDER BY count DESC`
    ).all()

    const totalDevices = (devicesRaw.results || []).reduce((acc, r) => acc + (r.count || 0), 0)
    const devices = (devicesRaw.results || []).map((r) => ({
      os: r.device_os,
      count: r.count,
      pct: totalDevices > 0 ? Math.round((r.count / totalDevices) * 100) : 0,
    }))

    // 8. Taux PWA (installée vs web)
    const pwaRaw = await env.DB.prepare(
      `SELECT is_pwa, COUNT(*) as count FROM scan_events GROUP BY is_pwa`
    ).all()

    let pwaInstalled = 0
    let pwaBrowser = 0
    for (const r of pwaRaw.results || []) {
      if (r.is_pwa === 1) pwaInstalled += r.count
      else pwaBrowser += r.count
    }
    const totalPwaChecks = pwaInstalled + pwaBrowser
    const pwaRate = totalPwaChecks > 0 ? Math.round((pwaInstalled / totalPwaChecks) * 100) : 0

    // 9. Jours les plus actifs de la semaine
    const dowRaw = await env.DB.prepare(
      `SELECT strftime('%w', created_at) as dow, COUNT(*) as count 
       FROM scan_events 
       GROUP BY dow`
    ).all()

    const dowStats = (dowRaw.results || []).map((r) => {
      const idx = parseInt(r.dow, 10)
      return {
        dow: idx,
        name: DOW_NAMES[idx] || 'Jour',
        count: r.count,
      }
    }).sort((a, b) => b.count - a.count)

    // 10. Historiques chronologiques 30j
    const history = await env.DB.prepare(
      `SELECT date(created_at) as day, event_type, COUNT(*) as count
       FROM scan_events
       WHERE created_at >= date('now', '-30 days')
       GROUP BY day, event_type
       ORDER BY day DESC`
    ).all()

    const sessionsHistory = await env.DB.prepare(
      `SELECT date(created_at) as day, COUNT(*) as count
       FROM live_sessions
       WHERE created_at >= date('now', '-30 days')
       GROUP BY day
       ORDER BY day DESC`
    ).all()

    const totalsMap = {}
    for (const row of totals.results || []) {
      totalsMap[row.event_type] = row.count
    }

    return Response.json(
      {
        totals: totalsMap,
        sessions: {
          total: sessionsTotal?.count || 0,
          closed: sessionsClosed?.count || 0,
          totalParticipants,
          maxParticipantsLive,
          uniquePlayersCount: uniquePlayersSet.size,
        },
        sharedGames: sharedTotal?.count || 0,
        geo: {
          countries,
          cities,
          cityEvents,
        },
        gamesPopularity,
        devices,
        pwa: {
          installed: pwaInstalled,
          browser: pwaBrowser,
          rate: pwaRate,
        },
        busiestDay: dowStats[0] ? dowStats[0].name : null,
        history: history.results || [],
        sessionsHistory: sessionsHistory.results || [],
      },
      { headers: corsHeaders }
    )
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders })
  }
}
