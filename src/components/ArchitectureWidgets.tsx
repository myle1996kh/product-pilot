import { useState, useMemo } from "react";
import { Shield, Zap, DollarSign, TrendingUp, Lock, Star, CheckCircle2, MinusCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MermaidDiagram from "@/components/MermaidDiagram";

/* ─── Types ─── */

type StackOption = {
  name: string;
  key: string;
  recommended?: boolean;
  layers: Record<string, string>;
  scores: Record<string, number>;
  pros: string[];
  cons: string[];
};

type ArchitectureWidgetsProps = {
  sections?: { title: string; content: string }[];
};

/* ─── Parse AI content into structured data ─── */

function extractMermaidFromContent(content: string): string | null {
  const mermaidMatch = content.match(/```mermaid\s*([\s\S]*?)```/);
  return mermaidMatch ? mermaidMatch[1].trim() : null;
}

function parseStackFromContent(content: string): StackOption[] | null {
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* fall through */ }
  return null;
}

/* ─── Score Bar ─── */

const scoreLabels: Record<string, { label: string; icon: React.ElementType }> = {
  speed: { label: "Dev Speed", icon: Zap },
  cost: { label: "Cost Efficiency", icon: DollarSign },
  ease: { label: "Ease of Use", icon: Star },
  scale: { label: "Scalability", icon: TrendingUp },
  lockIn: { label: "Lock-in Risk", icon: Lock },
};

function ScoreBar({ value, inverted }: { value: number; inverted?: boolean }) {
  const display = inverted ? 100 - value : value;
  const color = display >= 75 ? "bg-success" : display >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-muted">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${display}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-medium text-muted-foreground">{display}</span>
    </div>
  );
}

/* ─── No Data Placeholder ─── */

function NoDataPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-8 text-center">
      <AlertTriangle className="mb-2 h-6 w-6 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">
        No {label} data found. Generate the Architecture document to see this visualization.
      </p>
    </div>
  );
}

/* ─── Stack Comparison ─── */

export function StackComparison({ sections }: ArchitectureWidgetsProps) {
  const techStackSection = sections?.find(s =>
    s.title.toLowerCase().includes("tech stack") || s.title.toLowerCase().includes("stack")
  );

  const stackOptions = useMemo(() => {
    if (techStackSection) {
      const parsed = parseStackFromContent(techStackSection.content);
      if (parsed) return parsed;
    }
    return null;
  }, [techStackSection]);

  const decisionTree = useMemo(() => {
    if (techStackSection) {
      return extractMermaidFromContent(techStackSection.content);
    }
    return null;
  }, [techStackSection]);

  if (!stackOptions && !decisionTree) {
    return <NoDataPlaceholder label="Tech Stack" />;
  }

  return (
    <div className="space-y-6">
      {decisionTree && (
        <div>
          <h3 className="mb-3 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Decision Tree</h3>
          <MermaidDiagram chart={decisionTree} />
        </div>
      )}

      {stackOptions && (
        <>
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Score Comparison</h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criteria</th>
                    {stackOptions.map((opt) => (
                      <th key={opt.key} className="px-4 py-3 text-left font-medium">
                        <div className="flex items-center gap-2">
                          {opt.name}
                          {opt.recommended && (
                            <Badge className="bg-success/15 text-success border-success/30 text-[10px]">Best</Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(scoreLabels).map(([key, { label, icon: Icon }]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{label}</span>
                        </div>
                      </td>
                      {stackOptions.map((opt) => (
                        <td key={opt.key} className="px-4 py-3">
                          <ScoreBar value={opt.scores[key] || 0} inverted={key === "lockIn"} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {stackOptions.map((opt) => (
              <div
                key={opt.key}
                className={`rounded-xl border p-4 transition-all ${
                  opt.recommended ? "border-primary/40 bg-primary/5 shadow-card" : "bg-card"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">{opt.name}</p>
                  {opt.recommended && <Star className="h-4 w-4 fill-primary text-primary" />}
                </div>
                <div className="mb-3 space-y-1.5">
                  {Object.entries(opt.layers).map(([layer, tech]) => (
                    <div key={layer} className="flex items-start gap-2">
                      <span className="w-16 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{layer}</span>
                      <span className="text-xs text-foreground">{tech}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <div className="mb-2 space-y-1">
                    {opt.pros.map((p, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {opt.cons.map((c, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs">
                        <MinusCircle className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Architecture Flow (Mermaid) ─── */

export function ArchitectureFlow({ sections }: ArchitectureWidgetsProps) {
  const [view, setView] = useState<"layers" | "dataflow">("layers");

  const archSection = sections?.find(s =>
    s.title.toLowerCase().includes("system architecture") || s.title.toLowerCase().includes("architecture")
  );
  const dataModelSection = sections?.find(s =>
    s.title.toLowerCase().includes("data model") || s.title.toLowerCase().includes("api design")
  );

  const architectureChart = useMemo(() => {
    if (archSection) return extractMermaidFromContent(archSection.content);
    return null;
  }, [archSection]);

  const dataFlowChart = useMemo(() => {
    if (dataModelSection) return extractMermaidFromContent(dataModelSection.content);
    return null;
  }, [dataModelSection]);

  if (!architectureChart && !dataFlowChart) {
    return <NoDataPlaceholder label="Architecture Diagram" />;
  }

  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="bg-muted/50">
          {architectureChart && <TabsTrigger value="layers" className="text-xs">System Layers</TabsTrigger>}
          {dataFlowChart && <TabsTrigger value="dataflow" className="text-xs">Data Flow</TabsTrigger>}
        </TabsList>
        {architectureChart && (
          <TabsContent value="layers" className="mt-4">
            <MermaidDiagram chart={architectureChart} />
          </TabsContent>
        )}
        {dataFlowChart && (
          <TabsContent value="dataflow" className="mt-4">
            <MermaidDiagram chart={dataFlowChart} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

/* ─── Migration Path ─── */

export function MigrationPath({ sections }: ArchitectureWidgetsProps) {
  const planSection = sections?.find(s =>
    s.title.toLowerCase().includes("scalability") ||
    s.title.toLowerCase().includes("infrastructure") ||
    s.title.toLowerCase().includes("deployment")
  );

  const migrationChart = useMemo(() => {
    if (planSection) return extractMermaidFromContent(planSection.content);
    return null;
  }, [planSection]);

  if (!migrationChart) {
    return <NoDataPlaceholder label="Migration Roadmap" />;
  }

  return (
    <div className="space-y-4">
      <MermaidDiagram chart={migrationChart} />
    </div>
  );
}
