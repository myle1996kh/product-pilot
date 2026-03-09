import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type ReadinessAxis = { score: number; reason: string };
type ReadinessDetails = {
  axes: Record<string, ReadinessAxis>;
  suggested_questions: string[];
  summary: string;
};

const AXIS_LABELS: Record<string, string> = {
  problem_clarity: "Problem Clarity",
  target_users: "Target Users",
  business_model: "Business Model",
  product_scope: "Product Scope",
  tech_feasibility: "Tech Feasibility",
  execution_clarity: "Execution Clarity",
};

export default function ProjectReadiness() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [calculating, setCalculating] = useState(false);

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

  const readinessDetails = project?.readiness_details as ReadinessDetails | null;
  const overallScore = project?.readiness_score || 0;
  const hasData = readinessDetails?.axes && Object.keys(readinessDetails.axes).length > 0;

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-readiness`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ project_id: id }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Calculation failed");
      }
      toast.success("Readiness score calculated!");
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    } catch (e: any) {
      toast.error(e.message || "Failed to calculate readiness");
    } finally {
      setCalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const axes = hasData
    ? Object.entries(readinessDetails!.axes).map(([key, val]) => ({
        name: AXIS_LABELS[key] || key,
        score: val.score,
        reason: val.reason,
      }))
    : [];

  const suggestedQuestions = readinessDetails?.suggested_questions || [];

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link to={`/project/${id}`} className="text-muted-foreground hover:text-foreground">
          {project?.name || "Project"}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">Readiness Check</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {!hasData ? (
          /* No readiness data yet */
          <div className="flex flex-col items-center rounded-xl border bg-card p-12 text-center shadow-soft">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 font-display text-xl font-semibold">Calculate Readiness</h2>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              AI will analyze your project data and conversation history to score how ready your project is for development.
            </p>
            <Button onClick={handleCalculate} disabled={calculating} className="gap-2">
              {calculating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Calculate Readiness Score</>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Overall score */}
            <div className="mb-8 flex items-center gap-6 rounded-xl border bg-card p-6 shadow-soft">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={overallScore >= 75 ? "hsl(var(--success))" : "hsl(var(--warning))"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${overallScore * 2.64} 264`}
                  />
                </svg>
                <span className="absolute font-display text-2xl font-bold">{overallScore}</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-semibold">
                  {overallScore >= 75 ? "Looking good!" : "Almost there"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {readinessDetails?.summary ||
                    (overallScore >= 75
                      ? "Your project is ready to generate the full planning package."
                      : "A few areas need more detail before generating reliable docs.")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCalculate}
                disabled={calculating}
                className="shrink-0 gap-1 text-xs text-muted-foreground"
              >
                {calculating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Recalculate
              </Button>
            </div>

            {/* Axes */}
            <div className="mb-8 space-y-3">
              {axes.map((axis, i) => (
                <motion.div
                  key={axis.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    {axis.score >= 80 ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{axis.name}</p>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            axis.score >= 80 ? "bg-success" : axis.score >= 60 ? "bg-warning" : "bg-primary"
                          }`}
                          style={{ width: `${axis.score}%` }}
                        />
                      </div>
                      {axis.reason && (
                        <p className="mt-1.5 text-xs text-muted-foreground">{axis.reason}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">{axis.score}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Suggested questions */}
            {suggestedQuestions.length > 0 && overallScore < 75 && (
              <div className="mb-8 rounded-xl border bg-card p-5">
                <h3 className="mb-3 font-display text-base font-semibold">Suggested Questions</h3>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, i) => (
                    <Link
                      key={i}
                      to={`/project/${id}/discussion`}
                      className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-3 text-sm transition-colors hover:bg-secondary"
                    >
                      <span className="flex-1">{q}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link to={`/project/${id}/discussion`}>
                <Button variant="outline">Continue Discussion</Button>
              </Link>
              <Link to={`/project/${id}`}>
                <Button className="gap-2">
                  Generate Plan Package <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
