// Static proposal draft templates.
//
// Pure and dependency-free so it can run on both the client (live preview) and
// the server (authoritative render on save). Each template turns a few inputs —
// customer segment, interested product, offer and a call-to-action — into a
// ready-to-edit draft. Generated drafts are always saved as status = DRAFT and
// still go through the normal owner-approval + risk gates before any external
// use. Templates deliberately contain no confidential / BLACK-level language.

export interface ProposalTemplateInput {
  segment?: string;
  customerName?: string;
  contactName?: string;
  productName?: string;
  offerName?: string;
  cta?: string;
  senderName?: string;
}

export interface ProposalTemplate {
  id: string;
  label: string;
  description: string;
  proposalType: string; // one of PROPOSAL_TYPE
  defaultOffer: string;
  defaultCta: string;
  render: (input: ProposalTemplateInput) => { title: string; content: string };
}

const f = (v: string | undefined, fallback: string): string => {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : fallback;
};

function build(
  subject: string,
  body: string,
  label: string,
  input: ProposalTemplateInput,
): { title: string; content: string } {
  const who = f(input.customerName, f(input.segment, "New prospect"));
  return {
    title: `${label} — ${who}`,
    content: `Subject: ${subject}\n\n${body.trim()}\n`,
  };
}

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: "fashion-first-contact",
    label: "Fashion brand first contact email",
    description: "Cold/warm intro to a fashion brand introducing MYCERRA.",
    proposalType: "OTHER",
    defaultOffer: "Finished Sheet Sample Review Package",
    defaultCta: "Would you be open to a short introductory call next week?",
    render(input) {
      const contact = f(input.contactName, "team");
      const customer = f(input.customerName, "your team");
      const segment = f(input.segment, "sustainability-focused");
      const product = f(input.productName, "our MYCERRA bio-material");
      const offer = f(input.offerName, this.defaultOffer);
      const cta = f(input.cta, this.defaultCta);
      const sender = f(input.senderName, "The MYCERRA Team");
      const subject = `MYCERRA — a sustainable bio-material for ${customer}`;
      const body = `Dear ${contact},

I'm reaching out from SAVE EARTH Inc., the team behind MYCERRA — a sustainable, mycelium-based bio-material developed for ${segment} fashion brands that want to lower the environmental footprint of their products.

Looking at ${customer}'s work, I believe ${product} could be a strong fit for your collections. We would be glad to share more through our ${offer}.

${cta}

Warm regards,
${sender}
SAVE EARTH Inc. · MYCERRA`;
      return build(subject, body, this.label, input);
    },
  },
  {
    id: "material-distributor",
    label: "Material distributor email",
    description: "Outreach to a materials distributor about carrying MYCERRA.",
    proposalType: "OTHER",
    defaultOffer: "Finished Sheet Sample Review Package",
    defaultCta: "Could we set up a call to discuss distribution terms?",
    render(input) {
      const contact = f(input.contactName, "team");
      const customer = f(input.customerName, "your company");
      const segment = f(input.segment, "materials distribution");
      const product = f(input.productName, "our MYCERRA bio-material");
      const offer = f(input.offerName, this.defaultOffer);
      const cta = f(input.cta, this.defaultCta);
      const sender = f(input.senderName, "The MYCERRA Team");
      const subject = `MYCERRA distribution opportunity — ${customer}`;
      const body = `Dear ${contact},

SAVE EARTH Inc. is expanding distribution for MYCERRA, our mycelium-based bio-material. Given ${customer}'s position in ${segment}, we believe there is a strong opportunity to bring this material to your network.

We'd like to introduce ${product} and explore terms together, starting with our ${offer}.

${cta}

Best regards,
${sender}
SAVE EARTH Inc. · MYCERRA`;
      return build(subject, body, this.label, input);
    },
  },
  {
    id: "sample-book-proposal",
    label: "Sample book proposal",
    description: "Proposes sending the MYCERRA Material Sample Book.",
    proposalType: "SAMPLE_BOOK",
    defaultOffer: "Material Sample Book Package",
    defaultCta: "May we arrange to send a sample book to your studio?",
    render(input) {
      const contact = f(input.contactName, "team");
      const customer = f(input.customerName, "your team");
      const segment = f(input.segment, "design");
      const product = f(input.productName, "our finished bio-material sheets");
      const offer = f(input.offerName, this.defaultOffer);
      const cta = f(input.cta, this.defaultCta);
      const sender = f(input.senderName, "The MYCERRA Team");
      const subject = `Proposal: MYCERRA Material Sample Book for ${customer}`;
      const body = `Dear ${contact},

Thank you for your interest in MYCERRA. To help your ${segment} team evaluate the range hands-on, we'd like to propose our ${offer}.

The sample book presents ${product} together with available finishes and colors, so your designers can assess texture and quality directly.

${cta}

Kind regards,
${sender}
SAVE EARTH Inc. · MYCERRA`;
      return build(subject, body, this.label, input);
    },
  },
  {
    id: "paid-poc-proposal",
    label: "Paid PoC proposal",
    description: "Proposes a paid proof-of-concept engagement.",
    proposalType: "PAID_POC",
    defaultOffer: "Paid PoC Package",
    defaultCta: "Shall we share a scope and quotation for the PoC?",
    render(input) {
      const contact = f(input.contactName, "team");
      const customer = f(input.customerName, "your team");
      const segment = f(input.segment, "product");
      const product = f(input.productName, "our MYCERRA bio-material");
      const offer = f(input.offerName, this.defaultOffer);
      const cta = f(input.cta, this.defaultCta);
      const sender = f(input.senderName, "The MYCERRA Team");
      const subject = `Proposal: Paid Proof-of-Concept with MYCERRA — ${customer}`;
      const body = `Dear ${contact},

Following your interest in ${product}, we'd like to propose a paid Proof-of-Concept (PoC) so ${customer} can validate the material against your specific ${segment} requirements.

Our ${offer} covers a defined scope, timeline and deliverables, with results you can take directly into product decisions.

${cta}

Best regards,
${sender}
SAVE EARTH Inc. · MYCERRA`;
      return build(subject, body, this.label, input);
    },
  },
  {
    id: "global-sample-review",
    label: "Global sample review email",
    description: "For overseas prospects requesting a sample review.",
    proposalType: "GLOBAL_SAMPLE",
    defaultOffer: "Global Sample Review Package",
    defaultCta: "Let us know the destination and we'll prepare a quotation.",
    render(input) {
      const contact = f(input.contactName, "team");
      const customer = f(input.customerName, "your team");
      const segment = f(input.segment, "international");
      const product = f(input.productName, "our finished bio-material sheet");
      const offer = f(input.offerName, this.defaultOffer);
      const cta = f(input.cta, this.defaultCta);
      const sender = f(input.senderName, "The MYCERRA Team");
      const subject = `MYCERRA global sample review — ${customer}`;
      const body = `Dear ${contact},

Thank you for your interest in MYCERRA from overseas. We're glad to support ${segment} evaluation of ${product} through our ${offer}.

Please note that for overseas reviews the sample is provided on a paid basis with customer-arranged shipping; we'll share a quotation alongside the sample details.

${cta}

Warm regards,
${sender}
SAVE EARTH Inc. · MYCERRA`;
      return build(subject, body, this.label, input);
    },
  },
  {
    id: "meeting-follow-up",
    label: "Meeting follow-up email",
    description: "Recap and next step after a meeting or call.",
    proposalType: "OTHER",
    defaultOffer: "Finished Sheet Sample Review Package",
    defaultCta: "Would next week work for a follow-up call to plan next steps?",
    render(input) {
      const contact = f(input.contactName, "team");
      const customer = f(input.customerName, "your team");
      const segment = f(input.segment, "");
      const product = f(input.productName, "MYCERRA");
      const offer = f(input.offerName, this.defaultOffer);
      const cta = f(input.cta, this.defaultCta);
      const sender = f(input.senderName, "The MYCERRA Team");
      const needs = segment ? `${segment} needs` : "needs";
      const subject = `Following up on our conversation — MYCERRA × ${customer}`;
      const body = `Dear ${contact},

Thank you for taking the time to meet and discuss how MYCERRA can support ${customer}. As a quick recap, we covered ${product} and how it fits your ${needs}.

As a next step, we'd suggest moving forward with our ${offer}.

${cta}

Best regards,
${sender}
SAVE EARTH Inc. · MYCERRA`;
      return build(subject, body, this.label, input);
    },
  },
];

export function getTemplate(id: string): ProposalTemplate | undefined {
  return PROPOSAL_TEMPLATES.find((t) => t.id === id);
}

// Client-safe metadata (no render fn) for listing templates.
export interface ProposalTemplateMeta {
  id: string;
  label: string;
  description: string;
  proposalType: string;
  defaultCta: string;
}

export const PROPOSAL_TEMPLATE_META: ProposalTemplateMeta[] = PROPOSAL_TEMPLATES.map((t) => ({
  id: t.id,
  label: t.label,
  description: t.description,
  proposalType: t.proposalType,
  defaultCta: t.defaultCta,
}));
