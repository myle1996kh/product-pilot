import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, Lightbulb, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type DiscussionField = {
  key: string;
  label: string;
  description: string;
  axis: string; // maps to readiness axis
  status: "empty" | "partial" | "complete";
  value?: string;
};

export const DISCUSSION_FIELDS: DiscussionField[] = [
  { key: "problem", label: "Problem Statement", description: "What problem are you solving?", axis: "problem_clarity", status: "empty" },
  { key: "target_users", label: "Target Users", description: "Who specifically will use this?", axis: "target_users", status: "empty" },
  { key: "desired_outcome", label: "Desired Outcome", description: "What does success look like?", axis: "problem_clarity", status: "empty" },
  { key: "features", label: "Key Features", description: "What should it do? (MVP scope)", axis: "product_scope", status: "empty" },
  { key: "revenue", label: "Revenue Model", description: "How will you make money?", axis: "business_model", status: "empty" },
  { key: "tech_pref", label: "Tech Preferences", description: "Any tech constraints or preferences?", axis: "tech_feasibility", status: "empty" },
  { key: "timeline", label: "Timeline", description: "When do you need this launched?", axis: "execution_clarity", status: "empty" },
  { key: "budget", label: "Budget", description: "What's your budget range?", axis: "execution_clarity", status: "empty" },
];

type QuickOption = {
  label: string;
  value: string;
};

type StructuredCardProps = {
  question: string;
  description?: string;
  options?: QuickOption[];
  examples?: string[];
  onSelect: (value: string) => void;
  allowCustom?: boolean;
};

