// Risk review engine.
//
// Scans proposal / content draft text for risky terms and classifies each
// detected phrase as one of Green / Yellow / Red / Black using a deterministic
// keyword heuristic (no LLM, no network — local-first). For every finding it
// also suggests safer replacement language.
//
//   BLACK  — confidential IP that must NEVER reach an external draft:
//            Pure Mat composition, licensing terms, production conditions,
//            strain names, substrate composition, culture conditions, detailed
//            SOP, production cost, failure data.
//   RED    — regulated / unverifiable strong claims (non-toxic, antibacterial,
//            complete biodegradation, guarantees) and internal pricing strategy.
//   YELLOW — needs care: specific performance numbers, comparative claims,
//            material naming that may be regulated (mushroom/vegan leather).
//   GREEN  — safe, general marketing / informational language.
//
// The engine may *raise* the level; the stored review record is authoritative.
// BLACK-level phrases are blocked from being marked Approved (see resources.ts).

export type RiskLevel = "GREEN" | "YELLOW" | "RED" | "BLACK";

export interface RiskFinding {
  term: string; // the exact text that matched
  classification: RiskLevel;
  category: string;
  suggestion: string; // safer replacement language
}

export interface RiskResult {
  classification: RiskLevel; // overall = highest severity finding
  category: string; // category of the highest-severity finding
  rationale: string;
  blockedFromExternal: boolean; // true if any BLACK finding
  matched: string[]; // distinct matched terms (back-compat)
  findings: RiskFinding[]; // per-phrase detail with suggestions
}

interface Rule {
  level: RiskLevel;
  category: string;
  suggestion: string;
  patterns: RegExp[];
}

const ORDER: RiskLevel[] = ["GREEN", "YELLOW", "RED", "BLACK"];

