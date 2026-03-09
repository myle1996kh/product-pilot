import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Gauge,
  ClipboardCheck,
  Download,
  ArrowRight,
  Clock,
  Sparkles,
  Loader2,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const quickLinks = [
  {
    to: "discussion",
    icon: MessageSquare,
    label: "Discussion",
    desc: "Continue refining your idea with AI",
    color: "bg-primary/10 text-primary",
  },
  {
    to: "readiness",
    icon: Gauge,
    label: "Readiness Check",
    desc: "See what's still missing",
    color: "bg-warning/10 text-warning",
  },
  {
    to: "review",
    icon: ClipboardCheck,
    label: "Plan Review",
    desc: "Review and approve your documents",
    color: "bg-success/10 text-success",
  },
  {
    to: "review?tab=export",
    icon: Download,
    label: "Export",
    desc: "Download your planning package",
    color: "bg-info/10 text-info",
  },
];

const ARTIFACT_OPTIONS = [
  { key: "idea_brief", label: "Idea Brief", icon: FileText },
  { key: "prd", label: "PRD", icon: FileText },
  { key: "architecture", label: "Architecture", icon: FileText },
  { key: "business_model", label: "Business Model", icon: FileText },
  { key: "execution_plan", label: "Execution Plan", icon: FileText },
] as const;

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["prd", "architecture", "business_model"]);
  const [generatedResults, setGeneratedResults] = useState<Record<string, { artifact_id: string; sections_count: number }> | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const toggleType = (key: string) => {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const handleGenerate = async () => {
    if (!id || selectedTypes.length === 0) return;
    setGenerating(true);
    setGeneratedResults(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-docs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ project_id: id, artifact_types: selectedTypes }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Generation failed");
      }

      const result = await resp.json();
      setGeneratedResults(result.results);
      toast.success(`Generated ${Object.keys(result.results).length} document(s) successfully!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate documents");
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">{project.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {quickLinks.map((link, i) => (
            <motion.div
              key={link.to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Link to={`/project/${id}/${link.to}`}>
                <div className="group rounded-xl border bg-card p-5 shadow-soft transition-all hover:shadow-card">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${link.color}`}>
                    <link.icon className="h-5 w-5" />
                  </div>
                  <p className="font-medium text-foreground">{link.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{link.desc}</p>
                  <ArrowRight className="mt-3 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Generate Documents Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8 rounded-xl border bg-card p-6 shadow-soft"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Generate Documents</h2>
              <p className="text-sm text-muted-foreground">
                AI will create documents based on your project data & discussion history
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {ARTIFACT_OPTIONS.map((opt) => {
              const selected = selectedTypes.includes(opt.key);
              const generated = generatedResults?.[opt.key];
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleType(opt.key)}
                  disabled={generating}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
                  } ${generating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {generated ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <opt.icon className="h-3.5 w-3.5" />
                  )}
                  {opt.label}
                  {generated && (
                    <span className="text-[10px] text-success">({generated.sections_count} sections)</span>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || selectedTypes.length === 0}
            className="gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate {selectedTypes.length} Document(s)
              </>
            )}
          </Button>

          {generatedResults && (
            <div className="mt-4">
              <Link to={`/project/${id}/review`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <ClipboardCheck className="h-4 w-4" /> View in Plan Review
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
