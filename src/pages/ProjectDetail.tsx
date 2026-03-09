import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Gauge,
  ClipboardCheck,
  Download,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";

const quickLinks = [
  {
    to: "discussion",
    icon: MessageSquare,
    label: "Discussion",
    desc: "Continue refining your idea with AI",
    color: "bg-primary/10 text-primary",
  },
  {
    to: "readiness",
    icon: Gauge,
    label: "Readiness Check",
    desc: "See what's still missing",
    color: "bg-warning/10 text-warning",
  },
  {
    to: "review",
    icon: ClipboardCheck,
    label: "Plan Review",
    desc: "Review and approve your documents",
    color: "bg-success/10 text-success",
  },
  {
    to: "review?tab=export",
    icon: Download,
    label: "Export",
    desc: "Download your planning package",
    color: "bg-info/10 text-info",
  },
];

export default function ProjectDetail() {
  const { id } = useParams();

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">E-commerce MVP</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Last updated 2 hours ago
            </div>
          </div>
        </div>

        {/* Quick links grid */}
        <div className="grid grid-cols-2 gap-4">
          {quickLinks.map((link, i) => (
            <motion.div
              key={link.to}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Link to={`/project/${id}/${link.to}`}>
                <div className="group rounded-xl border bg-card p-5 shadow-soft transition-all hover:shadow-card">
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${link.color}`}>
                    <link.icon className="h-5 w-5" />
                  </div>
                  <p className="font-medium text-foreground">{link.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{link.desc}</p>
                  <ArrowRight className="mt-3 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
