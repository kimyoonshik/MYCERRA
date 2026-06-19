# MYCERRA Agent OS

A **local-first internal command center** for SAVE EARTH Inc. to manage MYCERRA's
B2B biomaterial sales, sample review, material sample book requests, Paid PoC
proposals, Wadiz campaign preparation, content drafts, and legal/risk review.

This is the **local-first MVP**: it runs on the operator's machine and is not
meant to be exposed publicly.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **PostgreSQL** via **Prisma ORM**
- **Tailwind CSS**
- Simple **admin-only** authentication (single password + signed cookie)

## Core modules

1. **Dashboard** — summary cards across every module + guardrail reminders
2. **Products** — product catalogue (Pure Mat, Dyed Base Mat, Finished Sheet, …)
3. **Offers** — sales packages, optionally linked to a product
4. **Leads / Customers** — lightweight CRM with pipeline stages
5. **Sample Requests** — requests with a manual owner-approval gate
6. **Proposals** — sample review / Paid PoC / licensing proposals
7. **Content Board** — drafts that are risk-classified on save
8. **Risk Review** — classify phrases Green / Yellow / Red / Black
9. **Wadiz Board** — campaign-prep task board
10. **Settings** — local organisation details + fixed-policy reference

Every CRUD module supports **search**, **CSV export**, and **CSV import**.

## Sample request workflow

Each sample request captures: customer, requested product, sample type, intended
use, destination country, NDA required, NDA status, quoted price, shipping cost,
paid-sample / customer-paid-shipping flags, owner approval, approval status,
shipping status and follow-up date.

Server-side workflow rules (`src/lib/resources.ts`, `samples.beforeWrite`):

- **Pure Mat always requires NDA + owner approval.** If the requested product is
  Pure Mat, `ndaRequired` is forced on, the NDA status is moved off
  *Not required*, and the approval status defaults to *Owner approval required*.
- **Overseas defaults.** On create, a request whose destination country is not
  Korea defaults to **paid sample** and **customer-paid shipping** (an explicit
  value in the form is respected).
- **Never auto-approved.** Approval status can become *Approved* only when
  `ownerApproved` is explicitly set.
- **NDA gate.** When an NDA is required, it must be *Signed* before the request
  can be approved.
- **Fulfilment gate.** A sample cannot be marked *Shipped* / *Delivered* before
  the request is *Approved*.

## Proposal draft generator

The **Proposals** page has a *Generate draft* tool that builds a first draft from
a static template (`src/lib/proposal-templates.ts`) — no LLM, no network. Pick a
template and provide customer segment, customer/contact name, interested product,
offer and a call-to-action; a live preview renders as you type.

Templates:

1. Fashion brand first contact email
2. Material distributor email
3. Sample book proposal
4. Paid PoC proposal
5. Global sample review email
6. Meeting follow-up email

On *Save as draft*, `POST /api/generate-proposal` resolves the product/offer
names server-side, renders the template, runs the local risk check, and creates
the proposal with **status = Draft** and `ownerApproved = false` (the proposal
`type` is set from the template, e.g. Sample Book / Paid PoC / Global Sample).
Generated drafts still go through the normal owner-approval and risk gates before
any external use; templates deliberately avoid confidential / BLACK-level wording.

## Business rules (enforced in code)

These are **not** configurable toggles — they are enforced server-side:

- The app **does not** automatically send emails.
- The app **does not** automatically publish content.
- The app **does not** automatically approve sample requests
  (a request can only reach *approved / shipped* after `ownerApproved` is set
  manually).
- All external communications require **owner approval**
  (`ownerApproved`) before they are considered external-ready.
- Confidential domains — **Pure Mat, licensing, production conditions, strains,
  substrates, detailed SOP, production cost, failure data** — are protected.
  Affected products are flagged `confidential`.
- **Risk classification**: every reviewed phrase is one of
  **Green / Yellow / Red / Black**.
- **Black-level** information is **blocked from external-facing drafts**:
  - Content drafts whose body classifies as BLACK cannot be owner-approved.
  - Proposals whose content classifies as BLACK cannot be owner-approved.
- There are **no external API calls or live integrations** in this version.

The risk classifier (`src/lib/risk.ts`) is a deterministic, offline keyword
heuristic — no LLM, no network. Swap that one file to upgrade the logic; the
rest of the app is unchanged.

