import { useState } from "react";
import { Shield, Zap, DollarSign, TrendingUp, Lock, Star, CheckCircle2, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MermaidDiagram from "@/components/MermaidDiagram";

/* ─── Stack Comparison (kept as table + Mermaid decision tree) ─── */

type StackOption = {
  name: string;
  key: string;
  recommended?: boolean;
  layers: Record<string, string>;
  scores: Record<string, number>;
  pros: string[];
  cons: string[];
};

const stackOptions: StackOption[] = [
  {
    name: "Lovable Full Stack",
    key: "lovable",
    recommended: true,
    layers: {
      frontend: "React + Vite + Tailwind CSS",
      backend: "Supabase Edge Functions",
      database: "PostgreSQL (Supabase)",
      payments: "Stripe Checkout",
      deploy: "Lovable Publish + CDN",
      auth: "Supabase Auth (OAuth, Magic Link)",
    },
    scores: { speed: 95, cost: 90, ease: 85, scale: 80, lockIn: 30 },
    pros: ["Fastest time-to-market", "Zero DevOps", "Built-in auth & realtime"],
    cons: ["Supabase ecosystem lock", "Edge Functions limited for heavy compute"],
  },
  {
    name: "Next.js + Vercel",
    key: "nextjs",
    layers: {
      frontend: "Next.js 15 (App Router)",
      backend: "API Routes + tRPC",
      database: "PostgreSQL (Neon)",
      payments: "Stripe SDK",
      deploy: "Vercel Edge",
      auth: "NextAuth.js / Clerk",
    },
    scores: { speed: 70, cost: 65, ease: 55, scale: 90, lockIn: 40 },
    pros: ["SSR/SSG for SEO", "Massive ecosystem", "Flexible deployment"],
    cons: ["Requires dev experience", "Higher setup time", "More moving parts"],
  },
  {
    name: "Shopify Headless",
    key: "shopify",
    layers: {
      frontend: "React Hydrogen",
      backend: "Shopify APIs",
      database: "Shopify-managed",
      payments: "Shopify Payments",
      deploy: "Oxygen CDN",
      auth: "Shopify Customer Accounts",
    },
    scores: { speed: 75, cost: 40, ease: 60, scale: 95, lockIn: 75 },
    pros: ["Battle-tested e-commerce", "Built-in inventory", "PCI compliant"],
    cons: ["High cost at scale", "Vendor lock-in", "Limited customization"],
  },
];

const DECISION_TREE_CHART = `flowchart TD
    A["What are you building?"] --> B{"E-commerce?"}
    B -->|Yes| C{"Need full control?"}
    B -->|No| D{"Technical team?"}
    C -->|Yes| E["Next.js + Vercel"]
    C -->|No| F["Shopify Headless"]
    D -->|Yes| G{"Need SSR/SEO?"}
    D -->|No| H["Lovable Full Stack"]
    G -->|Yes| E
    G -->|No| H

    style H fill:#22c55e,stroke:#16a34a,color:#fff
    style E fill:#3b82f6,stroke:#2563eb,color:#fff
    style F fill:#f59e0b,stroke:#d97706,color:#fff
`;

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

const scoreLabels: Record<string, { label: string; icon: React.ElementType }> = {
  speed: { label: "Dev Speed", icon: Zap },
  cost: { label: "Cost Efficiency", icon: DollarSign },
  ease: { label: "Ease of Use", icon: Star },
  scale: { label: "Scalability", icon: TrendingUp },
  lockIn: { label: "Lock-in Risk", icon: Lock },
};

export function StackComparison() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Decision Tree</h3>
        <MermaidDiagram chart={DECISION_TREE_CHART} />
      </div>

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
                      <ScoreBar value={opt.scores[key]} inverted={key === "lockIn"} />
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
    </div>
  );
}

/* ─── Architecture Flow (Mermaid) ─── */

