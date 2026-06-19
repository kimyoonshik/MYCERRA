// Risk review engine.
//
// Classifies a phrase as one of Green / Yellow / Red / Black using a
// deterministic keyword heuristic (no LLM, no network — local-first).
//
//   BLACK  — confidential IP that must NEVER reach an external draft:
//            Pure Mat composition, licensing terms, production conditions,
//            strains, substrates, detailed SOP, production cost, failure data.
//   RED    — sensitive: internal pricing strategy, unreleased partners,
//            margins, unverifiable strong claims.
//   YELLOW — needs care: specific performance numbers, comparative claims.
//   GREEN  — safe, general marketing / informational language.
//
// Only the owner can downgrade a classification manually; the engine is
// allowed to *raise* the level but the stored record is authoritative.

export type RiskLevel = "GREEN" | "YELLOW" | "RED" | "BLACK";

export interface RiskResult {
  classification: RiskLevel;
  category: string;
  rationale: string;
  blockedFromExternal: boolean;
  matched: string[];
}

interface Rule {
  level: RiskLevel;
  category: string;
  patterns: RegExp[];
}

// Order matters only for category labelling; final level is the max severity.
const RULES: Rule[] = [
  {
    level: "BLACK",
    category: "Confidential IP / Pure Mat",
    patterns: [
      /pure\s*mat/i,
      /\b배합비?\b/,
      /formula(tion)?/i,
      /composition\s+ratio/i,
      /\bstrain(s)?\b/i,
      /\b균주\b/,
      /\bsubstrate(s)?\b/i,
      /\b배지\b/,
      /\bmycelium\s+(recipe|condition)/i,
    ],
  },
  {
    level: "BLACK",
    category: "Production conditions / SOP",
    patterns: [
      /\bSOP\b/,
      /standard\s+operating\s+procedure/i,
      /production\s+condition/i,
      /\b생산\s*조건\b/,
      /\b공정\s*변수\b/,
      /process\s+parameter/i,
      /culture\s+condition/i,
      /\b배양\s*조건\b/,
      /heat\s*press\s+(temp|setting)/i,
    ],
  },
  {
    level: "BLACK",
    category: "Production cost / failure data",
    patterns: [
      /production\s+cost/i,
      /\b생산\s*원가\b/,
      /unit\s+cost/i,
      /\bCOGS\b/,
      /failure\s+(rate|data)/i,
      /\b실패\s*(율|데이터)\b/,
      /defect\s+rate/i,
      /yield\s+loss/i,
    ],
  },
  {
    level: "BLACK",
    category: "Licensing terms",
    patterns: [
      /licens(e|ing)\s+(fee|term|royalty|rate)/i,
      /royalty/i,
      /\b라이선스\s*(조건|료|수수료)\b/,
      /exclusive\s+territory/i,
    ],
  },
  {
    level: "RED",
    category: "Internal pricing / strategy",
    patterns: [
      /\bmargin\b/i,
      /\b마진\b/,
      /internal\s+price/i,
      /\b내부\s*가격\b/,
      /discount\s+floor/i,
      /minimum\s+price/i,
      /unreleased\s+partner/i,
      /\b미공개\s*파트너\b/,
    ],
  },
  {
    level: "RED",
    category: "Unverifiable strong claim",
    patterns: [
      /100%\s+biodegradable/i,
      /completely\s+(safe|harmless)/i,
      /\b완전\s*무해\b/,
      /guaranteed?/i,
      /\b보장\b/,
      /world'?s\s+(first|best|only)/i,
    ],
  },
  {
    level: "YELLOW",
    category: "Specific performance / comparison",
    patterns: [
      /\b\d+(\.\d+)?\s*(%|MPa|gsm|mm|kg)/i,
      /tensile\s+strength/i,
      /compared?\s+to\s+leather/i,
      /\b가죽\s*대비\b/,
      /carbon\s+(footprint|reduction)/i,
    ],
  },
];

export function classifyPhrase(text: string): RiskResult {
  const input = text ?? "";
  const order: RiskLevel[] = ["GREEN", "YELLOW", "RED", "BLACK"];
  let bestIdx = 0;
  let category = "General / Safe";
  const matched: string[] = [];

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const m = input.match(pattern);
      if (m) {
        matched.push(m[0]);
        const idx = order.indexOf(rule.level);
        if (idx > bestIdx) {
          bestIdx = idx;
          category = rule.category;
        } else if (idx === bestIdx && bestIdx > 0) {
          // keep first category at this level
        }
      }
    }
  }

  const classification = order[bestIdx];
  const blockedFromExternal = classification === "BLACK";

  const rationale =
    matched.length === 0
      ? "No confidential or risky terms detected."
      : `Matched terms: ${Array.from(new Set(matched)).join(", ")}.` +
        (blockedFromExternal
          ? " Contains confidential information — BLOCKED from external-facing drafts."
          : classification === "RED"
            ? " Sensitive — requires owner approval before any external use."
            : classification === "YELLOW"
              ? " Use with care; verify claims before external use."
              : "");

  return { classification, category, rationale, blockedFromExternal, matched: Array.from(new Set(matched)) };
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  GREEN: "bg-green-100 text-green-800 border-green-300",
  YELLOW: "bg-yellow-100 text-yellow-800 border-yellow-300",
  RED: "bg-red-100 text-red-800 border-red-300",
  BLACK: "bg-gray-900 text-white border-gray-900",
};
