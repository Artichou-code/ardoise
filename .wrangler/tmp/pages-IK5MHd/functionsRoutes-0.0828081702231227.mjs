import { onRequest as __api_games_share___code___js_onRequest } from "F:\\Web-design\\APP_builder\\Antigravity\\Ardoise\\functions\\api\\games\\share\\[[code]].js"
import { onRequest as __api_sessions___code___js_onRequest } from "F:\\Web-design\\APP_builder\\Antigravity\\Ardoise\\functions\\api\\sessions\\[[code]].js"
import { onRequest as __api_sync___key___js_onRequest } from "F:\\Web-design\\APP_builder\\Antigravity\\Ardoise\\functions\\api\\sync\\[[key]].js"

export const routes = [
    {
      routePath: "/api/games/share/:code*",
      mountPath: "/api/games/share",
      method: "",
      middlewares: [],
      modules: [__api_games_share___code___js_onRequest],
    },
  {
      routePath: "/api/sessions/:code*",
      mountPath: "/api/sessions",
      method: "",
      middlewares: [],
      modules: [__api_sessions___code___js_onRequest],
    },
  {
      routePath: "/api/sync/:key*",
      mountPath: "/api/sync",
      method: "",
      middlewares: [],
      modules: [__api_sync___key___js_onRequest],
    },
  ]