export const dynamic = "force-dynamic";

import { bad, ok } from "@/lib/http";
import { classifyPhrase } from "@/lib/risk";

// POST /api/classify  (body: { text: string })
// Runs the local, deterministic risk classifier. No data is stored.

export async function POST(req: Request) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request body");
  }
  if (typeof body.text !== "string") return bad("Missing 'text'");
  return ok(classifyPhrase(body.text));
}
