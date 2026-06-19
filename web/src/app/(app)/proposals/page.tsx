"use client";

import { useState } from "react";
import ResourceManager from "@/components/ResourceManager";
import ProposalGenerator from "@/components/ProposalGenerator";

export default function ProposalsPage() {
  const [reloadSignal, setReloadSignal] = useState(0);

  return (
    <>
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        All external communications require <strong>owner approval</strong>. Nothing is sent
        automatically. Proposals containing BLACK-level confidential content cannot be approved.
      </div>
      <div className="mb-4 flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3">
        <div className="text-sm text-gray-600">
          Generate a first draft from a static template (customer segment, product, offer, CTA).
          Drafts are saved with status <strong>Draft</strong>.
        </div>
        <div className="ml-auto">
          <ProposalGenerator onGenerated={() => setReloadSignal((n) => n + 1)} />
        </div>
      </div>
      <ResourceManager resourceKey="proposals" reloadSignal={reloadSignal} />
    </>
  );
}
