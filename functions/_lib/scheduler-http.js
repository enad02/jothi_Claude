export class SchedulerHttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "SchedulerHttpError";
    this.status = status;
  }
}

export function jsonResponse(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export async function readJsonBody(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 32768) {
    throw new SchedulerHttpError(413, "Request body is too large.");
  }

  try {
    const body = await request.json();
    if (!body || Array.isArray(body) || typeof body !== "object") {
      throw new SchedulerHttpError(400, "A JSON object is required.");
    }
    return body;
  } catch (error) {
    if (error instanceof SchedulerHttpError) {
      throw error;
    }
    throw new SchedulerHttpError(400, "Valid JSON is required.");
  }
}

export async function handleSchedulerRequest(context, handler) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof SchedulerHttpError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    console.error(JSON.stringify({
      message: "A-Level scheduler request failed",
      method: context.request.method,
      path: new URL(context.request.url).pathname,
      error: error instanceof Error ? error.message : String(error)
    }));
    return jsonResponse({ error: "Schedule service is temporarily unavailable." }, 500);
  }
}
