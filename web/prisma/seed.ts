import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Initial product catalogue. Pure Mat and Partner Production / Licensing carry
// confidential IP and are flagged so they are never auto-exposed externally.
const PRODUCTS = [
  {
    code: "PROD-PURE-MAT",
    name: "MYCERRA Pure Mat",
    category: "Core Material",
    status: "ACTIVE" as const,
    confidential: true,
    description:
      "Foundational mycelium mat. Composition, strains, substrates and production conditions are CONFIDENTIAL and must never appear in external-facing material.",
  },
  {
    code: "PROD-DYED-BASE-MAT",
    name: "MYCERRA Dyed Base Mat",
    category: "Core Material",
    status: "ACTIVE" as const,
    confidential: false,
    description: "Dyed base mat derived from the Pure Mat for downstream finishing.",
  },
  {
    code: "PROD-FINISHED-SHEET",
    name: "MYCERRA Finished Bio-Material Sheet",
    category: "Finished Goods",
    status: "ACTIVE" as const,
    confidential: false,
    description: "Finished bio-material sheet suitable for B2B sample review.",
  },
  {
    code: "PROD-SAMPLE-BOOK",
    name: "MYCERRA Material Sample Book",
    category: "Sales Collateral",
    status: "ACTIVE" as const,
    confidential: false,
    description: "Curated material sample book for prospective B2B partners.",
  },
  {
    code: "PROD-CRAFT-LINE",
    name: "MYCERRA Craft Line",
    category: "Consumer / Craft",
    status: "ACTIVE" as const,
    confidential: false,
    description: "Craft-oriented product line, intended for Wadiz reward campaigns.",
  },
  {
    code: "PROD-LAUNCH-STUDIO",
    name: "MYCERRA Launch Studio",
    category: "Service",
    status: "ACTIVE" as const,
    confidential: false,
    description: "Consulting / launch support service for partners.",
  },
  {
    code: "PROD-PARTNER-LICENSING",
    name: "MYCERRA Partner Production / Licensing",
    category: "Licensing",
    status: "ACTIVE" as const,
    confidential: true,
    description:
      "Partner production and licensing track. Licensing terms, royalties and production conditions are CONFIDENTIAL.",
  },
];

// Initial offers. Each links (by code) to a product where it makes sense.
const OFFERS = [
  {
    code: "OFFER-FINISHED-SHEET-REVIEW",
    name: "Finished Sheet Sample Review Package",
    type: "Sample Review",
    priceModel: "Per sample / paid review",
    status: "ACTIVE" as const,
    productCode: "PROD-FINISHED-SHEET",
    description: "Sample review package for the finished bio-material sheet.",
  },
  {
    code: "OFFER-SAMPLE-BOOK",
    name: "Material Sample Book Package",
    type: "Sample Book",
    priceModel: "Fixed package",
    status: "ACTIVE" as const,
    productCode: "PROD-SAMPLE-BOOK",
    description: "Material sample book request package.",
  },
  {
    code: "OFFER-PAID-POC",
    name: "Paid PoC Package",
    type: "Paid PoC",
    priceModel: "Project-based",
    status: "ACTIVE" as const,
    productCode: "PROD-FINISHED-SHEET",
    description: "Paid proof-of-concept engagement.",
  },
  {
    code: "OFFER-CRAFT-WADIZ-REWARD",
    name: "Craft Line Wadiz Reward Package",
    type: "Wadiz Reward",
    priceModel: "Crowdfunding reward",
    status: "ACTIVE" as const,
    productCode: "PROD-CRAFT-LINE",
    description: "Reward tier package for the Craft Line Wadiz campaign.",
  },
  {
    code: "OFFER-GLOBAL-SAMPLE-REVIEW",
    name: "Global Sample Review Package",
    type: "Sample Review",
    priceModel: "Per sample / paid review",
    status: "ACTIVE" as const,
    productCode: "PROD-FINISHED-SHEET",
    description: "Sample review package for international prospects.",
  },
  {
    code: "OFFER-LAUNCH-STUDIO-CONSULTING",
    name: "Launch Studio Consulting Package",
    type: "Consulting",
    priceModel: "Retainer / project",
    status: "ACTIVE" as const,
    productCode: "PROD-LAUNCH-STUDIO",
    description: "Consulting package delivered via Launch Studio.",
  },
  {
    code: "OFFER-PARTNER-LICENSING-GATE",
    name: "Partner Production / Licensing Gate Package",
    type: "Licensing",
    priceModel: "Gated / NDA required",
    status: "ACTIVE" as const,
    productCode: "PROD-PARTNER-LICENSING",
    description:
      "Gated entry package for partner production / licensing. Confidential terms require owner approval.",
  },
];

async function main() {
  console.log("Seeding products...");
  const productByCode: Record<string, string> = {};
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        category: p.category,
        status: p.status,
        confidential: p.confidential,
        description: p.description,
      },
      create: p,
    });
    productByCode[p.code] = product.id;
  }

  console.log("Seeding offers...");
  for (const o of OFFERS) {
    const { productCode, ...rest } = o;
    await prisma.offer.upsert({
      where: { code: o.code },
      update: { ...rest, productId: productByCode[productCode] ?? null },
      create: { ...rest, productId: productByCode[productCode] ?? null },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
