import cloudflareAccessPlugin from "@cloudflare/pages-plugin-cloudflare-access";
import {
  LOCAL_SCHEDULER_ACTOR,
  localSchedulerBypassAllowed
} from "./scheduler-write-guard.js";

const WRITE_METHODS = new Set(["PATCH", "POST", "PUT", "DELETE"]);

function deniedResponse() {
  return Response.json({ error: "Staff authentication is required." }, {
    status: 403,
    headers: { "Cache-Control": "no-store" }
  });
}

export function accessConfiguration(env) {
  const domain = typeof env.CF_ACCESS_TEAM_DOMAIN === "string"
    ? env.CF_ACCESS_TEAM_DOMAIN.trim()
    : "";
  const aud = typeof env.CF_ACCESS_AUD === "string" ? env.CF_ACCESS_AUD.trim() : "";

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

export function actorIdentifierFromValidatedAccess(data, configuration) {
  if (!hasValidatedAccessPayload(data, configuration)) {
    return null;
  }
  const email = data.cloudflareAccess.JWT.payload.email;
  return typeof email === "string" && email.trim() ? email.trim() : null;
}

export function createSchedulerStaffMiddleware(pluginFactory = cloudflareAccessPlugin) {
  return async function schedulerStaffMiddleware(context) {
    context.data ||= {};

    if (await localSchedulerBypassAllowed(context.request, context.env)) {
      context.data.schedulerActorIdentifier = LOCAL_SCHEDULER_ACTOR;
      return context.next();
    }

    const configuration = accessConfiguration(context.env);
    if (!configuration) {
      return deniedResponse();
    }

    const accessMiddleware = pluginFactory(configuration);
    const response = await accessMiddleware({
      ...context,
      next: async (...args) => {
        if (!hasValidatedAccessPayload(context.data, configuration)) {
          return deniedResponse();
        }
        const actorIdentifier = actorIdentifierFromValidatedAccess(context.data, configuration);
        if (actorIdentifier) {
          context.data.schedulerActorIdentifier = actorIdentifier;
        } else if (WRITE_METHODS.has(context.request.method.toUpperCase())) {
          return deniedResponse();
        }
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