// All patterns use the global flag so every occurrence becomes its own finding.
const RULES: Rule[] = [
  // ---- BLACK: confidential IP — never put in external-facing drafts ----
  {
    level: "BLACK",
    category: "Confidential — strain / substrate / culture",
    suggestion:
      "Remove confidential detail. Refer to it generally (e.g. “our proprietary mycelium process”) and keep specifics internal / NDA-only.",
    patterns: [
      /\bstrain\s+name(s)?\b/gi,
      /\bstrain(s)?\b/gi,
      /\b균주\b/g,
      /\bsubstrate\s+composition\b/gi,
      /\bsubstrate(s)?\b/gi,
      /\b배지\s*(조성|구성)?\b/g,
      /\bculture\s+condition(s)?\b/gi,
      /\b배양\s*조건\b/g,
      /\bmycelium\s+(recipe|formula|condition)\b/gi,
    ],
  },
  {
    level: "BLACK",
    category: "Confidential — Pure Mat / formulation",
    suggestion:
      "Do not disclose Pure Mat composition or mix ratios externally. Describe only the finished material benefits.",
    patterns: [
      /\bpure\s*mat\b/gi,
      /\b배합비?\b/g,
      /\bformulation\b/gi,
      /\bcomposition\s+ratio\b/gi,
      /\bmix(ing)?\s+ratio\b/gi,
    ],
  },
  {
    level: "BLACK",
    category: "Confidential — SOP / production conditions",
    suggestion:
      "Remove process detail. Replace with a general statement such as “produced under controlled conditions”.",
    patterns: [
      /\bdetailed\s+SOP\b/gi,
      /\bSOP\b/g,
      /\bstandard\s+operating\s+procedure\b/gi,
      /\bproduction\s+condition(s)?\b/gi,
      /\bprocess\s+parameter(s)?\b/gi,
      /\b공정\s*변수\b/g,
      /\b생산\s*조건\b/g,
      /\bheat\s*press\s+(temp|temperature|setting)\b/gi,
    ],
  },
  {
    level: "BLACK",
    category: "Confidential — cost / failure data",
    suggestion:
      "Never expose cost or failure data externally. Remove entirely from any external-facing draft.",
    patterns: [
      /\bproduction\s+cost(s)?\b/gi,
      /\bunit\s+cost(s)?\b/gi,
      /\bCOGS\b/g,
      /\b생산\s*원가\b/g,
      /\bfailure\s+data\b/gi,
      /\bfailure\s+rate(s)?\b/gi,
      /\bdefect\s+rate(s)?\b/gi,
      /\byield\s+loss\b/gi,
      /\b실패\s*(율|데이터)\b/g,
    ],
  },
  {
    level: "BLACK",
    category: "Confidential — licensing terms",
    suggestion:
      "Keep licensing terms behind the NDA gate. Externally, refer only to “partnership / licensing available on request”.",
    patterns: [
      /\blicens(e|ing)\s+(fee|term|terms|royalty|rate)\b/gi,
      /\broyalty\b/gi,
      /\bexclusive\s+territory\b/gi,
      /\b라이선스\s*(조건|료|수수료)\b/g,
    ],
  },

  // ---- RED: regulated / unverifiable strong claims ----
  {
    level: "RED",
    category: "Unverifiable claim — complete biodegradation",
    suggestion:
      "Avoid absolute biodegradation claims. Use “designed to biodegrade under industrial composting conditions” and cite the test standard (e.g. ISO/ASTM) and result.",
    patterns: [
      /\b(complete(ly)?|full[y]?|100%|total(ly)?)\s+biodegrad\w*/gi,
      /\bcomplete\s+biodegradation\b/gi,
    ],
  },
  {
    level: "RED",
    category: "Regulated safety claim — non-toxic",
    suggestion:
      "Avoid “non-toxic”. Say “made without [named] hazardous substances” and reference the specific test report.",
    patterns: [/\bnon[\s-]?toxic\b/gi, /\b무독성\b/g],
  },
  {
    level: "RED",
    category: "Regulated efficacy claim — antibacterial",
    suggestion:
      "Avoid efficacy claims like “antibacterial / antimicrobial” unless certified. Otherwise omit, or state “surface finish (no efficacy claim)”.",
    patterns: [/\bantibacterial\b/gi, /\bantimicrobial\b/gi, /\b항균\b/g],
  },
  {
    level: "RED",
    category: "Unverifiable strong claim",
    suggestion:
      "Soften or qualify. Avoid absolute guarantees and superlatives; state only what is tested and verifiable.",
    patterns: [
      /\bcompletely\s+(safe|harmless)\b/gi,
      /\b완전\s*무해\b/g,
      /\bguarantee[ds]?\b/gi,
      /\b보장\b/g,
      /\bworld'?s\s+(first|best|only)\b/gi,
    ],
  },
  {
    level: "RED",
    category: "Internal pricing / strategy",
    suggestion:
      "Internal-only. Remove margins, floors and unreleased partner names from any external draft.",
    patterns: [
      /\bmargin(s)?\b/gi,
      /\b마진\b/g,
      /\binternal\s+price(s)?\b/gi,
      /\bdiscount\s+floor\b/gi,
      /\bminimum\s+price\b/gi,
      /\bunreleased\s+partner(s)?\b/gi,
      /\b미공개\s*파트너\b/g,
    ],
  },

  // ---- YELLOW: needs care ----
  {
    level: "YELLOW",
    category: "Material naming — “mushroom leather”",
    suggestion:
      "Prefer “mycelium-based material” or “bio-based leather alternative”. The term “mushroom leather” can be misleading / regulated.",
    patterns: [/\bmushroom\s+leather\b/gi, /\b버섯\s*가죽\b/g],
  },
  {
    level: "YELLOW",
    category: "Material naming — “vegan leather”",
    suggestion:
      "Prefer “animal-free bio-based material”. Avoid the regulated word “leather” in markets where it is restricted.",
    patterns: [/\bvegan\s+leather\b/gi, /\b비건\s*가죽\b/g],
  },
  {
    level: "YELLOW",
    category: "Quantified carbon claim",
    suggestion:
      "Only state a carbon figure that is third-party verified, with baseline and method (e.g. “verified XX% reduction vs. baseline Y under LCA standard Z”).",
    patterns: [
      /\b\d+(\.\d+)?\s*%\s*(carbon|co2|탄소)\b/gi,
      /\bcarbon\s+(reduction|footprint|neutral|negative)\b/gi,
      /\b탄소\s*(저감|절감|중립)\b/g,
    ],
  },
  {
    level: "YELLOW",
    category: "Biodegradation claim",
    suggestion:
      "Qualify the claim: state the conditions and standard under which biodegradation was measured.",
    patterns: [/\bbiodegrad\w*/gi],
  },
  {
    level: "YELLOW",
    category: "Specific performance / comparison",
    suggestion:
      "Cite the source and test method for any number, or state it qualitatively until verified.",
    patterns: [
      /\b\d+(\.\d+)?\s*(%|MPa|gsm|mm|kg)\b/gi,
      /\btensile\s+strength\b/gi,
      /\bcompared?\s+to\s+leather\b/gi,
      /\b가죽\s*대비\b/g,
    ],
  },
];

