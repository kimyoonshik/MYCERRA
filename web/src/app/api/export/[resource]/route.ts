export const dynamic = "force-dynamic";

import { notFound } from "@/lib/http";
import { getResource } from "@/lib/resources";
import { toCsv } from "@/lib/csv";

// GET /api/export/:resource -> CSV download of all records.

export async function GET(
  _req: Request,
  { params }: { params: { resource: string } },
) {
  const resource = getResource(params.resource);
  if (!resource) return notFound("Unknown resource");

  const records = await resource.model.findMany({ orderBy: resource.defaultOrderBy });
  const columns = ["id", ...resource.fields.map((f) => f.name), "createdAt", "updatedAt"];
  const csv = toCsv(records, columns);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${resource.key}.csv"`,
    },
  });
}
