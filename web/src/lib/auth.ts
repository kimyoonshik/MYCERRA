// Simple admin-only authentication for the local-first MVP.
//
// A single owner/admin signs in with ADMIN_PASSWORD. On success we issue a
// signed (HMAC-SHA256) session cookie. Verification uses the Web Crypto API so
// the same code runs in both the Node and Edge (middleware) runtimes.
//
// This is intentionally minimal: the app is meant to run locally, bound to the
// operator's machine. It is NOT a multi-user identity system.

export const SESSION_COOKIE = "mycerra_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function getSecret(): string {
  return process.env.AUTH_SECRET || "mycerra-dev-secret-change-me";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toBase64Url(new Uint8Array(sig));
}

export async function createSession(): Promise<string> {
  const payload = toBase64Url(
    new TextEncoder().encode(JSON.stringify({ sub: "admin", iat: Date.now() })),
  );
  const signature = await hmac(payload);
  return `${payload}.${signature}`;
}

export async function verifySession(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = await hmac(payload);
  if (expected !== signature) return false;

  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (data.sub !== "admin") return false;
    if (typeof data.iat !== "number") return false;
    if (Date.now() - data.iat > SESSION_TTL_MS) return false;
    return true;
  } catch {
    return false;
  }
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "change-me-locally";
  return typeof password === "string" && password.length > 0 && password === expected;
}
