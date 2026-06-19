import ResourceManager from "@/components/ResourceManager";

export default function ProposalsPage() {
  return (
    <>
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        All external communications require <strong>owner approval</strong>. Nothing is sent
        automatically. Proposals containing BLACK-level confidential content cannot be approved.
      </div>
      <ResourceManager resourceKey="proposals" />
    </>
  );
}
