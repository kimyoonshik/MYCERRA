import { RISK_COLORS, RiskLevel } from "@/lib/risk";

const STATUS_TONES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-300",
  DRAFT: "bg-gray-100 text-gray-700 border-gray-300",
  ARCHIVED: "bg-gray-100 text-gray-500 border-gray-300",
  PAUSED: "bg-yellow-100 text-yellow-800 border-yellow-300",
  WON: "bg-green-100 text-green-800 border-green-300",
  LOST: "bg-red-100 text-red-700 border-red-300",
  REJECTED: "bg-red-100 text-red-700 border-red-300",
  SHIPPED: "bg-green-100 text-green-800 border-green-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  ACCEPTED: "bg-green-100 text-green-800 border-green-300",
  DECLINED: "bg-red-100 text-red-700 border-red-300",
  OWNER_APPROVAL_REQUIRED: "bg-amber-100 text-amber-800 border-amber-300",
  DONE: "bg-green-100 text-green-800 border-green-300",
  READY: "bg-blue-100 text-blue-800 border-blue-300",
};

export function EnumBadge({ value, field }: { value: string; field?: string }) {
  if (!value) return <span className="text-gray-400">—</span>;
  let tone = STATUS_TONES[value] ?? "bg-gray-100 text-gray-700 border-gray-300";
  if (field === "riskLevel" || field === "classification") {
    tone = RISK_COLORS[value as RiskLevel] ?? tone;
  }
  return <span className={`badge ${tone}`}>{value.replaceAll("_", " ")}</span>;
}
