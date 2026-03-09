import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { StackComparison, ArchitectureFlow, MigrationPath } from "@/components/ArchitectureWidgets";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const tabs = [
  { value: "overview", label: "Overview", icon: FileText },
  { value: "business", label: "Business", icon: BarChart3 },
  { value: "prd", label: "PRD", icon: FileText },
  { value: "architecture", label: "Architecture", icon: Cpu },
  { value: "roadmap", label: "Roadmap", icon: Map },
  { value: "risks", label: "Risks", icon: AlertTriangle },
  { value: "export", label: "Export", icon: Download },
];

type SectionStatus = "draft" | "needs_review" | "approved" | "locked";

const sectionStatusConfig: Record<SectionStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-secondary text-secondary-foreground" },
  needs_review: { label: "Needs Review", className: "bg-warning/15 text-warning-foreground" },
  approved: { label: "Approved", className: "bg-success/15 text-success" },
  locked: { label: "Locked", className: "bg-muted text-muted-foreground" },
};

function Section({
  title,
  status,
  children,
}: {
  title: string;
  status: SectionStatus;
  children: React.ReactNode;
}) {
  const config = sectionStatusConfig[status];
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
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
            <MessageSquare className="mr-1 h-3 w-3" /> Comment
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
            <RefreshCw className="mr-1 h-3 w-3" /> Regenerate
          </Button>
        </div>
      </div>
      <div className="text-sm leading-relaxed text-foreground/80">{children}</div>
    </div>
  );
}

export default function ProjectReview() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="px-8 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link to={`/project/${id}`} className="text-muted-foreground hover:text-foreground">
          E-commerce MVP
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">Plan Review</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Plan Review Hub</h1>
            <p className="text-sm text-muted-foreground">
              Review, comment, and approve each section before export.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">v1.2</Badge>
            <Link to={`/project/${id}/export`}>
              <Button size="sm" className="gap-2">
                <Download className="h-3.5 w-3.5" /> Export Package
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 h-auto flex-wrap gap-1 bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Section title="Problem Statement" status="approved">
              <p>
                Small e-commerce brands struggle to launch online stores quickly
                without technical expertise. Current solutions are either too
                complex (Shopify customization) or too limiting (basic website
                builders).
              </p>
            </Section>
            <Section title="Goals & Non-Goals" status="needs_review">
              <p>
                <strong>Goals:</strong> Launch a single-brand storefront with
                product catalog, cart, and checkout within 2 weeks. Support
                mobile-first design.
              </p>
              <p className="mt-2">
                <strong>Non-Goals:</strong> Multi-vendor marketplace,
                subscription management, enterprise inventory integration.
              </p>
            </Section>
            <Section title="Target Users" status="draft">
              <p>
                Primary: Solo founders and small brand owners (1–5 person team)
                launching their first online store. Secondary: Agencies building
                stores for clients.
              </p>
            </Section>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <Section title="Revenue Model" status="draft">
              <p>
                Freemium SaaS with tiered pricing. Free tier for up to 10
                products. Pro ($29/mo) for unlimited products + analytics.
                Business ($99/mo) for multi-store + API access.
              </p>
            </Section>
            <Section title="Market Analysis" status="draft">
              <p>
                TAM: $6.3B global e-commerce platform market. SAM: $890M
                small-brand segment. SOM: $12M targeting bootstrapped founders.
              </p>
            </Section>
          </TabsContent>

          <TabsContent value="prd" className="space-y-4">
            <Section title="Functional Requirements" status="needs_review">
              <ul className="list-disc space-y-1 pl-5">
                <li>Product catalog with categories, variants, and images</li>
                <li>Shopping cart with persistent session</li>
                <li>Checkout flow with Stripe integration</li>
                <li>Order management dashboard</li>
                <li>Customer email notifications (order confirmation, shipping)</li>
              </ul>
            </Section>
            <Section title="Non-Functional Requirements" status="draft">
              <ul className="list-disc space-y-1 pl-5">
                <li>Page load time p95 &lt; 2s</li>
                <li>99.9% uptime SLA</li>
                <li>GDPR-compliant data handling</li>
                <li>Mobile-first responsive design</li>
              </ul>
            </Section>
            <Section title="Acceptance Criteria" status="draft">
              <p>
                Each feature must include happy path, edge case, and failure
                scenarios. Automated tests required for checkout and payment
                flows.
              </p>
            </Section>
          </TabsContent>

          <TabsContent value="architecture" className="space-y-4">
            <Section title="Stack Comparison" status="approved">
              <StackComparison />
            </Section>
            <Section title="Architecture Overview" status="approved">
              <ArchitectureFlow />
            </Section>
            <Section title="Migration Path (MVP → Scale)" status="needs_review">
              <MigrationPath />
            </Section>
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-4">
            <Section title="MVP Milestones" status="draft">
              <div className="space-y-3">
                {[
                  { week: "Week 1-2", task: "Core storefront + product catalog" },
                  { week: "Week 3-4", task: "Cart + checkout + Stripe" },
                  { week: "Week 5-6", task: "Order management + notifications" },
                  { week: "Week 7-8", task: "Testing + launch prep" },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-20 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
                      {m.week}
                    </div>
                    <p className="text-sm">{m.task}</p>
                  </div>
                ))}
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="risks" className="space-y-4">
            <Section title="Identified Risks" status="needs_review">
              <div className="space-y-3">
                {[
                  { risk: "Stripe integration complexity", impact: "High", mitigation: "Use pre-built Stripe components" },
                  { risk: "Scope creep from feature requests", impact: "Medium", mitigation: "Strict MVP scope with change request process" },
                  { risk: "Performance at scale", impact: "Low", mitigation: "CDN + lazy loading from day 1" },
                ].map((r, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{r.risk}</p>
                      <Badge variant="outline" className={
                        r.impact === "High" ? "border-destructive/30 text-destructive" :
                        r.impact === "Medium" ? "border-warning/30 text-warning" :
                        "border-muted-foreground/30 text-muted-foreground"
                      }>
                        {r.impact}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Mitigation: {r.mitigation}</p>
                  </div>
                ))}
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <ExportCenter projectId={id} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function ExportCenter({ projectId }: { projectId?: string }) {
  const artifacts = [
    { name: "01_idea_brief.md", ready: true },
    { name: "02_research_summary.md", ready: true },
    { name: "03_business_model.md", ready: false },
    { name: "04_proposal.md", ready: false },
    { name: "05_prd.md", ready: true },
    { name: "06_architecture.md", ready: true },
    { name: "07_execution_plan.md", ready: false },
    { name: "08_lovable_handoff.md", ready: true },
    { name: "09_project_intro_deck.pptx", ready: false },
  ];

  const readyCount = artifacts.filter((a) => a.ready).length;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5 shadow-soft">
        <h3 className="mb-1 font-display text-base font-semibold">Export Package</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {readyCount} of {artifacts.length} artifacts ready for export
        </p>
        <div className="space-y-2">
          {artifacts.map((a) => (
            <div key={a.name} className="flex items-center gap-3 rounded-lg bg-secondary/30 px-4 py-2.5">
              {a.ready ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className="flex-1 font-mono text-xs">{a.name}</span>
              {a.ready && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  Preview
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Download .zip
        </Button>
        <Button className="gap-2">
          <Download className="h-4 w-4" /> Lovable Handoff
        </Button>
      </div>
    </div>
  );
}
