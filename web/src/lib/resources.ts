// Server-side resource registry.
//
// Binds the client-safe metadata (resource-meta.ts) to Prisma delegates plus
// write-time business guards. Used by the generic REST API.

import { prisma } from "./prisma";
import { classifyPhrase } from "./risk";
import { FieldDef, RESOURCE_META, ResourceMeta } from "./resource-meta";

export type { FieldDef } from "./resource-meta";

export interface ResourceDef extends ResourceMeta {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultOrderBy?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeWrite?: (data: Record<string, any>, existing?: Record<string, any> | null) => void;
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
    beforeWrite(data) {
      // Enforce manual approval: a request may only be approved/shipped once
      // the owner has explicitly set ownerApproved. Never auto-approve.
      const status = data.status;
      if (
        (status === "APPROVED_PENDING_SHIPMENT" || status === "SHIPPED") &&
        data.ownerApproved !== true
      ) {
        throw new Error(
          "Sample request cannot be approved/shipped without explicit owner approval (set 'Owner approved' first).",
        );
      }
    },
  },
  proposals: {
    model: prisma.proposal,
    defaultOrderBy: { updatedAt: "desc" },
    beforeWrite(data, existing) {
      const content = data.content ?? existing?.content;
      if (content !== undefined && content !== null) {
        const result = classifyPhrase(String(content));
        data.riskChecked = true;
        if (result.blockedFromExternal && data.ownerApproved === true) {
          throw new Error(
            "This proposal contains BLACK-level confidential information and cannot be approved for external use. Remove the confidential phrases first.",
          );
        }
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
      if (effectiveRisk === "BLACK" && data.ownerApproved === true) {
        throw new Error(
          "BLACK-level content is blocked from external-facing use and cannot be approved. Remove the confidential phrases first.",
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
