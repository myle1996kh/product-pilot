import { Shield, Zap, DollarSign, TrendingUp, Lock, Star, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StackOption = {
  name: string;
  recommended?: boolean;
  layers: {
    frontend: string;
    backend: string;
    database: string;
    payments: string;
    deploy: string;
    auth: string;
  };
  scores: {
    speed: number;
    cost: number;
    difficulty: number;
    scalability: number;
    lockIn: number;
  };
  pros: string[];
  cons: string[];
};

const stackOptions: StackOption[] = [
  {
    name: "Option A — Lovable Full Stack",
    recommended: true,
    layers: {
      frontend: "React + Vite + Tailwind CSS",
      backend: "Supabase Edge Functions",
      database: "PostgreSQL (Supabase)",
      payments: "Stripe Checkout",
      deploy: "Lovable Publish + CDN",
      auth: "Supabase Auth (OAuth, Magic Link)",
    },
    scores: { speed: 95, cost: 90, difficulty: 85, scalability: 80, lockIn: 30 },
    pros: [
      "Fastest time-to-market via Lovable",
      "Zero DevOps overhead",
      "Built-in auth, storage, realtime",
    ],
    cons: [
      "Tied to Supabase ecosystem",
      "Edge Functions limited for heavy compute",
    ],
  },
  {
    name: "Option B — Next.js + Vercel",
    layers: {
      frontend: "Next.js 15 (App Router)",
      backend: "Next.js API Routes + tRPC",
      database: "PostgreSQL (Neon / PlanetScale)",
      payments: "Stripe SDK",
      deploy: "Vercel Edge Network",
      auth: "NextAuth.js / Clerk",
    },
    scores: { speed: 70, cost: 65, difficulty: 55, scalability: 90, lockIn: 40 },
    pros: [
      "SSR/SSG for SEO performance",
      "Massive ecosystem & community",
      "Flexible deployment options",
    ],
    cons: [
      "Requires dev experience",
      "Higher initial setup time",
      "More moving parts to maintain",
    ],
  },
  {
    name: "Option C — Shopify + Headless",
    layers: {
      frontend: "React Storefront (Hydrogen)",
      backend: "Shopify APIs + Webhooks",
      database: "Shopify-managed",
      payments: "Shopify Payments / Stripe",
      deploy: "Oxygen (Shopify CDN)",
      auth: "Shopify Customer Accounts",
    },
    scores: { speed: 75, cost: 40, difficulty: 60, scalability: 95, lockIn: 75 },
    pros: [
      "Battle-tested e-commerce features",
      "Built-in inventory & order management",
      "PCI compliance out of the box",
    ],
    cons: [
      "High monthly cost at scale",
      "Vendor lock-in risk",
      "Limited customization flexibility",
    ],
  },
];

const scoreLabels: Record<string, { label: string; icon: React.ElementType }> = {
  speed: { label: "Dev Speed", icon: Zap },
  cost: { label: "Cost Efficiency", icon: DollarSign },
  difficulty: { label: "Ease of Use", icon: Star },
  scalability: { label: "Scalability", icon: TrendingUp },
  lockIn: { label: "Lock-in Risk", icon: Lock },
};

function ScoreBar({ value, inverted }: { value: number; inverted?: boolean }) {
  const displayValue = inverted ? 100 - value : value;
  const color = displayValue >= 75 ? "bg-success" : displayValue >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-muted">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${displayValue}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-medium text-muted-foreground">{displayValue}</span>
    </div>
  );
}

