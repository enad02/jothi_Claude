import cloudflareAccessPlugin from "@cloudflare/pages-plugin-cloudflare-access";
import {
  A_LEVEL_USERS,
  LOCAL_A_LEVEL_PRINCIPAL,
  principalFromAccess
} from "./a-level-users.js";
import {
  localSchedulerBypassAllowed
} from "./scheduler-write-guard.js";

function errorResponse(status, message) {
  return Response.json({ error: message }, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

function deniedResponse() {
  return errorResponse(403, "A-Level access is not authorised.");
}

function unavailableResponse() {
  return errorResponse(503, "A-Level authentication is not configured.");
}

export function accessConfiguration(env) {
  const domain = typeof env.ACCESS_DOMAIN === "string"
    ? env.ACCESS_DOMAIN.trim()
    : "";
  const aud = typeof env.ACCESS_AUD === "string" ? env.ACCESS_AUD.trim() : "";

  try {
    const url = new URL(domain);
    if (url.protocol !== "https:"
      || !url.hostname.endsWith(".cloudflareaccess.com")
      || url.pathname !== "/"
      || url.search
      || url.hash) {
      return null;
    }
  } catch {
    return null;
  }

  return aud ? { domain, aud } : null;
}

export function hasValidatedAccessPayload(data, configuration) {
  const payload = data?.cloudflareAccess?.JWT?.payload;
  const audiences = Array.isArray(payload?.aud) ? payload.aud : [payload?.aud];
  return payload?.iss === new URL(configuration.domain).origin
    && audiences.includes(configuration.aud)
    && typeof payload.exp === "number"
    && payload.exp > Date.now() / 1000;
}

export function createALevelAccessMiddleware({
  pluginFactory = cloudflareAccessPlugin,
  users = A_LEVEL_USERS
} = {}) {
  return async function aLevelAccessMiddleware(context) {
    context.data ||= {};

    if (await localSchedulerBypassAllowed(context.request, context.env)) {
      context.data.aLevelPrincipal = { ...LOCAL_A_LEVEL_PRINCIPAL };
      return context.next();
    }

    const configuration = accessConfiguration(context.env);
    if (!configuration) {
      return unavailableResponse();
    }

    const accessMiddleware = pluginFactory(configuration);
    const response = await accessMiddleware({
      ...context,
      next: async (...args) => {
        if (!hasValidatedAccessPayload(context.data, configuration)) {
          return deniedResponse();
        }
        const principal = principalFromAccess(context.data, users);
        if (!principal) {
          return deniedResponse();
        }
        context.data.aLevelPrincipal = principal;
        return context.next(...args);
      }
    });

    // The plugin redirects failed browser authentication to Access login. Staff
    // API routes return an explicit denial instead of exposing redirect behaviour.
    if (response.status >= 300 && response.status < 400) {
      return deniedResponse();
    }
    return response;
  };
}
