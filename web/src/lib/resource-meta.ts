// Client-safe resource metadata.
//
// Field definitions, labels and enum option lists live here with NO server-only
// imports (no Prisma). Both the server registry (resources.ts) and the client UI
// import this single source of truth.

export type FieldType =
  | "string"
  | "text"
  | "int"
  | "decimal"
  | "bool"
  | "date"
  | "datetime"
  | "enum"
  | "relation";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  relation?: string; // resource key, for relation selects
  required?: boolean;
  readOnly?: boolean; // computed server-side; not user editable
  listVisible?: boolean; // show in the table view
  help?: string;
}

export interface ResourceMeta {
  key: string;
  label: string;
  fields: FieldDef[];
}

export const PRODUCT_STATUS = ["ACTIVE", "DRAFT", "ARCHIVED"];
export const OFFER_STATUS = ["ACTIVE", "DRAFT", "PAUSED", "ARCHIVED"];
export const LEAD_STAGE = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
export const NDA_STATUS = ["NOT_REQUIRED", "PENDING", "SENT", "SIGNED"];
export const SAMPLE_APPROVAL_STATUS = ["PENDING", "OWNER_APPROVAL_REQUIRED", "APPROVED", "REJECTED"];
export const SAMPLE_SHIPPING_STATUS = ["NOT_SHIPPED", "PREPARING", "SHIPPED", "DELIVERED"];
export const PROPOSAL_TYPE = [
  "SAMPLE_REVIEW",
  "SAMPLE_BOOK",
  "PAID_POC",
  "WADIZ_REWARD",
  "GLOBAL_SAMPLE",
  "CONSULTING",
  "LICENSING",
  "OTHER",
];
export const PROPOSAL_STATUS = [
  "DRAFT",
  "INTERNAL_REVIEW",
  "OWNER_APPROVAL_REQUIRED",
  "APPROVED",
  "SENT",
  "ACCEPTED",
  "DECLINED",
];
export const CONTENT_CHANNEL = ["WADIZ", "BLOG", "SNS", "EMAIL", "PRESS", "WEBSITE", "OTHER"];
export const CONTENT_STATUS = [
  "DRAFT",
  "IN_REVIEW",
  "OWNER_APPROVAL_REQUIRED",
  "APPROVED",
  "PUBLISHED_MANUAL",
  "ARCHIVED",
];
export const RISK_LEVEL = ["GREEN", "YELLOW", "RED", "BLACK"];
export const WADIZ_STATUS = ["BACKLOG", "IN_PROGRESS", "REVIEW", "READY", "DONE"];

