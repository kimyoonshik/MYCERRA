import SettingsForm from "@/components/SettingsForm";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Settings</h1>
      <p className="mb-6 text-sm text-gray-500">
        Organisation details for this local-first workspace. These are stored locally and never
        transmitted.
      </p>

      <SettingsForm />

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-2 text-lg font-semibold">Fixed policy (not configurable)</h2>
        <p className="mb-2 text-sm text-gray-500">
          These guardrails are enforced in code and cannot be toggled off.
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>No automatic email sending.</li>
          <li>No automatic content publishing.</li>
          <li>No automatic sample-request approval.</li>
          <li>All external communications require owner approval.</li>
          <li>
            Confidential domains (Pure Mat, licensing, production conditions, strains, substrates,
            detailed SOP, production cost, failure data) are protected.
          </li>
          <li>Risk levels: Green / Yellow / Red / Black. BLACK is blocked from external drafts.</li>
          <li>No external API calls or live integrations in this version.</li>
        </ul>
      </div>
    </div>
  );
}
