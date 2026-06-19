// Server-side (Node runtime) auth helpers for route handlers & server pages.

import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./auth";

export async function isAuthenticated(): Promise<boolean> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}
