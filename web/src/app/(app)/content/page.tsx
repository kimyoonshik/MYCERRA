import ResourceManager from "@/components/ResourceManager";

export default function ContentPage() {
  return (
    <>
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        The app <strong>never auto-publishes</strong>. Each draft is risk-classified on save;
        <strong> BLACK-level</strong> content is blocked from approval. Publishing is manual and
        requires <strong>owner approval</strong>.
      </div>
      <ResourceManager resourceKey="content" />
    </>
  );
}
