export const dynamic = "force-dynamic";

import { bad, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { classifyPhrase } from "@/lib/risk";
import { PROPOSAL_TEMPLATE_META, getTemplate } from "@/lib/proposal-templates";

// GET  /api/generate-proposal -> list available templates
// POST /api/generate-proposal -> render a template and save a DRAFT proposal
//
// Body: { templateId, segment?, customerName?, contactName?, productId?,
//         offerId?, cta?, senderName? }
// The product/offer names are resolved server-side from their ids so the saved
// draft is authoritative. Generated drafts are always status = DRAFT and never
// owner-approved.

export async function GET() {
  return ok(PROPOSAL_TEMPLATE_META);
}

export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request body");
  }

  const template = getTemplate(body.templateId);
  if (!template) return bad("Unknown templateId");

  // Resolve names from ids (if provided).
  let productName: string | undefined;
  let offerId: string | null = null;
  let offerName: string | undefined;

  if (body.productId) {
    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    productName = product?.name;
  }
  if (body.offerId) {
    const offer = await prisma.offer.findUnique({ where: { id: body.offerId } });
    if (offer) {
      offerId = offer.id;
      offerName = offer.name;
    }
  }

  const { title, content } = template.render({
    segment: body.segment,
    customerName: body.customerName,
    contactName: body.contactName,
    productName,
    offerName,
    cta: body.cta,
    senderName: body.senderName,
  });

  // Run the local risk check (drafts are not blocked, but we record the result).
  const risk = classifyPhrase(content);

  const created = await prisma.proposal.create({
    data: {
      title,
      content,
      type: template.proposalType as never,
      offerId,
      status: "DRAFT", // generated drafts are always Draft …
      ownerApproved: false, // … and never auto-approved
      riskChecked: true,
    },
  });

  return ok({ proposal: created, risk }, { status: 201 });
}
