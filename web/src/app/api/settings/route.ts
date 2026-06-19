export const dynamic = "force-dynamic";

import { bad, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

// GET  /api/settings -> { key: value, ... }
// POST /api/settings  (body: { [key]: value }) -> upserts each pair

export async function GET() {
  const rows = await prisma.setting.findMany();
  const obj: Record<string, string> = {};
  for (const r of rows) obj[r.key] = r.value;
  return ok(obj);
}

export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request body");
  }
  for (const [key, value] of Object.entries(body)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value ?? "") },
      create: { key, value: String(value ?? "") },
    });
  }
  return ok({ ok: true });
}
