import { motion } from "framer-motion";
import { Sparkles, Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ProjectTemplate = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  problem: string;
  target_users: string;
  desired_outcome: string;
  features: string;
  revenue: string;
  timeline: string;
  budget: string;
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "expense-tracker",
    name: "Personal Finance Tracker",
    category: "Finance",
    emoji: "💰",
    problem: "People struggle to track daily expenses and understand where their money goes, leading to overspending and no savings",
    target_users: "Young professionals aged 22-35 who earn a salary but have no budgeting system, comfortable with mobile apps",
    desired_outcome: "Users can see their spending patterns, set budgets per category, and save 20% more each month within 3 months of use",
    features: "Add expenses by category, monthly budget limits with alerts, spending charts/trends, recurring expense tracking, export to CSV",
    revenue: "Freemium — free for basic tracking, $4.99/month for advanced analytics, investment suggestions, and multi-currency support",
    timeline: "2 weeks for MVP",
    budget: "Low ($0-500)",
  },
  {
    id: "marketplace",
    name: "Local Services Marketplace",
    category: "Marketplace",
    emoji: "🏪",
    problem: "Finding reliable local service providers (cleaners, tutors, handymen) is frustrating — no trusted reviews, no easy booking",
    target_users: "Homeowners aged 30-50 in suburban areas who need services regularly and value trust/reviews over price",
    desired_outcome: "1000 active users in one city, 200 service providers listed, 50+ bookings per week within 6 months",
    features: "Service provider profiles with reviews, search by category/location, booking system, in-app messaging, payment processing",
    revenue: "15% commission on each booking + $29/month premium listing for providers",
    timeline: "1 month for MVP",
    budget: "Medium ($500-5000)",
  },
  {
    id: "saas-tool",
    name: "Team Task Manager",
    category: "SaaS / Productivity",
    emoji: "✅",
    problem: "Small teams (3-10 people) use a mix of spreadsheets, chat, and email to manage tasks — nothing is centralized, things fall through cracks",
    target_users: "Small team leads and project managers at startups/agencies who manage 3-10 people and need simple project visibility",
    desired_outcome: "500 teams using the product within 6 months, with 70%+ weekly active retention and $10K MRR",
    features: "Kanban board, task assignment with deadlines, team member dashboard, email/Slack notifications, file attachments",
    revenue: "SaaS subscription — Free for 3 users, $12/user/month for teams, $29/user/month for business (audit log, SSO)",
    timeline: "1 month for MVP",
    budget: "Low ($0-500)",
  },
  {
    id: "ecommerce",
    name: "Niche E-commerce Store",
    category: "E-commerce",
    emoji: "🛍️",
    problem: "Small artisan/craft makers have products to sell but setting up an online store with Shopify is too complex and expensive for their volume",
    target_users: "Independent artisans and craft makers aged 25-45 who sell 10-100 products and want a simple, beautiful online store",
    desired_outcome: "Makers can launch a store in under 1 hour, process their first online sale within a week, no technical knowledge needed",
    features: "Product catalog with photos, shopping cart, Stripe checkout, order tracking, mobile-optimized storefront, basic analytics",
    revenue: "Freemium — free for up to 10 products, $19/month for unlimited products + analytics, $49/month for custom domain + marketing tools",
    timeline: "2-3 months",
    budget: "Medium ($500-5000)",
  },
  {
    id: "learning",
    name: "AI Study Companion",
    category: "Education",
    emoji: "📚",
    problem: "Students spend hours reading textbooks but retain only 20% — they lack personalized study plans and active recall practice",
    target_users: "University students aged 18-25 who are studying for exams and want to study smarter, not harder",
    desired_outcome: "Students improve test scores by 30%+ and reduce study time by 40% using AI-generated flashcards and practice questions",
    features: "Upload notes/textbook PDFs, AI generates flashcards + quiz questions, spaced repetition scheduler, progress tracking per subject",
    revenue: "Freemium — 3 free subjects, $7.99/month for unlimited subjects + AI tutor chat",
    timeline: "1 month for MVP",
    budget: "Low ($0-500)",
  },
];

export function TemplateSelector({
  onSelect,
}: {
  onSelect: (template: ProjectTemplate) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-display text-lg font-semibold">Start from a Template</h3>
          <p className="text-sm text-muted-foreground">
            Pick a similar project to pre-fill your brief — you can customize everything later.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PROJECT_TEMPLATES.map((tpl, i) => (
          <motion.div
            key={tpl.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <button
              onClick={() => onSelect(tpl)}
              className="group w-full rounded-xl border bg-card p-4 text-left shadow-soft transition-all hover:border-primary/40 hover:shadow-card"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{tpl.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                  <p className="text-[10px] font-medium text-muted-foreground">{tpl.category}</p>
                </div>
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{tpl.problem}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Use this template <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TemplatePreview({
  template,
  onConfirm,
  onBack,
}: {
  template: ProjectTemplate;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const fields = [
    { label: "Problem", value: template.problem },
    { label: "Target Users", value: template.target_users },
    { label: "Desired Outcome", value: template.desired_outcome },
    { label: "Key Features", value: template.features },
    { label: "Revenue Model", value: template.revenue },
    { label: "Timeline", value: template.timeline },
    { label: "Budget", value: template.budget },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-6 shadow-soft"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl">{template.emoji}</span>
        <div>
          <h3 className="font-display text-lg font-semibold">{template.name}</h3>
          <p className="text-xs text-muted-foreground">{template.category} — all fields pre-filled, customize as needed</p>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</p>
            <p className="mt-0.5 text-sm text-foreground">{f.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <Button size="sm" onClick={onConfirm} className="gap-2">
          <Copy className="h-3.5 w-3.5" /> Use Template & Create Project
        </Button>
      </div>
    </motion.div>
  );
}
