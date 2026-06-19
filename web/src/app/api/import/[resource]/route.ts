export const dynamic = "force-dynamic";

import { bad, notFound, ok } from "@/lib/http";
import { coerceData, getResource } from "@/lib/resources";
import { parseCsv } from "@/lib/csv";

// POST /api/import/:resource  (body: { csv: string })
// Upserts rows by `id` when present, otherwise creates. Business guards in
// `beforeWrite` still apply to every row.

export async function POST(
  req: Request,
  { params }: { params: { resource: string } },
) {
  const resource = getResource(params.resource);
  if (!resource) return notFound("Unknown resource");

  let body: { csv?: string };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request body");
  }
  if (!body.csv) return bad("Missing 'csv' field");

  const rows = parseCsv(body.csv);
  if (rows.length === 0) return bad("CSV contained no data rows");

  const fieldNames = new Set(resource.fields.map((f) => f.name));
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const input: Record<string, unknown> = {};
    for (const key of Object.keys(raw)) {
      if (fieldNames.has(key)) input[key] = raw[key];
    }
    const data = coerceData(resource, input, false);
    try {
      resource.beforeWrite?.(data, null);
    } catch (e) {
      errors.push(`Row ${i + 2}: ${(e as Error).message}`);
      continue;
    }
    try {
      const id = raw.id?.trim();
      if (id) {
        const existing = await resource.model.findUnique({ where: { id } });
        if (existing) {
          await resource.model.update({ where: { id }, data });
          updated++;
          continue;
        }
      }
      await resource.model.create({ data });
      created++;
    } catch (e) {
      errors.push(`Row ${i + 2}: ${(e as Error).message}`);
    }
  }

  return ok({ created, updated, errors });
}
