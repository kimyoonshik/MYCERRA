import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Card {
  label: string;
  value: number;
  href: string;
  hint?: string;
  tone?: "default" | "warn" | "danger";
}

async function getSummary() {
  const [
    products,
    confidential,
    offers,
    leads,
    samples,
    samplesPending,
    proposals,
    proposalsPending,
    content,
    contentBlack,
    risk,
    riskBlocked,
    wadiz,
    wadizOpen,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { confidential: true } }),
    prisma.offer.count(),
    prisma.lead.count(),
    prisma.sampleRequest.count(),
    prisma.sampleRequest.count({
      where: { approvalStatus: { in: ["PENDING", "OWNER_APPROVAL_REQUIRED"] } },
    }),
    prisma.proposal.count(),
    prisma.proposal.count({ where: { ownerApproved: false } }),
    prisma.contentDraft.count(),
    prisma.contentDraft.count({ where: { riskLevel: "BLACK" } }),
    prisma.riskReview.count(),
    prisma.riskReview.count({ where: { blockedFromExternal: true } }),
    prisma.wadizItem.count(),
    prisma.wadizItem.count({ where: { status: { notIn: ["DONE"] } } }),
  ]);
  return {
    products,
    confidential,
    offers,
    leads,
    samples,
    samplesPending,
    proposals,
    proposalsPending,
    content,
    contentBlack,
    risk,
    riskBlocked,
    wadiz,
    wadizOpen,
  };
}

export default async function DashboardPage() {
  let s;
  try {
    s = await getSummary();
  } catch {
    return (
      <div className="card text-sm text-red-700">
        Could not reach the database. Make sure PostgreSQL is running and{" "}
        <code>npx prisma migrate dev</code> + <code>npm run seed</code> have been run. See the README.
      </div>
    );
  }

  const cards: Card[] = [
    { label: "Products", value: s.products, href: "/products", hint: `${s.confidential} confidential` },
    { label: "Offers", value: s.offers, href: "/offers" },
    { label: "Leads / Customers", value: s.leads, href: "/leads" },
    {
      label: "Sample Requests",
      value: s.samples,
      href: "/samples",
      hint: `${s.samplesPending} awaiting owner approval`,
      tone: s.samplesPending > 0 ? "warn" : "default",
    },
    {
      label: "Proposals",
      value: s.proposals,
      href: "/proposals",
      hint: `${s.proposalsPending} not yet approved`,
      tone: s.proposalsPending > 0 ? "warn" : "default",
    },
    {
      label: "Content Drafts",
      value: s.content,
      href: "/content",
      hint: `${s.contentBlack} BLACK-level (blocked)`,
      tone: s.contentBlack > 0 ? "danger" : "default",
    },
    {
      label: "Risk Reviews",
      value: s.risk,
      href: "/risk",
      hint: `${s.riskBlocked} blocked from external`,
      tone: s.riskBlocked > 0 ? "danger" : "default",
    },
    {
      label: "Wadiz Tasks",
      value: s.wadiz,
      href: "/wadiz",
      hint: `${s.wadizOpen} open`,
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Dashboard</h1>
      <p className="mb-6 text-sm text-gray-500">
        MYCERRA Agent OS · local-first internal command center. No email is sent and nothing is
        published automatically.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`card transition-shadow hover:shadow-md ${
              c.tone === "danger"
                ? "border-red-200"
                : c.tone === "warn"
                  ? "border-amber-200"
                  : ""
            }`}
          >
            <div className="text-sm font-medium text-gray-500">{c.label}</div>
            <div className="mt-1 text-3xl font-bold text-gray-900">{c.value}</div>
            {c.hint && (
              <div
                className={`mt-2 text-xs ${
                  c.tone === "danger"
                    ? "text-red-600"
                    : c.tone === "warn"
                      ? "text-amber-600"
                      : "text-gray-400"
                }`}
              >
                {c.hint}
              </div>
            )}
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-2 text-lg font-semibold">Operating guardrails</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>The app does not automatically send emails.</li>
          <li>The app does not automatically publish content.</li>
          <li>The app does not automatically approve sample requests.</li>
          <li>All external communications require owner approval.</li>
          <li>
            Pure Mat, licensing, production conditions, strains, substrates, detailed SOP, production
            cost and failure data are confidential.
          </li>
          <li>BLACK-level information is blocked from external-facing drafts.</li>
        </ul>
      </div>
    </div>
  );
}
