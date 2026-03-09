import { Link } from "react-router-dom";
import { Plus, Clock, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const statusBadgeVariant: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground border-border",
  discussing: "bg-info/15 text-info border-info/30",
  ready_to_generate: "bg-warning/15 text-warning-foreground border-warning/30",
  generating: "bg-primary/15 text-primary border-primary/30",
  in_review: "bg-warning/15 text-warning-foreground border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  exported: "bg-success/15 text-success border-success/30",
};

const statusLabel: Record<string, string> = {
  draft: "Draft",
  discussing: "Discussing",
  ready_to_generate: "Ready",
  generating: "Generating...",
  in_review: "In Review",
  approved: "Approved",
  exported: "Exported",
};

function ReadinessBar({ value }: { value: number }) {
  const color =
    value >= 85 ? "bg-success" : value >= 60 ? "bg-warning" : "bg-primary";
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-muted">
        <div
          className={`h-2 rounded-full ${color} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{value}%</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ""} ☀️
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pick up where you left off, or start something new.
        </p>
      </motion.div>

      {/* Quick action */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-10"
      >
        <Link to="/create">
          <div className="group flex items-center gap-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-6 py-5 transition-all hover:border-primary/50 hover:bg-primary/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary transition-transform group-hover:scale-105">
              <Plus className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Start a new project</p>
              <p className="text-sm text-muted-foreground">
                Turn your idea into a production-ready plan
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </motion.div>

      {/* Projects */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-4 font-display text-xl font-semibold">Your Projects</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/50 py-12 text-center">
            <p className="text-muted-foreground">No projects yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
              >
                <Link to={`/project/${project.id}`}>
                  <div className="group rounded-xl border bg-card p-5 shadow-soft transition-all hover:shadow-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                          <Sparkles className="h-4 w-4 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{project.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(project.updated_at), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={
                            statusBadgeVariant[project.status] || statusBadgeVariant.draft
                          }
                        >
                          {statusLabel[project.status] || project.status}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="mb-1.5 text-xs text-muted-foreground">
                        Readiness Score
                      </p>
                      <ReadinessBar value={project.readiness_score || 0} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
