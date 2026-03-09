import { Link } from "react-router-dom";
import { Plus, Clock, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockProjects = [
  {
    id: 1,
    name: "E-commerce MVP",
    status: "In Review",
    readiness: 82,
    updated: "2 hours ago",
    statusColor: "warning" as const,
  },
  {
    id: 2,
    name: "SaaS Dashboard",
    status: "Draft",
    readiness: 45,
    updated: "1 day ago",
    statusColor: "secondary" as const,
  },
  {
    id: 3,
    name: "Mobile App",
    status: "Ready",
    readiness: 94,
    updated: "3 days ago",
    statusColor: "success" as const,
  },
];

const statusBadgeVariant: Record<string, string> = {
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  secondary: "bg-secondary text-secondary-foreground border-border",
  success: "bg-success/15 text-success border-success/30",
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
  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Good morning ☀️
        </h1>
        <p className="mt-1 text-muted-foreground">
          Pick up where you left off, or start something new.
        </p>
      </motion.div>

      {/* Quick actions */}
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Your Projects</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all
          </Button>
        </div>

        <div className="space-y-3">
          {mockProjects.map((project, i) => (
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
                        <p className="font-medium text-foreground">
                          {project.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {project.updated}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={statusBadgeVariant[project.statusColor]}
                      >
                        {project.status === "Ready" && (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        )}
                        {project.status === "In Review" && (
                          <AlertCircle className="mr-1 h-3 w-3" />
                        )}
                        {project.status}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="mb-1.5 text-xs text-muted-foreground">
                      Readiness Score
                    </p>
                    <ReadinessBar value={project.readiness} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
