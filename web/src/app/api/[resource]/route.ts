export const dynamic = "force-dynamic";

import { bad, notFound, ok } from "@/lib/http";
import { coerceData, getResource } from "@/lib/resources";

// GET /api/:resource          -> list (optional ?q= filter on string fields)
// POST /api/:resource         -> create

export async function GET(
  req: Request,
  { params }: { params: { resource: string } },
) {
  const resource = getResource(params.resource);
  if (!resource) return notFound("Unknown resource");

  const records = await resource.model.findMany({ orderBy: resource.defaultOrderBy });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase().trim();
  if (!q) return ok(records);

  const stringFields = resource.fields
    .filter((f) => f.type === "string" || f.type === "text")
    .map((f) => f.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = records.filter((r: Record<string, any>) =>
    stringFields.some((f) => String(r[f] ?? "").toLowerCase().includes(q)),
  );
  return ok(filtered);
}

export async function POST(
  req: Request,
  { params }: { params: { resource: string } },
) {
  const resource = getResource(params.resource);
  if (!resource) return notFound("Unknown resource");

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return bad("Invalid request body");
  }

  const data = coerceData(resource, input, false);
  try {
    resource.beforeWrite?.(data, null);
  } catch (e) {
    return bad((e as Error).message);
  }

  try {
    const created = await resource.model.create({ data });
    return ok(created, { status: 201 });
  } catch (e) {
    return bad("Create failed: " + (e as Error).message);
  }
}