export function classifyPhrase(text: string): RiskResult {
  const input = text ?? "";
  const findings: RiskFinding[] = [];
  const seen = new Set<string>(); // dedupe by level + lowercased term

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      // pattern carries the global flag; iterate every occurrence.
      const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(input)) !== null) {
        const term = m[0].trim();
        if (term === "") {
          re.lastIndex++;
          continue;
        }
        const key = `${rule.level}::${term.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          term,
          classification: rule.level,
          category: rule.category,
          suggestion: rule.suggestion,
        });
      }
    }
  }

  // Keep only the highest-severity finding per distinct term (a term may match
  // both a YELLOW and a more specific rule — surface the most severe).
  const bestByTerm = new Map<string, RiskFinding>();
  for (const f of findings) {
    const tkey = f.term.toLowerCase();
    const existing = bestByTerm.get(tkey);
    if (!existing || ORDER.indexOf(f.classification) > ORDER.indexOf(existing.classification)) {
      bestByTerm.set(tkey, f);
    }
  }
  const deduped = Array.from(bestByTerm.values()).sort(
    (a, b) => ORDER.indexOf(b.classification) - ORDER.indexOf(a.classification),
  );

  let bestIdx = 0;
  let category = "General / Safe";
  for (const f of deduped) {
    const idx = ORDER.indexOf(f.classification);
    if (idx > bestIdx) {
      bestIdx = idx;
      category = f.category;
    }
  }

  const classification = ORDER[bestIdx];
  const blockedFromExternal = deduped.some((f) => f.classification === "BLACK");
  const matched = deduped.map((f) => f.term);

  const rationale =
    deduped.length === 0
      ? "No confidential or risky terms detected."
      : `Detected ${deduped.length} phrase(s) needing review.` +
        (blockedFromExternal
          ? " Contains BLACK-level confidential information — BLOCKED from external-facing drafts and from approval."
          : classification === "RED"
            ? " Contains RED-level claims — requires owner review before any external use."
            : classification === "YELLOW"
              ? " Use with care; verify or rephrase the flagged terms before external use."
              : "");

  return { classification, category, rationale, blockedFromExternal, matched, findings: deduped };
}

// Convenience: just the BLACK terms, for blocking / error messages.
export function blackTerms(text: string): string[] {
  return classifyPhrase(text)
    .findings.filter((f) => f.classification === "BLACK")
    .map((f) => f.term);
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  GREEN: "bg-green-100 text-green-800 border-green-300",
  YELLOW: "bg-yellow-100 text-yellow-800 border-yellow-300",
  RED: "bg-red-100 text-red-800 border-red-300",
  BLACK: "bg-gray-900 text-white border-gray-900",
};