const ARCHITECTURE_FLOW_CHART = `flowchart TB
    subgraph Client["Client Layer"]
        SPA["React SPA<br/>Vite + TypeScript + Tailwind"]
        State["TanStack Query<br/>+ React Context"]
        Router["React Router v6"]
    end

    subgraph API["API Gateway"]
        SupaClient["Supabase Client<br/>Auth, DB, Storage, Realtime"]
        Edge["Edge Functions<br/>Stripe, Email, AI"]
        REST["REST / RPC<br/>Auto-generated"]
    end

    subgraph Data["Data Layer"]
        PG["PostgreSQL<br/>Products, Orders, Users"]
        RLS["Row-Level Security<br/>Per-user Isolation"]
        Storage["Storage Buckets<br/>Images, Exports"]
    end

    subgraph External["External Services"]
        Stripe["Stripe<br/>Payments & Subscriptions"]
        Email["Resend / SendGrid<br/>Transactional Emails"]
        AI["AI Gateway<br/>AI-powered Features"]
    end

    SPA --> SupaClient
    SPA --> Edge
    State --> SupaClient
    SupaClient --> PG
    SupaClient --> RLS
    SupaClient --> Storage
    Edge --> Stripe
    Edge --> Email
    Edge --> AI
    REST --> PG

    style Client fill:#3b82f620,stroke:#3b82f6
    style API fill:#06b6d420,stroke:#06b6d4
    style Data fill:#22c55e20,stroke:#22c55e
    style External fill:#f59e0b20,stroke:#f59e0b
`;

const DATA_FLOW_CHART = `sequenceDiagram
    participant U as User
    participant R as React App
    participant S as Supabase
    participant E as Edge Function
    participant St as Stripe
    
    U->>R: Interact with UI
    R->>S: Query/Mutate Data
    S-->>R: Realtime Updates
    R->>E: Trigger Action
    E->>St: Process Payment
    St-->>E: Webhook Response
    E->>S: Update Database
    S-->>R: Push Change
    R-->>U: Update UI
`;

export function ArchitectureFlow() {
  const [view, setView] = useState<"layers" | "dataflow">("layers");

  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="layers" className="text-xs">System Layers</TabsTrigger>
          <TabsTrigger value="dataflow" className="text-xs">Data Flow</TabsTrigger>
        </TabsList>
        <TabsContent value="layers" className="mt-4">
          <MermaidDiagram chart={ARCHITECTURE_FLOW_CHART} />
        </TabsContent>
        <TabsContent value="dataflow" className="mt-4">
          <MermaidDiagram chart={DATA_FLOW_CHART} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Migration Path (Mermaid timeline) ─── */

const MIGRATION_CHART = `flowchart LR
    subgraph MVP["Phase 1: MVP<br/>Month 1-2"]
        M1["Lovable + Supabase"]
        M2["Stripe Checkout"]
        M3["Ship & Validate PMF"]
    end

    subgraph Growth["Phase 2: Growth<br/>Month 3-6"]
        G1["Add CDN & Caching"]
        G2["Background Jobs"]
        G3["Analytics Pipeline"]
    end

    subgraph Scale["Phase 3: Scale<br/>Month 6-12"]
        S1["Dedicated DB"]
        S2["Microservices"]
        S3["CI/CD & Monitoring"]
    end

    MVP -->|"1K users"| Growth -->|"10K users"| Scale

    style MVP fill:#22c55e20,stroke:#22c55e
    style Growth fill:#3b82f620,stroke:#3b82f6
    style Scale fill:#a855f720,stroke:#a855f7
`;

export function MigrationPath() {
  return (
    <div className="space-y-4">
      <MermaidDiagram chart={MIGRATION_CHART} />
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { phase: "MVP", time: "Month 1-2", users: "0 - 1K", focus: "Ship fast, validate PMF", color: "border-success/40 bg-success/5" },
          { phase: "Growth", time: "Month 3-6", users: "1K - 10K", focus: "Optimize & add analytics", color: "border-primary/40 bg-primary/5" },
          { phase: "Scale", time: "Month 6-12", users: "10K - 100K", focus: "Team, CI/CD, monitoring", color: "border-accent/40 bg-accent/5" },
        ].map((p, i) => (
          <div key={p.phase} className={`rounded-xl border p-4 ${p.color}`}>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {i + 1}
              </div>
              <p className="text-sm font-semibold">{p.phase}</p>
            </div>
            <p className="text-[10px] font-medium text-primary">{p.time}</p>
            <p className="mt-1 text-xs text-muted-foreground">{p.focus}</p>
            <div className="mt-2 rounded-md bg-muted/50 px-2 py-1">
              <p className="text-[10px] text-muted-foreground">
                Users: <span className="font-medium text-foreground">{p.users}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
