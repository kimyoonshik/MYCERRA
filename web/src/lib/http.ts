// Small response helpers for route handlers.

export function ok(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function bad(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export function notFound(message = "Not found"): Response {
  return Response.json({ error: message }, { status: 404 });
}

export function unauthorized(message = "Unauthorized"): Response {
  return Response.json({ error: message }, { status: 401 });
}
