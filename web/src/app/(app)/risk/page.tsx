import ResourceManager from "@/components/ResourceManager";
import RiskClassifier from "@/components/RiskClassifier";

export default function RiskPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Risk Review</h1>
      <RiskClassifier />
      <ResourceManager resourceKey="risk" />
    </>
  );
}
