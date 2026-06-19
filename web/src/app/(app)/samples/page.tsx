import ResourceManager from "@/components/ResourceManager";

export default function SamplesPage() {
  return (
    <>
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Sample requests are <strong>never auto-approved</strong>. A request can only move to
        “approved / shipped” after you set <strong>Owner approved</strong> manually.
      </div>
      <ResourceManager resourceKey="samples" />
    </>
  );
}