It scans proposal and content draft text and returns a **per-phrase finding**
for every risky term — each with its level (Green/Yellow/Red/Black) and a
**suggested safer replacement**. Covered terms include complete biodegradation,
quantified carbon-reduction claims, "mushroom leather" / "vegan leather",
non-toxic, antibacterial (Red/Yellow), and confidential domains — strain names,
substrate composition, culture conditions, detailed SOP, production cost and
failure data (Black). The **Risk Review** page has a *Classify a phrase* tool
that shows the findings table with suggestions, and findings can be saved to the
log. On save, drafts whose body/content classifies as **Black** are blocked from
being marked Approved / Published / Sent, and the error names the exact phrases
to remove.

## Getting started

### 1. Prerequisites

- Node.js 18.18+ (tested on Node 22)
- A local PostgreSQL instance

### 2. Install

```bash
cd web
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mycerra?schema=public"
ADMIN_PASSWORD="choose-a-local-admin-password"
AUTH_SECRET="a-long-random-string"
```

### 4. Create the database schema and seed data

```bash
npx prisma migrate dev      # creates tables (uses the committed migration)
npm run seed                # loads the 7 initial products + 7 initial offers
```

### 5. Run

```bash
npm run dev                 # http://localhost:3000
```

Open <http://localhost:3000>, sign in with `ADMIN_PASSWORD`, and you'll land on
the Dashboard.

### Production-style run

```bash
npm run build
npm start
```

## Seed data

`prisma/seed.ts` is idempotent (upsert by `code`) and creates:

**Products** — MYCERRA Pure Mat *(confidential)*, Dyed Base Mat, Finished
Bio-Material Sheet, Material Sample Book, Craft Line, Launch Studio, Partner
Production / Licensing *(confidential)*.

**Offers** — Finished Sheet Sample Review Package, Material Sample Book Package,
Paid PoC Package, Craft Line Wadiz Reward Package, Global Sample Review Package,
Launch Studio Consulting Package, Partner Production / Licensing Gate Package.

## CSV import/export

- **Export**: each module has an *Export CSV* button → `GET /api/export/:resource`.
- **Import**: *Import CSV* uploads a file → `POST /api/import/:resource`.
  Rows are upserted by `id` when present, otherwise created. Business guards
  (`beforeWrite`) still apply to every imported row, and per-row errors are
  reported back. Round-tripping an export back through import works.

## Project structure

```
web/
├─ prisma/
│  ├─ schema.prisma         # data model + enums (business rules encoded)
│  ├─ migrations/           # committed SQL migration(s)
│  └─ seed.ts               # initial products & offers
├─ src/
│  ├─ middleware.ts         # auth gate for all non-public routes
│  ├─ app/
│  │  ├─ layout.tsx         # root layout
│  │  ├─ login/             # admin sign-in
│  │  ├─ (app)/             # authenticated shell + module pages
│  │  │  ├─ page.tsx        # Dashboard
│  │  │  ├─ products/ … wadiz/ , settings/
│  │  └─ api/
│  │     ├─ auth/           # login / logout
│  │     ├─ [resource]/     # generic CRUD (list/create/read/update/delete)
│  │     ├─ export/[resource]/   # CSV export
│  │     ├─ import/[resource]/   # CSV import
│  │     ├─ classify/       # risk classifier (no storage)
│  │     ├─ dashboard/      # summary counts
│  │     └─ settings/       # local org settings
│  ├─ components/           # Sidebar, ResourceManager, RiskClassifier, …
│  └─ lib/
│     ├─ prisma.ts          # Prisma client singleton
│     ├─ auth.ts            # HMAC session (edge + node safe)
│     ├─ resource-meta.ts   # client-safe field metadata (single source of truth)
│     ├─ resources.ts       # server registry: model + write-time guards
│     ├─ risk.ts            # Green/Yellow/Red/Black classifier
│     └─ csv.ts             # dependency-free CSV parse/serialize
```

### How the generic CRUD works

Each entity is described once in `src/lib/resource-meta.ts` (fields, types,
labels, enum options). The server registry (`src/lib/resources.ts`) binds that
metadata to a Prisma delegate plus optional `beforeWrite` guards. The same
metadata drives the generic UI table/forms (`ResourceManager`) and the generic
REST API (`/api/[resource]`). Adding a field is usually a one-line change.

## Useful scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Start the production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Seed initial products & offers |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run db:reset` | Reset DB and re-seed |

## Intentional limitations (first version)

- No live email sending, no external API calls, no live integrations.
- The risk classifier is a deterministic keyword heuristic, not an LLM.
- Single admin user; this is not a multi-user identity system.
- Intended to run locally; do not expose it publicly without adding real auth.
