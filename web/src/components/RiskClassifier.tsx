"use client";

import { useState } from "react";
import { EnumBadge } from "./Badge";

interface Finding {
  term: string;
  classification: string;
  category: string;
  suggestion: string;
}

interface Result {
  classification: string;
  category: string;
  rationale: string;
  blockedFromExternal: boolean;
  matched: string[];
  findings: Finding[];
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
        <div className="mt-4 space-y-3 rounded-md border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Overall:</span>
            <EnumBadge value={result.classification} field="classification" />
            <span className="text-sm font-medium text-gray-700">{result.category}</span>
            {result.blockedFromExternal && (
              <span className="badge border-red-300 bg-red-100 text-red-700">Blocked from external</span>
            )}
          </div>
          <p className="text-sm text-gray-600">{result.rationale}</p>

          {result.findings.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Level</th>
                    <th className="px-3 py-2 text-left">Detected phrase</th>
                    <th className="px-3 py-2 text-left">Why</th>
                    <th className="px-3 py-2 text-left">Suggested safer language</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.findings.map((f, i) => (
                    <tr key={i} className="align-top">
                      <td className="px-3 py-2">
                        <EnumBadge value={f.classification} field="classification" />
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-800">“{f.term}”</td>
                      <td className="px-3 py-2 text-gray-500">{f.category}</td>
                      <td className="px-3 py-2 text-gray-600">{f.suggestion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
