"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FieldDef, getMeta } from "@/lib/resource-meta";
import { EnumBadge } from "./Badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const RELATION_LABEL_FIELDS = ["name", "company", "title", "code"];

function relationLabel(row: Row): string {
  for (const f of RELATION_LABEL_FIELDS) {
    if (row[f]) return `${row[f]}`;
  }
  return row.id;
}

export default function ResourceManager({
  resourceKey,
  reloadSignal,
}: {
  resourceKey: string;
  reloadSignal?: number;
}) {
  const meta = getMeta(resourceKey)!;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [relations, setRelations] = useState<Record<string, Row[]>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/${resourceKey}${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    if (res.ok) {
      setRows(await res.json());
    } else {
      setError("Failed to load records.");
    }
    setLoading(false);
  }, [resourceKey, q]);

  useEffect(() => {
    load();
  }, [load, reloadSignal]);

  // Preload relation option lists for any relation fields.
  useEffect(() => {
    const relKeys = Array.from(
      new Set(meta.fields.filter((f) => f.type === "relation").map((f) => f.relation!)),
    );
    relKeys.forEach(async (key) => {
      const res = await fetch(`/api/${key}`);
      if (res.ok) {
        const data = await res.json();
        setRelations((prev) => ({ ...prev, [key]: data }));
      }
    });
  }, [meta]);

  const listFields = useMemo(() => meta.fields.filter((f) => f.listVisible), [meta]);

  async function remove(id: string) {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    const res = await fetch(`/api/${resourceKey}/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Delete failed.");
  }

  async function importCsv(file: File) {
    setImportMsg("");
    const csv = await file.text();
    const res = await fetch(`/api/import/${resourceKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    if (res.ok) {
      setImportMsg(
        `Imported: ${data.created} created, ${data.updated} updated` +
          (data.errors?.length ? `, ${data.errors.length} error(s): ${data.errors.join(" | ")}` : ""),
      );
      load();
    } else {
      setImportMsg(data.error || "Import failed.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{meta.label}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input w-48"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <a className="btn-secondary" href={`/api/export/${resourceKey}`}>
            Export CSV
          </a>
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
            Import CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCsv(f);
              e.target.value = "";
            }}
          />
          <button className="btn-primary" onClick={() => setCreating(true)}>
            + New
          </button>
        </div>
      </div>

      {importMsg && <div className="mb-3 rounded-md bg-blue-50 p-2 text-sm text-blue-800">{importMsg}</div>}
      {error && <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {listFields.map((f) => (
                <th
                  key={f.name}
                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td className="table-cell text-gray-400" colSpan={listFields.length + 1}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="table-cell text-gray-400" colSpan={listFields.length + 1}>
                  No records yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {listFields.map((f) => (
                    <td key={f.name} className="table-cell">
                      <CellValue field={f} value={row[f.name]} />
                    </td>
                  ))}
                  <td className="table-cell text-right">
                    <button className="mr-2 text-brand hover:underline" onClick={() => setEditing(row)}>
                      Edit
                    </button>
                    <button className="text-red-600 hover:underline" onClick={() => remove(row.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <RecordForm
          meta={meta}
          relations={relations}
          record={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
          resourceKey={resourceKey}
        />
      )}
    </div>
  );
}

function CellValue({ field, value }: { field: FieldDef; value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="text-gray-400">—</span>;
  if (field.type === "bool") {
    return value ? (
      <span className="font-semibold text-green-700">✓</span>
    ) : (
      <span className="text-gray-400">—</span>
    );
  }
  if (field.type === "enum") {
    return <EnumBadge value={String(value)} field={field.name} />;
  }
  if (field.type === "date" || field.type === "datetime") {
    return <span>{new Date(value as string).toLocaleDateString()}</span>;
  }
  const text = String(value);
  return <span title={text}>{text.length > 60 ? text.slice(0, 60) + "…" : text}</span>;
}

function RecordForm({
  meta,
  record,
  relations,
  resourceKey,
  onClose,
  onSaved,
}: {
  meta: ReturnType<typeof getMeta> & object;
  record: Row | null;
  relations: Record<string, Row[]>;
  resourceKey: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editableFields = meta.fields.filter((f) => !f.readOnly);
  const [form, setForm] = useState<Row>(() => {
    const init: Row = {};
    for (const f of meta.fields) {
      let v = record ? record[f.name] : undefined;
      if (f.type === "date" && v) v = String(v).slice(0, 10);
      init[f.name] = v ?? (f.type === "bool" ? false : "");
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(name: string, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload: Row = {};
    for (const f of editableFields) payload[f.name] = form[f.name];
    const res = await fetch(record ? `/api/${resourceKey}/${record.id}` : `/api/${resourceKey}`, {
      method: record ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Save failed.");
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={submit} className="my-8 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {record ? "Edit" : "New"} {meta.label.replace(/s$/, "")}
          </h2>
          <button type="button" className="text-gray-400 hover:text-gray-700" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {editableFields.map((f) => (
            <div key={f.name} className={f.type === "text" ? "sm:col-span-2" : ""}>
              <label className="label">
                {f.label}
                {f.required && <span className="text-red-500"> *</span>}
              </label>
              <FieldInput field={f} value={form[f.name]} relations={relations} onChange={(v) => set(f.name, v)} />
              {f.help && <p className="mt-1 text-xs text-gray-400">{f.help}</p>}
            </div>
          ))}
        </div>

        {error && <div className="mt-4 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldInput({
  field,
  value,
  relations,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  relations: Record<string, Row[]>;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "bool") {
    return (
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span className="text-sm text-gray-600">Yes</span>
      </label>
    );
  }
  if (field.type === "text") {
    return (
      <textarea
        className="input min-h-[80px]"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (field.type === "enum") {
    return (
      <select className="input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
        {!field.required && <option value="">—</option>}
        {field.options?.map((o) => (
          <option key={o} value={o}>
            {o.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "relation") {
    const options = relations[field.relation!] ?? [];
    return (
      <select className="input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {relationLabel(o)}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      className="input"
      type={field.type === "int" || field.type === "decimal" ? "number" : field.type === "date" ? "date" : "text"}
      step={field.type === "decimal" ? "0.01" : undefined}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
