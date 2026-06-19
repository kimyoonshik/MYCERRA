import ResourceManager from "@/components/ResourceManager";

export default function SamplesPage() {
  return (
    <>
      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Sample requests are <strong>never auto-approved</strong>. Approval requires{" "}
        <strong>Owner approved</strong> (and a signed NDA when one is required); a sample cannot ship
        before it is approved. <strong>Pure Mat</strong> requests always force NDA + owner approval,
        and <strong>overseas</strong> requests default to a paid sample with customer-paid shipping.
      </div>
      <ResourceManager resourceKey="samples" />
    </>
  );
}
