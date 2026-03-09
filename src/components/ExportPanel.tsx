import { useState } from "react";
import { Download, FileText, Loader2, CheckCircle2, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ARTIFACT_LABELS: Record<string, string> = {
  idea_brief: "Idea Brief",
  prd: "Product Requirements Document",
  architecture: "Architecture Design",
  business_model: "Business Model",
  execution_plan: "Execution Plan / Roadmap",
  research_summary: "Research Summary",
  proposal: "Proposal",
  lovable_handoff: "Lovable Handoff",
  intro_deck: "Intro Deck",
};

interface ExportPanelProps {
  projectId: string;
  projectName: string;
  artifacts: any[];
}

function buildMarkdown(
  projectName: string,
  artifactType: string,
  sections: any[]
): string {
  const lines: string[] = [];
  lines.push(`# ${ARTIFACT_LABELS[artifactType] || artifactType}`);
  lines.push(`> Project: ${projectName}`);
  lines.push(`> Generated: ${new Date().toLocaleDateString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const section of sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    lines.push(section.content || "_No content_");
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildFullPackageMarkdown(
  projectName: string,
  allArtifactSections: { artifactType: string; sections: any[] }[]
): string {
  const lines: string[] = [];
  lines.push(`# ${projectName} — Full Planning Package`);
  lines.push(`> Generated: ${new Date().toLocaleString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Table of Contents");
  lines.push("");
  for (const { artifactType } of allArtifactSections) {
    const label = ARTIFACT_LABELS[artifactType] || artifactType;
    const anchor = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    lines.push(`- [${label}](#${anchor})`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const { artifactType, sections } of allArtifactSections) {
    lines.push(`# ${ARTIFACT_LABELS[artifactType] || artifactType}`);
    lines.push("");
    for (const section of sections) {
      lines.push(`## ${section.title}`);
      lines.push("");
      lines.push(section.content || "_No content_");
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export default function ExportPanel({ projectId, projectName, artifacts }: ExportPanelProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  const handleExportSingle = async (artifact: any) => {
    setExporting(artifact.id);
    try {
      const { data: sections, error } = await supabase
        .from("artifact_sections")
        .select("*")
        .eq("artifact_id", artifact.id)
        .order("section_order", { ascending: true });

      if (error) throw error;
      if (!sections || sections.length === 0) {
        toast.error("No sections to export");
        return;
      }

      const md = buildMarkdown(projectName, artifact.artifact_type, sections);
      const filename = `${projectName.replace(/[^a-z0-9]/gi, "_")}_${artifact.artifact_type}.md`;
      downloadFile(md, filename, "text/markdown");
      toast.success(`Exported ${ARTIFACT_LABELS[artifact.artifact_type] || artifact.artifact_type}`);
    } catch (e: any) {
      toast.error(e.message || "Export failed");
    } finally {
      setExporting(null);
    }
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const allData: { artifactType: string; sections: any[] }[] = [];

      for (const artifact of artifacts) {
        const { data: sections, error } = await supabase
          .from("artifact_sections")
          .select("*")
          .eq("artifact_id", artifact.id)
          .order("section_order", { ascending: true });

        if (error) throw error;
        if (sections && sections.length > 0) {
          allData.push({ artifactType: artifact.artifact_type, sections });
        }
      }

      if (allData.length === 0) {
        toast.error("No content to export");
        return;
      }

      const md = buildFullPackageMarkdown(projectName, allData);
      const filename = `${projectName.replace(/[^a-z0-9]/gi, "_")}_full_package.md`;
      downloadFile(md, filename, "text/markdown");
      toast.success("Exported full planning package!");
    } catch (e: any) {
      toast.error(e.message || "Export failed");
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Full package export */}
      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Full Planning Package</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Download all {artifacts.length} documents as a single Markdown file with table of contents.
            </p>
          </div>
          <Button
            onClick={handleExportAll}
            disabled={exportingAll}
            className="gap-2"
          >
            {exportingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exportingAll ? "Exporting..." : "Download All (.md)"}
          </Button>
        </div>
      </div>

      {/* Individual artifacts */}
      <div>
        <h3 className="mb-3 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Individual Documents
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {artifacts.map((artifact) => {
            const label = ARTIFACT_LABELS[artifact.artifact_type] || artifact.artifact_type;
            const isExporting = exporting === artifact.id;
            return (
              <div
                key={artifact.id}
                className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-soft transition-all hover:shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <File className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      v{artifact.version} • {new Date(artifact.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSingle(artifact)}
                  disabled={isExporting}
                  className="gap-1.5"
                >
                  {isExporting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  .md
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
