export const dynamic = "force-dynamic";

import { bad, notFound, ok } from "@/lib/http";
import { coerceData, getResource } from "@/lib/resources";

// GET    /api/:resource/:id  -> read one
// PATCH  /api/:resource/:id  -> update
// DELETE /api/:resource/:id  -> delete

export async function GET(
  _req: Request,
  { params }: { params: { resource: string; id: string } },
) {
  const resource = getResource(params.resource);
  if (!resource) return notFound("Unknown resource");
  const record = await resource.model.findUnique({ where: { id: params.id } });
  if (!record) return notFound();
  return ok(record);
}

export async function PATCH(
  req: Request,
  { params }: { params: { resource: string; id: string } },
) {
  const resource = getResource(params.resource);
  if (!resource) return notFound("Unknown resource");

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return bad("Invalid request body");
  }

  const existing = await resource.model.findUnique({ where: { id: params.id } });
  if (!existing) return notFound();

  const data = coerceData(resource, input, true);
  try {
    resource.beforeWrite?.(data, existing);
  } catch (e) {
    return bad((e as Error).message);
  }

  try {
    const updated = await resource.model.update({ where: { id: params.id }, data });
    return ok(updated);
  } catch (e) {
    return bad("Update failed: " + (e as Error).message);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { resource: string; id: string } },
) {
  const resource = getResource(params.resource);
  if (!resource) return notFound("Unknown resource");
  try {
    await resource.model.delete({ where: { id: params.id } });
    return ok({ ok: true });
  } catch (e) {
    return bad("Delete failed: " + (e as Error).message);
  }
}
