var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/games/share/[[code]].js
async function onRequest(context) {
  const { request, env, params } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const rawParam = Array.isArray(params.code) ? params.code.join("/") : params.code || "";
    const codeOrId = rawParam.trim();
    if (!env.DB) {
      return Response.json({ error: "Base de donn\xE9es non configur\xE9e" }, { status: 500, headers: corsHeaders });
    }
    if (request.method === "POST") {
      const body = await request.json();
      const isBatch = Array.isArray(body?.games) && body.games.length > 0;
      const singleGame = body?.game;
      if (!isBatch && (!singleGame || !singleGame.id)) {
        return Response.json({ error: "Donn\xE9es de match invalides" }, { status: 400, headers: corsHeaders });
      }
      const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
      let randCode = "";
      for (let i = 0; i < 6; i++) {
        randCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const gameCode = `ARD-${randCode.slice(0, 4)}`;
      let recordId;
      let payloadObj;
      if (isBatch) {
        const validGames = body.games.filter((g) => g && g.id);
        if (validGames.length === 0) {
          return Response.json({ error: "Aucune partie valide \xE0 partager" }, { status: 400, headers: corsHeaders });
        }
        recordId = validGames.length === 1 ? validGames[0].id : `batch_${Date.now()}_${randCode}`;
        payloadObj = {
          type: "batch",
          games: validGames,
          players: Array.isArray(body.players) ? body.players : [],
          sharedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      } else {
        recordId = singleGame.id;
        payloadObj = {
          type: "batch",
          games: [singleGame],
          players: Array.isArray(singleGame.players) ? singleGame.players : [],
          sharedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      const payloadJson = JSON.stringify(payloadObj);
      await env.DB.prepare(
        `INSERT INTO shared_games (game_id, game_code, payload_json, created_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(game_id) DO UPDATE SET
           game_code = excluded.game_code,
           payload_json = excluded.payload_json`
      ).bind(recordId, gameCode, payloadJson).run();
      const row = await env.DB.prepare(
        "SELECT game_code FROM shared_games WHERE game_id = ?"
      ).bind(recordId).first();
      const finalCode = row?.game_code || gameCode;
      return Response.json(
        {
          success: true,
          gameId: recordId,
          gameCode: finalCode,
          count: payloadObj.games.length
        },
        { headers: corsHeaders }
      );
    }
    if (request.method === "GET") {
      if (!codeOrId) {
        return Response.json({ error: "Identifiant de match requis" }, { status: 400, headers: corsHeaders });
      }
      const cleanUpper = codeOrId.toUpperCase();
      const withPrefix = cleanUpper.startsWith("ARD-") ? cleanUpper : `ARD-${cleanUpper}`;
      const row = await env.DB.prepare(
        `SELECT payload_json, created_at FROM shared_games
         WHERE game_id = ? OR game_code = ? OR game_code = ?`
      ).bind(codeOrId, cleanUpper, withPrefix).first();
      if (!row) {
        return Response.json({ error: "Partage introuvable ou expir\xE9" }, { status: 404, headers: corsHeaders });
      }
      const parsed = JSON.parse(row.payload_json);
      const gamesList = Array.isArray(parsed.games) ? parsed.games : parsed && parsed.id ? [parsed] : [];
      const playersList = Array.isArray(parsed.players) ? parsed.players : gamesList.flatMap((g) => g.players || []);
      return Response.json(
        {
          success: true,
          games: gamesList,
          game: gamesList[0] || null,
          players: playersList,
          createdAt: row.created_at
        },
        { headers: corsHeaders }
      );
    }
    return Response.json({ error: "M\xE9thode non autoris\xE9e" }, { status: 405, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
__name(onRequest, "onRequest");

// api/sessions/[[code]].js
async function onRequest2(context) {
  const { request, env, params } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const rawParam = Array.isArray(params.code) ? params.code.join("/") : params.code || "";
    const cleanParam = rawParam.trim();
    const isCreate = cleanParam === "create" || cleanParam === "";
    if (!env.DB) {
      return Response.json({ error: "Base de donn\xE9es non configur\xE9e" }, { status: 500, headers: corsHeaders });
    }
    if (request.method === "POST" && isCreate) {
      const body = await request.json();
      const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
      let rand = "";
      for (let i = 0; i < 4; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const sessionCode2 = `ARD-${rand}`;
      const initialState = JSON.stringify(body.state || {
        name: body.name || "Session Ardoise",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        host: body.host || "H\xF4te",
        participants: body.participants || [],
        games: []
      });
      await env.DB.prepare(
        `INSERT INTO live_sessions (session_code, host_name, state_json, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      ).bind(sessionCode2, body.host || "H\xF4te", initialState).run();
      return Response.json({ success: true, sessionCode: sessionCode2 }, { headers: corsHeaders });
    }
    const sessionCode = cleanParam.replace(/\/update$/, "").toUpperCase();
    if (!sessionCode) {
      return Response.json({ error: "Code de session manquant" }, { status: 400, headers: corsHeaders });
    }
    if (request.method === "GET") {
      const row = await env.DB.prepare(
        "SELECT session_code, host_name, state_json, closed, updated_at FROM live_sessions WHERE session_code = ?"
      ).bind(sessionCode).first();
      if (!row) {
        return Response.json({ error: "Session introuvable" }, { status: 404, headers: corsHeaders });
      }
      const parsedState = JSON.parse(row.state_json || "{}");
      const isClosed = Boolean(row.closed || parsedState.closed);
      parsedState.closed = isClosed;
      return Response.json(
        {
          success: true,
          sessionCode: row.session_code,
          hostName: row.host_name,
          closed: isClosed,
          state: parsedState,
          updatedAt: row.updated_at
        },
        { headers: corsHeaders }
      );
    }
    if (request.method === "POST") {
      const body = await request.json();
      if (body.action === "close") {
        const existing = await env.DB.prepare(
          "SELECT state_json FROM live_sessions WHERE session_code = ?"
        ).bind(sessionCode).first();
        let currentState = {};
        if (existing && existing.state_json) {
          try {
            currentState = JSON.parse(existing.state_json);
          } catch {
          }
        }
        if (body.state && typeof body.state === "object") {
          currentState = { ...currentState, ...body.state };
        }
        currentState.closed = true;
        currentState.closedAt = (/* @__PURE__ */ new Date()).toISOString();
        await env.DB.prepare(
          `UPDATE live_sessions
           SET closed = 1, state_json = ?, updated_at = CURRENT_TIMESTAMP
           WHERE session_code = ?`
        ).bind(JSON.stringify(currentState), sessionCode).run();
        return Response.json({ success: true, sessionCode, closed: true, state: currentState }, { headers: corsHeaders });
      }
      const stateObj = typeof body.state === "string" ? JSON.parse(body.state) : body.state || {};
      const isClosed = Boolean(stateObj.closed);
      const stateJson = JSON.stringify(stateObj);
      await env.DB.prepare(
        `UPDATE live_sessions
         SET state_json = ?, closed = CASE WHEN ? THEN 1 ELSE closed END, updated_at = CURRENT_TIMESTAMP
         WHERE session_code = ?`
      ).bind(stateJson, isClosed ? 1 : 0, sessionCode).run();
      return Response.json({ success: true, sessionCode, closed: isClosed }, { headers: corsHeaders });
    }
    return Response.json({ error: "M\xE9thode non autoris\xE9e" }, { status: 405, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
__name(onRequest2, "onRequest");

// api/sync/[[key]].js
async function onRequest3(context) {
  const { request, env, params } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const keyParam = Array.isArray(params.key) ? params.key.join("/") : params.key || "";
    const syncKey = keyParam.trim().toUpperCase();
    if (!syncKey) {
      return Response.json({ error: "Cl\xE9 de carnet requise" }, { status: 400, headers: corsHeaders });
    }
    if (!env.DB) {
      return Response.json({ error: "Base de donn\xE9es non configur\xE9e" }, { status: 500, headers: corsHeaders });
    }
    if (request.method === "GET") {
      const row = await env.DB.prepare(
        "SELECT sync_key, payload_json, version, updated_at FROM sync_notebooks WHERE sync_key = ?"
      ).bind(syncKey).first();
      if (!row) {
        return Response.json(
          { found: false, message: "Aucun carnet trouv\xE9 pour cette cl\xE9" },
          { status: 404, headers: corsHeaders }
        );
      }
      return Response.json(
        {
          found: true,
          syncKey: row.sync_key,
          payload: JSON.parse(row.payload_json),
          version: row.version,
          updatedAt: row.updated_at
        },
        { headers: corsHeaders }
      );
    }
    if (request.method === "POST") {
      const body = await request.json();
      if (!body || !body.payload) {
        return Response.json({ error: "Payload de carnet requis" }, { status: 400, headers: corsHeaders });
      }
      const payloadJson = typeof body.payload === "string" ? body.payload : JSON.stringify(body.payload);
      await env.DB.prepare(
        `INSERT INTO sync_notebooks (sync_key, payload_json, version, updated_at)
         VALUES (?, ?, 1, CURRENT_TIMESTAMP)
         ON CONFLICT(sync_key) DO UPDATE SET
           payload_json = excluded.payload_json,
           version = sync_notebooks.version + 1,
           updated_at = CURRENT_TIMESTAMP`
      ).bind(syncKey, payloadJson).run();
      const updated = await env.DB.prepare(
        "SELECT version, updated_at FROM sync_notebooks WHERE sync_key = ?"
      ).bind(syncKey).first();
      return Response.json(
        {
          success: true,
          syncKey,
          version: updated?.version || 1,
          updatedAt: updated?.updated_at
        },
        { headers: corsHeaders }
      );
    }
    return Response.json({ error: "M\xE9thode non support\xE9e" }, { status: 405, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
__name(onRequest3, "onRequest");

// ../.wrangler/tmp/pages-IK5MHd/functionsRoutes-0.0828081702231227.mjs
var routes = [
  {
    routePath: "/api/games/share/:code*",
    mountPath: "/api/games/share",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/sessions/:code*",
    mountPath: "/api/sessions",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/sync/:key*",
    mountPath: "/api/sync",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  }
];

// C:/Users/tchai/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// C:/Users/tchai/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