export function StackComparison() {
  return (
    <div className="space-y-4">
      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criteria</th>
              {stackOptions.map((opt) => (
                <th key={opt.name} className="px-4 py-3 text-left font-medium">
                  <div className="flex items-center gap-2">
                    {opt.name.split("—")[1]?.trim() || opt.name}
                    {opt.recommended && (
                      <Badge className="bg-success/15 text-success border-success/30 text-[10px]">
                        Recommended
                      </Badge>
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
                  <td key={opt.name} className="px-4 py-3">
                    <ScoreBar
                      value={opt.scores[key as keyof typeof opt.scores]}
                      inverted={key === "lockIn"}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stack details */}
      <div className="grid gap-4 lg:grid-cols-3">
        {stackOptions.map((opt) => (
          <div
            key={opt.name}
            className={`rounded-xl border p-4 transition-all ${
              opt.recommended
                ? "border-primary/40 bg-primary/5 shadow-card"
                : "bg-card"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">{opt.name.split("—")[0].trim()}</p>
              {opt.recommended && <Star className="h-4 w-4 fill-primary text-primary" />}
            </div>
            <div className="mb-3 space-y-1.5">
              {Object.entries(opt.layers).map(([layer, tech]) => (
                <div key={layer} className="flex items-start gap-2">
                  <span className="w-16 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {layer}
                  </span>
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

export function ArchitectureFlow() {
  const layers = [
    {
      name: "Client Layer",
      color: "bg-primary/10 border-primary/30",
      dotColor: "bg-primary",
      items: [
        { label: "React SPA", desc: "Vite + TypeScript + Tailwind" },
        { label: "State Mgmt", desc: "TanStack Query + React Context" },
        { label: "Routing", desc: "React Router v6" },
      ],
    },
    {
      name: "API Gateway",
      color: "bg-info/10 border-info/30",
      dotColor: "bg-info",
      items: [
        { label: "Supabase Client", desc: "Auth, DB, Storage, Realtime" },
        { label: "Edge Functions", desc: "Stripe webhooks, emails, AI" },
        { label: "REST / RPC", desc: "Auto-generated from schema" },
      ],
    },
    {
      name: "Data Layer",
      color: "bg-success/10 border-success/30",
      dotColor: "bg-success",
      items: [
        { label: "PostgreSQL", desc: "Products, orders, users, sessions" },
        { label: "Row-Level Security", desc: "Per-user data isolation" },
        { label: "Storage Buckets", desc: "Product images, exports" },
      ],
    },
    {
      name: "External Services",
      color: "bg-warning/10 border-warning/30",
      dotColor: "bg-warning",
      items: [
        { label: "Stripe", desc: "Payments, subscriptions, invoices" },
        { label: "Resend / SendGrid", desc: "Transactional emails" },
        { label: "Lovable AI Gateway", desc: "AI-powered features" },
      ],
    },
  ];

  return (
    <div className="space-y-3">
      {layers.map((layer, layerIdx) => (
        <div key={layer.name}>
          <div className={`rounded-xl border p-4 ${layer.color}`}>
            <div className="mb-3 flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${layer.dotColor}`} />
              <p className="text-xs font-semibold uppercase tracking-wider">{layer.name}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {layer.items.map((item) => (
                <div key={item.label} className="rounded-lg bg-background/70 px-3 py-2.5 backdrop-blur-sm">
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          {layerIdx < layers.length - 1 && (
            <div className="flex justify-center py-1">
              <div className="flex flex-col items-center">
                <div className="h-3 w-px bg-border" />
                <div className="h-1.5 w-1.5 rotate-45 border-b border-r border-border" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function MigrationPath() {
  const phases = [
    {
      phase: "MVP",
      timeline: "Month 1-2",
      stack: "Lovable + Supabase + Stripe Checkout",
      focus: "Ship fast, validate product-market fit",
      users: "0 - 1K",
    },
    {
      phase: "Growth",
      timeline: "Month 3-6",
      stack: "Add CDN, caching layer, background jobs",
      focus: "Optimize performance, add analytics",
      users: "1K - 10K",
    },
    {
      phase: "Scale",
      timeline: "Month 6-12",
      stack: "Dedicated DB, microservices for payments",
      focus: "Team onboarding, CI/CD, monitoring",
      users: "10K - 100K",
    },
  ];

  return (
    <div className="flex gap-3">
      {phases.map((p, i) => (
        <div key={p.phase} className="relative flex-1">
          <div className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {i + 1}
              </div>
              <p className="text-sm font-semibold">{p.phase}</p>
            </div>
            <p className="text-[10px] font-medium text-primary">{p.timeline}</p>
            <p className="mt-2 text-xs text-foreground">{p.stack}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{p.focus}</p>
            <div className="mt-2 rounded-md bg-muted/50 px-2 py-1">
              <p className="text-[10px] text-muted-foreground">
                Users: <span className="font-medium text-foreground">{p.users}</span>
              </p>
            </div>
          </div>
          {i < phases.length - 1 && (
            <div className="absolute -right-2 top-1/2 z-10 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-border text-[8px] text-muted-foreground">
              →
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
