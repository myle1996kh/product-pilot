import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const axes = [
  { name: "Problem Clarity", score: 90, status: "good" },
  { name: "Business Clarity", score: 72, status: "warn" },
  { name: "Product Scope", score: 85, status: "good" },
  { name: "Tech Feasibility", score: 60, status: "warn" },
  { name: "Execution Clarity", score: 55, status: "low" },
];

const suggestedQuestions = [
  "How will you monetize the product in the first 6 months?",
  "What's your expected user volume at launch?",
  "Do you have any existing systems this needs to integrate with?",
];

export default function ProjectReadiness() {
  const { id } = useParams();
  const overallScore = Math.round(axes.reduce((a, b) => a + b.score, 0) / axes.length);

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link to={`/project/${id}`} className="text-muted-foreground hover:text-foreground">
          E-commerce MVP
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">Readiness Check</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {/* Overall score */}
        <div className="mb-8 flex items-center gap-6 rounded-xl border bg-card p-6 shadow-soft">
          <div className="relative flex h-24 w-24 items-center justify-center">
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
          <div>
            <h2 className="font-display text-xl font-semibold">
              {overallScore >= 75 ? "Looking good!" : "Almost there"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {overallScore >= 75
                ? "Your project is ready to generate the full planning package."
                : "A few areas need more detail before generating reliable docs."}
            </p>
          </div>
        </div>

        {/* Axes */}
        <div className="mb-8 space-y-3">
          {axes.map((axis, i) => (
            <motion.div
              key={axis.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 rounded-lg border bg-card p-4"
            >
              {axis.score >= 80 ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
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
              </div>
              <span className="text-sm font-semibold text-muted-foreground">{axis.score}</span>
            </motion.div>
          ))}
        </div>

        {/* Suggested questions */}
        {overallScore < 75 && (
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
          <Link to={`/project/${id}/review`}>
            <Button className="gap-2">
              Generate Plan Package <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
