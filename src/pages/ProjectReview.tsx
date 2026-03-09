import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { StackComparison, ArchitectureFlow, MigrationPath } from "@/components/ArchitectureWidgets";
import MarkdownContent from "@/components/MarkdownContent";
import ExportPanel from "@/components/ExportPanel";
import {
  ChevronRight,
  FileText,
  Cpu,
  BarChart3,
  Map,
  AlertTriangle,
  Download,
  RefreshCw,
  Lock,
  CheckCircle2,
  MessageSquare,
  Loader2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

type SectionStatus = "draft" | "needs_review" | "approved" | "locked";

const sectionStatusConfig: Record<SectionStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-secondary text-secondary-foreground" },
  needs_review: { label: "Needs Review", className: "bg-warning/15 text-warning-foreground" },
  approved: { label: "Approved", className: "bg-success/15 text-success" },
  locked: { label: "Locked", className: "bg-muted text-muted-foreground" },
};

const ARTIFACT_TYPE_TABS: Record<string, { label: string; icon: any }> = {
  idea_brief: { label: "Idea Brief", icon: FileText },
  prd: { label: "PRD", icon: FileText },
  architecture: { label: "Architecture", icon: Cpu },
  business_model: { label: "Business", icon: BarChart3 },
  execution_plan: { label: "Roadmap", icon: Map },
};

function Section({
  id: sectionId,
  title,
  status,
  content,
  isLocked,
  onRegenerated,
}: {
  id: string;
  title: string;
  status: SectionStatus;
  content: string;
  isLocked?: boolean;
  onRegenerated: () => void;
}) {
  const [regenerating, setRegenerating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const config = sectionStatusConfig[status];

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-section`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            section_id: sectionId,
            feedback: feedback || undefined,
          }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Regeneration failed");
      }
      toast.success(`"${title}" regenerated successfully`);
      setShowFeedback(false);
      setFeedback("");
      onRegenerated();
    } catch (e: any) {
      toast.error(e.message || "Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <Badge variant="outline" className={config.className}>
            {status === "approved" && <CheckCircle2 className="mr-1 h-3 w-3" />}
            {status === "locked" && <Lock className="mr-1 h-3 w-3" />}
            {config.label}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={() => setShowFeedback(!showFeedback)}
            disabled={isLocked || regenerating}
          >
            <MessageSquare className="mr-1 h-3 w-3" /> Feedback
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={handleRegenerate}
            disabled={isLocked || regenerating}
          >
            {regenerating ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3 w-3" />
            )}
            {regenerating ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>
      </div>

      {showFeedback && (
        <div className="mb-3 flex gap-2">
          <Input
            placeholder="Optional: tell AI what to improve..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleRegenerate()}
          />
          <Button size="sm" onClick={handleRegenerate} disabled={regenerating} className="shrink-0">
            {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Go"}
          </Button>
        </div>
      )}

      <MarkdownContent content={content} />
    </div>
  );
}

export default function ProjectReview() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isExportTab = searchParams.get("tab") === "export";
  const [activeTab, setActiveTab] = useState<string>("");

  // Fetch artifacts for this project
  const { data: artifacts, isLoading: loadingArtifacts } = useQuery({
    queryKey: ["artifacts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artifacts")
        .select("*")
        .eq("project_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Fetch project name
  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("name")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Set default active tab once artifacts load
  const artifactTypes = artifacts?.map(a => a.artifact_type) || [];
  const currentTab = activeTab && artifactTypes.includes(activeTab as any) ? activeTab : artifactTypes[0] || "";
  const activeArtifact = artifacts?.find(a => a.artifact_type === currentTab);

  // Fetch sections for active artifact
  const { data: sections, isLoading: loadingSections } = useQuery({
    queryKey: ["artifact-sections", activeArtifact?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artifact_sections")
        .select("*")
        .eq("artifact_id", activeArtifact!.id)
        .order("section_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!activeArtifact?.id,
  });

  const handleSectionRegenerated = () => {
    queryClient.invalidateQueries({ queryKey: ["artifact-sections", activeArtifact?.id] });
  };

  if (loadingArtifacts) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="px-8 py-10">
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link to={`/project/${id}`} className="text-muted-foreground hover:text-foreground">
            {project?.name || "Project"}
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">Plan Review</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h2 className="mb-2 font-display text-lg font-semibold">No documents yet</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Generate documents from your project page first.
          </p>
          <Link to={`/project/${id}`}>
            <Button>Go to Project</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link to={`/project/${id}`} className="text-muted-foreground hover:text-foreground">
          {project?.name || "Project"}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">Plan Review</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">
              {isExportTab ? "Export Package" : "Plan Review Hub"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isExportTab
                ? "Download your planning documents as Markdown files."
                : "Review, comment, and regenerate each section."}
            </p>
          </div>
          <Link to={`/project/${id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-3.5 w-3.5" /> Generate More
            </Button>
          </Link>
        </div>

        {isExportTab ? (
          <ExportPanel
            projectId={id!}
            projectName={project?.name || "Project"}
            artifacts={artifacts || []}
          />
        ) : (
        <Tabs value={currentTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 h-auto flex-wrap gap-1 bg-transparent p-0">
            {artifacts?.map((artifact) => {
              const config = ARTIFACT_TYPE_TABS[artifact.artifact_type] || {
                label: artifact.artifact_type,
                icon: FileText,
              };
              const Icon = config.icon;
              return (
                <TabsTrigger
                  key={artifact.artifact_type}
                  value={artifact.artifact_type}
                  className="gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {artifacts?.map((artifact) => (
            <TabsContent key={artifact.artifact_type} value={artifact.artifact_type} className="space-y-4">
              {artifact.artifact_type === "architecture" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 font-display text-sm font-semibold">System Architecture</h3>
                    <ArchitectureFlow />
                  </div>
                  <div>
                    <h3 className="mb-2 font-display text-sm font-semibold">Stack Comparison</h3>
                    <StackComparison />
                  </div>
                  <div>
                    <h3 className="mb-2 font-display text-sm font-semibold">Migration Roadmap</h3>
                    <MigrationPath />
                  </div>
                </div>
              )}
              {loadingSections && activeArtifact?.id === artifact.id ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : activeArtifact?.id === artifact.id && sections ? (
                sections.map((section) => (
                  <Section
                    key={section.id}
                    id={section.id}
                    title={section.title}
                    status={section.status as SectionStatus}
                    content={section.content}
                    isLocked={section.is_locked || false}
                    onRegenerated={handleSectionRegenerated}
                  />
                ))
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
        )}
      </motion.div>
    </div>
  );
}
