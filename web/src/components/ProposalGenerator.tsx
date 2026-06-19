"use client";

import { useEffect, useMemo, useState } from "react";
import { PROPOSAL_TEMPLATES, getTemplate } from "@/lib/proposal-templates";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const SEGMENTS = [
  "Fashion brand",
  "Material distributor",
  "Manufacturer",
  "Retailer",
  "Accessories brand",
  "Footwear brand",
];

export default function ProposalGenerator({ onGenerated }: { onGenerated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Row[]>([]);
  const [offers, setOffers] = useState<Row[]>([]);
  const [templateId, setTemplateId] = useState(PROPOSAL_TEMPLATES[0].id);
  const [segment, setSegment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactName, setContactName] = useState("");
  const [productId, setProductId] = useState("");
  const [offerId, setOfferId] = useState("");
  const [cta, setCta] = useState("");
  const [senderName, setSenderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(() => {});
    fetch("/api/offers").then((r) => r.json()).then(setOffers).catch(() => {});
  }, [open]);

  const template = getTemplate(templateId)!;

  // Live preview (rendered client-side; the server re-renders authoritatively).
  const preview = useMemo(() => {
    return template.render({
      segment,
      customerName,
      contactName,
      productName: products.find((p) => p.id === productId)?.name,
      offerName: offers.find((o) => o.id === offerId)?.name,
      cta,
      senderName,
    });
  }, [template, segment, customerName, contactName, productId, offerId, cta, products, offers, senderName]);

  function reset() {
    setSegment("");
    setCustomerName("");
    setContactName("");
    setProductId("");
    setOfferId("");
    setCta("");
    setSenderName("");
    setError("");
  }

  async function generate() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/generate-proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId,
        segment,
        customerName,
        contactName,
        productId,
        offerId,
        cta,
        senderName,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      reset();
      onGenerated?.();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Generation failed.");
    }
  }

  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        ✨ Generate draft
      </button>

      {open && (
        <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Generate proposal draft</h2>
              <button className="text-gray-400 hover:text-gray-700" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="label">Template</label>
                  <select
                    className="input"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                  >
                    {PROPOSAL_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-400">{template.description}</p>
                </div>

                <div>
                  <label className="label">Customer segment</label>
                  <input
                    className="input"
                    list="segment-options"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    placeholder="e.g. Fashion brand"
                  />
                  <datalist id="segment-options">
                    {SEGMENTS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Customer name</label>
                    <input
                      className="input"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Company"
                    />
                  </div>
                  <div>
                    <label className="label">Contact name</label>
                    <input
                      className="input"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Person"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Interested product</label>
                  <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
                    <option value="">— (use generic wording)</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Offer</label>
                  <select className="input" value={offerId} onChange={(e) => setOfferId(e.target.value)}>
                    <option value="">— (use template default)</option>
                    {offers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Call to action (CTA)</label>
                  <input
                    className="input"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder={template.defaultCta}
                  />
                </div>

                <div>
                  <label className="label">Sender name</label>
                  <input
                    className="input"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="The MYCERRA Team"
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="label">Preview</label>
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 text-sm font-semibold text-gray-800">{preview.title}</div>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">{preview.content}</pre>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Saved as <strong>Draft</strong> · not approved · not sent. Edit and run risk review
                  before any external use.
                </p>
              </div>
            </div>

            {error && <div className="mt-4 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>}

            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={generate} disabled={saving}>
                {saving ? "Saving…" : "Save as draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
