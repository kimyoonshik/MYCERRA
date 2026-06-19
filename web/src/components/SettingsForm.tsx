"use client";

import { useEffect, useState } from "react";

const FIELDS = [
  { key: "orgName", label: "Organisation name", placeholder: "SAVE EARTH Inc." },
  { key: "ownerName", label: "Owner / approver name", placeholder: "Owner" },
  { key: "ownerEmail", label: "Owner email (reference only)", placeholder: "owner@example.com" },
  { key: "defaultCurrency", label: "Default currency", placeholder: "KRW" },
];

export default function SettingsForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setValues)
      .catch(() => {});
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    setMsg(res.ok ? "Saved." : "Save failed.");
  }

  return (
    <form onSubmit={save} className="card max-w-xl space-y-4">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="label">{f.label}</label>
          <input
            className="input"
            placeholder={f.placeholder}
            value={values[f.key] ?? ""}
            onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        {msg && <span className="text-sm text-gray-500">{msg}</span>}
      </div>
    </form>
  );
}
