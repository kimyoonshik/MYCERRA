export const dynamic = "force-dynamic";

import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard -> summary counts for the dashboard cards.

export async function GET() {
  const [
    products,
    confidentialProducts,
    offers,
    leads,
    leadsByStage,
    samplesTotal,
    samplesPendingApproval,
    proposalsTotal,
    proposalsAwaitingApproval,
    contentTotal,
    contentBlack,
    contentAwaitingApproval,
    riskTotal,
    riskBlocked,
    wadizTotal,
    wadizOpen,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { confidential: true } }),
    prisma.offer.count(),
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["stage"], _count: true }),
    prisma.sampleRequest.count(),
    prisma.sampleRequest.count({
      where: { ownerApproved: false, status: { in: ["REQUESTED", "UNDER_REVIEW"] } },
    }),
    prisma.proposal.count(),
    prisma.proposal.count({ where: { ownerApproved: false } }),
    prisma.contentDraft.count(),
    prisma.contentDraft.count({ where: { riskLevel: "BLACK" } }),
    prisma.contentDraft.count({ where: { ownerApproved: false } }),
    prisma.riskReview.count(),
    prisma.riskReview.count({ where: { blockedFromExternal: true } }),
    prisma.wadizItem.count(),
    prisma.wadizItem.count({ where: { status: { notIn: ["DONE"] } } }),
  ]);

  return ok({
    products: { total: products, confidential: confidentialProducts },
    offers: { total: offers },
    leads: { total: leads, byStage: leadsByStage },
    samples: { total: samplesTotal, pendingApproval: samplesPendingApproval },
    proposals: { total: proposalsTotal, awaitingApproval: proposalsAwaitingApproval },
    content: { total: contentTotal, black: contentBlack, awaitingApproval: contentAwaitingApproval },
    risk: { total: riskTotal, blocked: riskBlocked },
    wadiz: { total: wadizTotal, open: wadizOpen },
  });
}
