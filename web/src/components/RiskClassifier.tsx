"use client";

import { useState } from "react";
import { EnumBadge } from "./Badge";

interface Result {
  classification: string;
  category: string;
  rationale: string;
  blockedFromExternal: boolean;
  matched: string[];
}

export default function RiskClassifier() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  async function classify() {
    setSavedMsg("");
    const res = await fetch("/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) setResult(await res.json());
  }

  async function saveReview() {
    if (!result) return;
    setSaving(true);
    const res = await fetch("/api/risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phrase: text,
        classification: result.classification,
        category: result.category,
        rationale: result.rationale,
        blockedFromExternal: result.blockedFromExternal,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedMsg("Saved to risk review log. Refresh the table below to see it.");
      setText("");
      setResult(null);
    }
  }

  return (
    <div className="card mb-6">
      <h2 className="mb-1 text-lg font-semibold">Classify a phrase</h2>
      <p className="mb-3 text-sm text-gray-500">
        Runs locally. Green / Yellow / Red / Black. BLACK is blocked from any external-facing draft.
      </p>
      <textarea
        className="input min-h-[80px]"
        placeholder="Paste a phrase, claim or sentence to review…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <button className="btn-primary" onClick={classify} disabled={!text.trim()}>
          Classify
        </button>
        {result && (
          <button className="btn-secondary" onClick={saveReview} disabled={saving}>
            {saving ? "Saving…" : "Save to log"}
          </button>
        )}
      </div>

      {savedMsg && <div className="mt-3 rounded-md bg-green-50 p-2 text-sm text-green-800">{savedMsg}</div>}

      {result && (
        <div className="mt-4 space-y-2 rounded-md border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <EnumBadge value={result.classification} field="classification" />
            <span className="text-sm font-medium text-gray-700">{result.category}</span>
            {result.blockedFromExternal && (
              <span className="badge border-red-300 bg-red-100 text-red-700">Blocked from external</span>
            )}
          </div>
          <p className="text-sm text-gray-600">{result.rationale}</p>
        </div>
      )}
    </div>
  );
}
