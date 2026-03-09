import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Circle, TrendingUp } from "lucide-react";

type ReadinessAxis = {
  key: string;
  label: string;
  score: number; // 0-100
  status: "empty" | "partial" | "complete";
};

const AXIS_CONFIG: Record<string, { label: string; emoji: string }> = {
  problem_clarity: { label: "Problem", emoji: "🎯" },
  target_users: { label: "Users", emoji: "👥" },
  business_model: { label: "Business", emoji: "💰" },
  product_scope: { label: "Scope", emoji: "📦" },
  tech_feasibility: { label: "Tech", emoji: "⚙️" },
  execution_clarity: { label: "Execution", emoji: "🚀" },
};

export function computeFieldReadiness(filledFields: Record<string, string>): ReadinessAxis[] {
  const axisFields: Record<string, string[]> = {
    problem_clarity: ["problem", "desired_outcome"],
    target_users: ["target_users"],
    business_model: ["revenue"],
    product_scope: ["features"],
    tech_feasibility: ["tech_pref"],
    execution_clarity: ["timeline", "budget"],
  };

  return Object.entries(axisFields).map(([axisKey, fields]) => {
    const filled = fields.filter(f => filledFields[f] && filledFields[f].length > 10);
    const partial = fields.filter(f => filledFields[f] && filledFields[f].length > 0 && filledFields[f].length <= 10);
    
    let score = 0;
    if (filled.length === fields.length) score = 100;
    else if (filled.length > 0) score = Math.round((filled.length / fields.length) * 80);
    else if (partial.length > 0) score = 30;

    const status = score >= 80 ? "complete" : score > 0 ? "partial" : "empty";

    return {
      key: axisKey,
      label: AXIS_CONFIG[axisKey]?.label || axisKey,
      score,
      status,
    };
  });
}

export function LiveReadinessSidebar({
  axes,
  overallScore,
}: {
  axes: ReadinessAxis[];
  overallScore: number;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border bg-card shadow-soft">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Readiness</p>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={overallScore >= 75 ? "hsl(var(--success))" : overallScore >= 40 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${overallScore * 2.64} 264`}
              />
            </svg>
            <span className="absolute text-sm font-bold">{overallScore}</span>
          </div>
          <div>
            <p className="text-xs font-medium">
              {overallScore >= 75 ? "Ready to generate!" : overallScore >= 40 ? "Getting there..." : "Keep chatting"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {overallScore >= 75
                ? "Your project has enough detail"
                : `${100 - overallScore}% more info needed`}
            </p>
          </div>
        </div>
      </div>

      {/* Axes */}
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {axes.map((axis, i) => {
          const config = AXIS_CONFIG[axis.key];
          return (
            <motion.div
              key={axis.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5"
            >
              <span className="text-sm">{config?.emoji || "📋"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium">{axis.label}</p>
                  {axis.status === "complete" ? (
                    <CheckCircle2 className="h-3 w-3 text-success" />
                  ) : axis.status === "partial" ? (
                    <AlertTriangle className="h-3 w-3 text-warning" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground/40" />
                  )}
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                  <motion.div
                    className={`h-1.5 rounded-full ${
                      axis.score >= 80 ? "bg-success" : axis.score >= 40 ? "bg-warning" : "bg-muted-foreground/30"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${axis.score}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
