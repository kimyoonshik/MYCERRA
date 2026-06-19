// Server-side resource registry.
//
// Binds the client-safe metadata (resource-meta.ts) to Prisma delegates plus
// write-time business guards. Used by the generic REST API.

import { prisma } from "./prisma";
import { blackTerms, classifyPhrase } from "./risk";
import { FieldDef, RESOURCE_META, ResourceMeta } from "./resource-meta";

export type { FieldDef } from "./resource-meta";

export interface ResourceDef extends ResourceMeta {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultOrderBy?: any;
  beforeWrite?: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existing?: Record<string, any> | null,
  ) => void | Promise<void>;
}

// Countries treated as domestic (Korea). Anything else counts as overseas.
const DOMESTIC_COUNTRIES = new Set([
  "KR",
  "KOR",
  "ROK",
  "KOREA",
  "SOUTH KOREA",
  "REPUBLIC OF KOREA",
  "대한민국",
  "한국",
]);

function isOverseas(country: unknown): boolean {
  const c = String(country ?? "").trim();
  return c !== "" && !DOMESTIC_COUNTRIES.has(c.toUpperCase());
}

type ServerConfig = Pick<ResourceDef, "model" | "defaultOrderBy" | "beforeWrite">;

const SERVER_CONFIG: Record<string, ServerConfig> = {
  products: {
    model: prisma.product,
    defaultOrderBy: { code: "asc" },
  },
  offers: {
    model: prisma.offer,
    defaultOrderBy: { code: "asc" },
  },
  leads: {
    model: prisma.lead,
    defaultOrderBy: { updatedAt: "desc" },
  },
  samples: {
    model: prisma.sampleRequest,
    defaultOrderBy: { createdAt: "desc" },
    async beforeWrite(data, existing) {
      const isCreate = !existing;

      // Is the requested product Pure Mat? Pure Mat always requires NDA + owner
      // approval, regardless of what the operator entered.
      const productId = data.productId ?? existing?.productId;
      let isPureMat = false;
      if (productId) {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (product && (product.code === "PROD-PURE-MAT" || /pure\s*mat/i.test(product.name))) {
          isPureMat = true;
        }
      }

      // Overseas defaults (applied only on create, only when not explicitly set):
      // paid sample + customer-paid shipping.
      const country = data.destinationCountry ?? existing?.destinationCountry;
      if (isCreate && isOverseas(country)) {
        if (!("paidSample" in data)) data.paidSample = true;
        if (!("customerPaidShipping" in data)) data.customerPaidShipping = true;
      }

      // Pure Mat enforcement: NDA required, never NOT_REQUIRED, and approval is
      // always owner-gated.
      if (isPureMat) {
        data.ndaRequired = true;
        const ndaStatus = data.ndaStatus ?? existing?.ndaStatus ?? "NOT_REQUIRED";
        if (ndaStatus === "NOT_REQUIRED") data.ndaStatus = "PENDING";
        if (isCreate && !("approvalStatus" in data)) data.approvalStatus = "OWNER_APPROVAL_REQUIRED";
      }

      // Resolve effective values for the gating checks below.
      const ndaRequired = data.ndaRequired ?? existing?.ndaRequired ?? false;
      const ndaStatus = data.ndaStatus ?? existing?.ndaStatus ?? "NOT_REQUIRED";
      const approvalStatus = data.approvalStatus ?? existing?.approvalStatus ?? "PENDING";
      const ownerApproved = data.ownerApproved ?? existing?.ownerApproved ?? false;
      const shippingStatus = data.shippingStatus ?? existing?.shippingStatus ?? "NOT_SHIPPED";

      // 1) Never auto-approve: APPROVED requires explicit owner approval.
      if (approvalStatus === "APPROVED" && ownerApproved !== true) {
        throw new Error(
          "Sample request can only be APPROVED after explicit owner approval (set 'Owner approved' first).",
        );
      }

      // 2) NDA gate: if an NDA is required it must be SIGNED before approval.
      if (approvalStatus === "APPROVED" && ndaRequired && ndaStatus !== "SIGNED") {
        throw new Error(
          "This request requires a signed NDA before it can be approved." +
            (isPureMat ? " (Pure Mat always requires a signed NDA and owner approval.)" : ""),
        );
      }

      // 3) Fulfilment gate: cannot ship/deliver before the request is APPROVED.
      if ((shippingStatus === "SHIPPED" || shippingStatus === "DELIVERED") && approvalStatus !== "APPROVED") {
        throw new Error("Sample cannot be shipped before the request is APPROVED.");
      }
    },
  },
  proposals: {
    model: prisma.proposal,
    defaultOrderBy: { updatedAt: "desc" },
    beforeWrite(data, existing) {
      const content = data.content ?? existing?.content;
      if (content === undefined || content === null) return;

      const result = classifyPhrase(String(content));
      data.riskChecked = true;

      // Block BLACK-level proposals from being approved / sent / accepted.
      const status = data.status ?? existing?.status;
      const approving =
        data.ownerApproved === true || ["APPROVED", "SENT", "ACCEPTED"].includes(status);
      if (result.blockedFromExternal && approving) {
        const terms = blackTerms(String(content));
        throw new Error(
          "This proposal contains BLACK-level confidential information and cannot be approved for external use. " +
            `Remove these phrases first: ${terms.join(", ")}.`,
        );
      }
    },
  },
  content: {
    model: prisma.contentDraft,
    defaultOrderBy: { updatedAt: "desc" },
    beforeWrite(data, existing) {
      const body = data.body ?? existing?.body;
      if (body !== undefined && body !== null) {
        const result = classifyPhrase(String(body));
        data.riskLevel = result.classification;
        data.riskChecked = true;
      }
      const effectiveRisk = data.riskLevel ?? existing?.riskLevel;
      const status = data.status ?? existing?.status;

      // Block BLACK-level drafts from being approved or published.
      const approving =
        data.ownerApproved === true || ["APPROVED", "PUBLISHED_MANUAL"].includes(status);
      if (effectiveRisk === "BLACK" && approving) {
        const terms = body != null ? blackTerms(String(body)) : [];
        throw new Error(
          "BLACK-level content is blocked from external-facing use and cannot be approved. " +
            (terms.length ? `Remove these phrases first: ${terms.join(", ")}.` : "Remove the confidential phrases first."),
        );
      }
      if (
        data.status === "PUBLISHED_MANUAL" &&
        (data.ownerApproved ?? existing?.ownerApproved) !== true
      ) {
        throw new Error("Content can only be marked published after explicit owner approval.");
      }
    },
  },
  risk: {
    model: prisma.riskReview,
    defaultOrderBy: { createdAt: "desc" },
    beforeWrite(data) {
      if (data.classification === "BLACK") data.blockedFromExternal = true;
    },
  },
  wadiz: {
    model: prisma.wadizItem,
    defaultOrderBy: { createdAt: "desc" },
  },
};