export const RESOURCE_META: Record<string, ResourceMeta> = {
  products: {
    key: "products",
    label: "Products",
    fields: [
      { name: "code", label: "Code", type: "string", required: true, listVisible: true },
      { name: "name", label: "Name", type: "string", required: true, listVisible: true },
      { name: "category", label: "Category", type: "string", listVisible: true },
      { name: "description", label: "Description", type: "text" },
      { name: "status", label: "Status", type: "enum", options: PRODUCT_STATUS, listVisible: true },
      {
        name: "confidential",
        label: "Confidential",
        type: "bool",
        listVisible: true,
        help: "Pure Mat / licensing / production-condition records. Never place verbatim in external drafts.",
      },
      { name: "priceNote", label: "Price note", type: "string" },
    ],
  },

  offers: {
    key: "offers",
    label: "Offers",
    fields: [
      { name: "code", label: "Code", type: "string", required: true, listVisible: true },
      { name: "name", label: "Name", type: "string", required: true, listVisible: true },
      { name: "type", label: "Type", type: "string", listVisible: true },
      { name: "description", label: "Description", type: "text" },
      { name: "priceModel", label: "Price model", type: "string", listVisible: true },
      { name: "status", label: "Status", type: "enum", options: OFFER_STATUS, listVisible: true },
      { name: "productId", label: "Linked product", type: "relation", relation: "products" },
    ],
  },

  leads: {
    key: "leads",
    label: "Leads / Customers",
    fields: [
      { name: "company", label: "Company", type: "string", required: true, listVisible: true },
      { name: "contactName", label: "Contact", type: "string", listVisible: true },
      { name: "email", label: "Email", type: "string", listVisible: true },
      { name: "phone", label: "Phone", type: "string" },
      { name: "country", label: "Country", type: "string", listVisible: true },
      { name: "segment", label: "Segment", type: "string" },
      { name: "source", label: "Source", type: "string" },
      { name: "stage", label: "Stage", type: "enum", options: LEAD_STAGE, listVisible: true },
      { name: "notes", label: "Notes", type: "text" },
    ],
  },

  samples: {
    key: "samples",
    label: "Sample Requests",
    fields: [
      { name: "company", label: "Customer", type: "string", listVisible: true },
      { name: "contactName", label: "Contact", type: "string" },
      { name: "leadId", label: "Linked customer", type: "relation", relation: "leads" },
      {
        name: "productId",
        label: "Requested product",
        type: "relation",
        relation: "products",
        help: "Pure Mat requests always require NDA + owner approval (enforced automatically).",
      },
      { name: "offerId", label: "Linked offer", type: "relation", relation: "offers" },
      { name: "sampleType", label: "Sample type", type: "string", listVisible: true },
      { name: "intendedUse", label: "Intended use", type: "text" },
      {
        name: "destinationCountry",
        label: "Destination country",
        type: "string",
        listVisible: true,
        help: "Overseas (non-Korea) requests default to a paid sample with customer-paid shipping.",
      },
      { name: "quantity", label: "Qty", type: "int" },
      { name: "shippingAddress", label: "Shipping address", type: "text" },
      { name: "ndaRequired", label: "NDA required", type: "bool", listVisible: true },
      { name: "ndaStatus", label: "NDA status", type: "enum", options: NDA_STATUS, listVisible: true },
      { name: "quotedPrice", label: "Quoted price", type: "decimal", listVisible: true },
      { name: "shippingCost", label: "Shipping cost", type: "decimal" },
      { name: "paidSample", label: "Paid sample", type: "bool" },
      { name: "customerPaidShipping", label: "Customer pays shipping", type: "bool" },
      {
        name: "ownerApproved",
        label: "Owner approved",
        type: "bool",
        listVisible: true,
        help: "Sample requests are NEVER auto-approved. The owner must approve manually.",
      },
      {
        name: "approvalStatus",
        label: "Approval status",
        type: "enum",
        options: SAMPLE_APPROVAL_STATUS,
        listVisible: true,
      },
      {
        name: "shippingStatus",
        label: "Shipping status",
        type: "enum",
        options: SAMPLE_SHIPPING_STATUS,
        listVisible: true,
      },
      { name: "followUpDate", label: "Follow-up date", type: "date", listVisible: true },
      { name: "notes", label: "Notes", type: "text" },
    ],
  },

  proposals: {
    key: "proposals",
    label: "Proposals",
    fields: [
      { name: "title", label: "Title", type: "string", required: true, listVisible: true },
      { name: "leadId", label: "Linked lead", type: "relation", relation: "leads" },
      { name: "offerId", label: "Linked offer", type: "relation", relation: "offers" },
      { name: "type", label: "Type", type: "enum", options: PROPOSAL_TYPE, listVisible: true },
      { name: "amount", label: "Amount", type: "decimal", listVisible: true },
      { name: "currency", label: "Currency", type: "string" },
      { name: "status", label: "Status", type: "enum", options: PROPOSAL_STATUS, listVisible: true },
      { name: "content", label: "Content", type: "text" },
      { name: "riskChecked", label: "Risk checked", type: "bool", readOnly: true, listVisible: true },
      {
        name: "ownerApproved",
        label: "Owner approved",
        type: "bool",
        listVisible: true,
        help: "All external communications require owner approval. Nothing is sent automatically.",
      },
    ],
  },

  content: {
    key: "content",
    label: "Content Board",
    fields: [
      { name: "title", label: "Title", type: "string", required: true, listVisible: true },
      { name: "channel", label: "Channel", type: "enum", options: CONTENT_CHANNEL, listVisible: true },
      { name: "body", label: "Body", type: "text" },
      { name: "status", label: "Status", type: "enum", options: CONTENT_STATUS, listVisible: true },
      {
        name: "riskLevel",
        label: "Risk level",
        type: "enum",
        options: RISK_LEVEL,
        readOnly: true,
        listVisible: true,
      },
      { name: "riskChecked", label: "Risk checked", type: "bool", readOnly: true },
      {
        name: "ownerApproved",
        label: "Owner approved",
        type: "bool",
        listVisible: true,
        help: "The app never auto-publishes. Publishing is manual and requires owner approval.",
      },
    ],
  },

  risk: {
    key: "risk",
    label: "Risk Review",
    fields: [
      { name: "phrase", label: "Phrase / text", type: "text", required: true, listVisible: true },
      {
        name: "classification",
        label: "Classification",
        type: "enum",
        options: RISK_LEVEL,
        required: true,
        listVisible: true,
      },
      { name: "category", label: "Category", type: "string", listVisible: true },
      { name: "rationale", label: "Rationale", type: "text" },
      { name: "linkedType", label: "Linked type", type: "string" },
      { name: "linkedId", label: "Linked id", type: "string" },
      {
        name: "blockedFromExternal",
        label: "Blocked from external",
        type: "bool",
        listVisible: true,
      },
      { name: "reviewedBy", label: "Reviewed by", type: "string" },
    ],
  },

  wadiz: {
    key: "wadiz",
    label: "Wadiz Board",
    fields: [
      { name: "title", label: "Title", type: "string", required: true, listVisible: true },
      { name: "taskType", label: "Task type", type: "string", listVisible: true },
      { name: "status", label: "Status", type: "enum", options: WADIZ_STATUS, listVisible: true },
      { name: "owner", label: "Owner", type: "string", listVisible: true },
      { name: "dueDate", label: "Due date", type: "date", listVisible: true },
      { name: "notes", label: "Notes", type: "text" },
    ],
  },
};

export function getMeta(key: string): ResourceMeta | undefined {
  return RESOURCE_META[key];
}