export function StructuredCard({
  question,
  description,
  options,
  examples,
  onSelect,
  allowCustom = true,
}: StructuredCardProps) {
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-primary/20 bg-card p-5 shadow-soft"
    >
      <div className="mb-1 flex items-start gap-2">
        <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">{question}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {options && options.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs font-medium text-foreground transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {examples && examples.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="h-3 w-3" /> Examples
          </p>
          <div className="space-y-1.5">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => onSelect(ex)}
                className="block w-full rounded-lg bg-muted/50 px-3 py-2 text-left text-xs text-muted-foreground transition-all hover:bg-primary/5 hover:text-foreground"
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>
      )}

      {allowCustom && (
        <div className="mt-3">
          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              className="text-xs text-primary hover:underline"
            >
              Or type your own answer →
            </button>
          ) : (
            <div className="flex gap-2">
              <Input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Type your answer..."
                className="text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customInput.trim()) {
                    onSelect(customInput.trim());
                    setCustomInput("");
                  }
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => {
                  if (customInput.trim()) {
                    onSelect(customInput.trim());
                    setCustomInput("");
                  }
                }}
              >
                Send
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Structured prompts for each discussion field
export const FIELD_PROMPTS: Record<string, { question: string; description: string; options?: QuickOption[]; examples?: string[] }> = {
  problem: {
    question: "What problem are you trying to solve?",
    description: "Describe the pain point your users face. Be specific about who feels this pain and when.",
    options: [
      { label: "💰 Managing money", value: "People struggle to track their spending and budget effectively" },
      { label: "⏰ Saving time", value: "Users waste hours on repetitive tasks that could be automated" },
      { label: "🤝 Connecting people", value: "There's no easy way for people in my niche to find and connect with each other" },
      { label: "📚 Learning something", value: "Current learning tools are too complex or not personalized enough" },
    ],
    examples: [
      "Small business owners can't easily create professional invoices and track payments without expensive software",
      "Parents struggle to find reliable, vetted babysitters in their neighborhood on short notice",
      "Freelancers waste 5+ hours/week on manual time tracking and client reporting",
    ],
  },
  target_users: {
    question: "Who exactly will use this product?",
    description: "Be as specific as possible. Age, occupation, tech skill level, location...",
    options: [
      { label: "🧑‍💼 Professionals", value: "Working professionals aged 25-45 who are comfortable with basic apps" },
      { label: "🏪 Small business", value: "Small business owners (1-10 employees) with limited tech budget" },
      { label: "🎓 Students", value: "University students aged 18-25 who are always on their phones" },
      { label: "👤 Just me", value: "Primarily for my own use, with potential to expand to others like me" },
    ],
    examples: [
      "Solo founders aged 25-40 building their first startup, with no technical background",
      "Stay-at-home parents who need to manage household budgets on mobile",
      "Small restaurant owners who want to take online orders but hate complex software",
    ],
  },
  desired_outcome: {
    question: "What does success look like for this product?",
    description: "Imagine it's 6 months from now and everything went well. What happened?",
    options: [
      { label: "📈 Users love it", value: "1000+ active users who use the product daily and recommend it to friends" },
      { label: "💵 Making money", value: "Generating consistent revenue that covers costs with growing profit margin" },
      { label: "🎯 Problem solved", value: "The core problem is solved for myself and I can share it with others" },
      { label: "🚀 Got funded", value: "Strong enough traction to raise seed funding from investors" },
    ],
    examples: [
      "100 paying customers at $29/month, with 80%+ retention rate",
      "I can manage all my finances in one place without using spreadsheets",
      "Small businesses save 10+ hours/week on admin tasks compared to their current workflow",
    ],
  },
  features: {
    question: "What are the must-have features for your MVP?",
    description: "Pick only the essentials. What's the minimum your product needs to solve the core problem?",
    options: [
      { label: "🔐 User accounts", value: "User registration, login, and personal dashboard" },
      { label: "📊 Dashboard", value: "A main dashboard showing key data and insights" },
      { label: "💳 Payments", value: "Accept payments via credit card or digital wallets" },
      { label: "📱 Mobile-first", value: "Must work great on mobile phones as primary device" },
    ],
    examples: [
      "User signup, add expenses manually, categorize spending, view monthly summary chart",
      "Create projects, invite team members, track tasks with kanban board, send notifications",
      "Browse products, add to cart, checkout with Stripe, receive order confirmation email",
    ],
  },
  revenue: {
    question: "How will this product make money?",
    description: "Even if you're not sure yet, pick the model closest to your thinking.",
    options: [
      { label: "📦 Subscription", value: "Monthly/yearly subscription (SaaS model) — users pay recurring fee for access" },
      { label: "🆓 Freemium", value: "Free basic tier with paid premium features — convert free users to paid" },
      { label: "🛒 Per transaction", value: "Take a small fee per transaction or sale made through the platform" },
      { label: "🎁 Free / Donation", value: "Free to use, maybe accept donations or tips — not focused on revenue yet" },
    ],
    examples: [
      "Free for up to 3 projects, $9/month for unlimited, $29/month for team features",
      "Take 2.5% commission on each transaction processed through the platform",
      "Free for personal use, $19/month for business features like reports and exports",
    ],
  },
  tech_pref: {
    question: "Any technical preferences or constraints?",
    description: "Do you have preferences for technology, hosting, or integrations? It's OK to say 'no idea'!",
    options: [
      { label: "🤷 No idea", value: "I have no technical preferences — recommend whatever works best and fastest" },
      { label: "📱 Mobile app", value: "It should be a mobile app (iOS/Android) or at least mobile-optimized web app" },
      { label: "🌐 Web app", value: "A web application accessible from any browser is fine" },
      { label: "🔌 Integrations", value: "Needs to integrate with existing tools (Stripe, Google, Slack, etc.)" },
    ],
    examples: [
      "No technical preference, just make it fast and easy to maintain",
      "Must work offline for field workers, sync when back online",
      "Need to integrate with Shopify for product data and Stripe for payments",
    ],
  },
  timeline: {
    question: "When do you need the first version ready?",
    description: "This helps determine how much scope is realistic for your MVP.",
    options: [
      { label: "⚡ 1-2 weeks", value: "1-2 weeks — I need something very basic, very fast" },
      { label: "🏃 1 month", value: "1 month — enough time for a solid MVP with core features" },
      { label: "📅 2-3 months", value: "2-3 months — I want a polished product with good UX" },
      { label: "🧘 No rush", value: "No strict deadline — quality matters more than speed" },
    ],
  },
  budget: {
    question: "What's your budget for building this?",
    description: "This determines which tools and approaches we recommend.",
    options: [
      { label: "🆓 $0 (DIY)", value: "Zero budget — I'll do everything myself with free tools" },
      { label: "💰 Low ($0-500)", value: "Low budget ($0-500) — using affordable tools and services" },
      { label: "💰💰 Medium ($500-5K)", value: "Medium budget ($500-5000) — can afford some paid tools and services" },
      { label: "💰💰💰 High ($5K+)", value: "High budget ($5000+) — can hire developers or use premium services" },
    ],
  },
};

// Progress tracker component
export function ProgressTracker({ fields }: { fields: DiscussionField[] }) {
  const completed = fields.filter(f => f.status === "complete").length;
  const total = fields.length;
  const percent = Math.round((completed / total) * 100);

  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Progress: {completed}/{total} fields
        </p>
        <span className="text-xs font-semibold text-primary">{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <motion.div
          className="h-2 rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {fields.map((f) => (
          <div
            key={f.key}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
              f.status === "complete"
                ? "bg-success/10 text-success"
                : f.status === "partial"
                ? "bg-warning/10 text-warning"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f.status === "complete" && <CheckCircle2 className="h-2.5 w-2.5" />}
            {f.label}
          </div>
        ))}
      </div>
    </div>
  );
}