export const RESOURCES: Record<string, ResourceDef> = Object.fromEntries(
  Object.entries(RESOURCE_META).map(([key, meta]) => [key, { ...meta, ...SERVER_CONFIG[key] }]),
);

export function getResource(key: string): ResourceDef | undefined {
  return RESOURCES[key];
}

// Coerce raw (string-ish) input into the correct types for Prisma writes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function coerceData(resource: ResourceDef, input: Record<string, any>, partial: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: Record<string, any> = {};
  for (const field of resource.fields as FieldDef[]) {
    // Computed fields (riskLevel/riskChecked) are set by beforeWrite, others
    // marked readOnly are never accepted from the client.
    if (field.readOnly) continue;
    if (!(field.name in input)) continue;

    let value = input[field.name];
    if (value === "" || value === undefined) value = null;
    if (value === null) {
      out[field.name] = null;
      continue;
    }
    switch (field.type) {
      case "int":
        out[field.name] = parseInt(String(value), 10);
        if (Number.isNaN(out[field.name])) out[field.name] = null;
        break;
      case "decimal":
        out[field.name] = String(value);
        break;
      case "bool":
        out[field.name] = value === true || value === "true" || value === "on" || value === "1";
        break;
      case "date":
      case "datetime":
        out[field.name] = new Date(value);
        if (Number.isNaN((out[field.name] as Date).getTime())) out[field.name] = null;
        break;
      default:
        out[field.name] = value;
    }
  }
  void partial;
  return out;
}
