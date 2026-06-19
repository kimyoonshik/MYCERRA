import { cookies } from "next/headers";
import { SESSION_COOKIE, checkPassword, createSession } from "@/lib/auth";
import { bad, ok } from "@/lib/http";

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request body");
  }

  if (!checkPassword(body.password ?? "")) {
    return bad("Incorrect password", 401);
  }

  const token = await createSession();
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return ok({ ok: true });
}
