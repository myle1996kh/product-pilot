import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Dependencies between artifact types and project fields
export const ARTIFACT_DEPENDENCIES: Record<string, string[]> = {
  idea_brief: ["problem", "target_users", "desired_outcome"],
  prd: ["problem", "target_users", "desired_outcome", "features", "tech_pref"],
  architecture: ["features", "tech_pref", "timeline", "budget"],
  business_model: ["problem", "target_users", "revenue", "desired_outcome"],
  execution_plan: ["features", "timeline", "budget", "tech_pref"],
};

// Section-level dependencies (which sections affect which)
export const SECTION_DEPENDENCIES: Record<string, string[]> = {
  "Problem Statement": ["Goals & Non-Goals", "Target Users", "Value Proposition"],
  "Target Users": ["Functional Requirements", "Customer Segments", "Go-to-Market Strategy"],
  "Revenue Model": ["Market Analysis", "Key Metrics", "Sprint Breakdown"],
  "Tech Stack Recommendation": ["System Architecture", "Data Model", "Infrastructure & Deployment"],
  "MVP Scope": ["Sprint Breakdown", "Resource Requirements", "Testing Strategy"],
};

type StaleSectionProps = {
  changedField: string;
  affectedSections: string[];
  onUpdateAll: () => void;
  isUpdating: boolean;
};

export function StaleSectionBanner({ changedField, affectedSections, onUpdateAll, isUpdating }: StaleSectionProps) {
  if (affectedSections.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          "{changedField}" was updated
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {affectedSections.length} section(s) may be outdated:
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {affectedSections.map((s) => (
            <Badge key={s} variant="outline" className="border-warning/30 text-warning text-[10px]">
              {s}
            </Badge>
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onUpdateAll}
          disabled={isUpdating}
          className="mt-3 gap-1.5 border-warning/30 text-warning hover:bg-warning/10"
        >
          <RefreshCw className={`h-3 w-3 ${isUpdating ? "animate-spin" : ""}`} />
          {isUpdating ? "Updating..." : "Regenerate Affected Sections"}
        </Button>
      </div>
    </div>
  );
}

// Detect which sections are affected by a field change
export function getAffectedSections(
  changedSectionTitle: string,
  allSectionTitles: string[]
): string[] {
  const deps = SECTION_DEPENDENCIES[changedSectionTitle] || [];
  return deps.filter(d => allSectionTitles.includes(d));
}

// Detect which artifact types need regeneration based on changed project fields
export function getStaleArtifacts(
  changedFields: string[],
  existingArtifactTypes: string[]
): string[] {
  const stale: Set<string> = new Set();
  for (const [artifactType, deps] of Object.entries(ARTIFACT_DEPENDENCIES)) {
    if (existingArtifactTypes.includes(artifactType)) {
      if (deps.some(d => changedFields.includes(d))) {
        stale.add(artifactType);
      }
    }
  }
  return Array.from(stale);
}
