import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Loader2,
  Sparkles,
  Presentation,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PresentationViewer, { SlideData } from "@/components/PresentationViewer";

// Elon Musk first-principles slide framework
function buildDefaultSlides(project: any): SlideData[] {
  return [
    {
      id: "title",
      layout: "title",
      title: project.name || "Untitled Project",
      subtitle: project.problem_statement
        ? `Solving: ${project.problem_statement}`
        : "A first-principles approach to building what matters",
    },
    {
      id: "quote-1",
      layout: "quote",
      quote: "When something is important enough, you do it even if the odds are not in your favor.",
      quoteAuthor: "Elon Musk",
    },
    {
      id: "problem",
      layout: "section",
      subtitle: "First Principles",
      title: "The Problem",
      content: project.problem_statement || "What fundamental problem exists that we must solve?",
    },
    {
      id: "why-now",
      layout: "bullets",
      title: "Why Now?",
      bullets: [
        "Technology convergence makes this newly possible",
        "Market timing: existing solutions are outdated or missing",
        "User behavior has shifted — demand is real",
      ],
    },
    {
      id: "users",
      layout: "two-column",
      title: "Who Are We Building For?",
      leftContent: project.target_users || "Our target user is someone who faces this problem daily and has no good solution.",
      rightBullets: [
        "First-time founders with ideas",
        "Non-technical creators",
        "People tired of garbage-in, garbage-out",
      ],
    },
    {
      id: "solution",
      layout: "section",
      subtitle: "10x Better",
      title: "Our Solution",
      content: project.desired_outcome || "Build something 10x better than existing alternatives — not incrementally better.",
    },
    {
      id: "market",
      layout: "big-number",
      number: "$___B",
      numberLabel: "Total Addressable Market",
      content: "Fill in your market size. Think about the problem at scale — how many people face this?",
    },
    {
      id: "roadmap",
      layout: "bullets",
      title: "Execution Roadmap",
      bullets: [
        `Phase 1 (${project.timeline || "Month 1-2"}): Ship MVP, validate with real users`,
        "Phase 2: Iterate based on feedback, add key differentiators",
        "Phase 3: Scale — marketing, partnerships, growth loops",
      ],
    },
    {
      id: "constraints",
      layout: "two-column",
      title: "Constraints & Advantages",
      leftContent: project.constraints || "Every constraint is a design opportunity. Limited budget forces focus.",
      rightBullets: [
        `Budget: ${project.budget_range || "Lean startup"}`,
        `Timeline: ${project.timeline || "Fast iteration"}`,
        "Advantage: Move fast, stay close to users",
      ],
    },
    {
      id: "quote-2",
      layout: "quote",
      quote: "I think it is possible for ordinary people to choose to be extraordinary.",
      quoteAuthor: "Elon Musk",
    },
    {
      id: "closing",
      layout: "closing",
      title: "Let's Build This.",
      subtitle: project.name || "",
    },
  ];
}

export default function ProjectDeck() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Check if AI-generated intro_deck artifact exists
  const { data: introDeckArtifact } = useQuery({
    queryKey: ["intro-deck-artifact", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artifacts")
        .select("*")
        .eq("project_id", id!)
        .eq("artifact_type", "intro_deck")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // If AI deck exists, fetch its sections to enhance slides
  const { data: deckSections } = useQuery({
    queryKey: ["intro-deck-sections", introDeckArtifact?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artifact_sections")
        .select("*")
        .eq("artifact_id", introDeckArtifact!.id)
        .order("section_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!introDeckArtifact?.id,
  });

  // Build slides from project data + AI sections if available
  const slides: SlideData[] = project
    ? deckSections && deckSections.length > 0
      ? buildSlidesFromAI(project, deckSections)
      : buildDefaultSlides(project)
    : [];

  const handleGenerateAI = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-docs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            project_id: id,
            artifact_types: ["intro_deck"],
          }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Generation failed");
      }
      toast.success("Intro deck generated with AI!");
      queryClient.invalidateQueries({ queryKey: ["intro-deck-artifact", id] });
    } catch (e: any) {
      toast.error(e.message || "Failed to generate deck");
    } finally {
      setGenerating(false);
    }
  };

  if (loadingProject) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link to={`/project/${id}`} className="text-muted-foreground hover:text-foreground">
          {project?.name || "Project"}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">Intro Deck</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Introduction Deck</h1>
            <p className="text-sm text-muted-foreground">
              First-principles pitch deck — think like Elon Musk.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateAI}
              disabled={generating}
              className="gap-2"
              variant={introDeckArtifact ? "outline" : "default"}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : introDeckArtifact ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Generating..." : introDeckArtifact ? "Regenerate with AI" : "Enhance with AI"}
            </Button>
          </div>
        </div>

        <PresentationViewer slides={slides} title={project?.name} />
      </motion.div>
    </div>
  );
}

/* ─── Build slides from AI-generated sections ─── */
function buildSlidesFromAI(project: any, sections: any[]): SlideData[] {
  const slides: SlideData[] = [
    {
      id: "title",
      layout: "title",
      title: project.name,
      subtitle: findSection(sections, "elevator pitch")?.content ||
        project.problem_statement ||
        "A first-principles approach",
    },
    {
      id: "quote-open",
      layout: "quote",
      quote: "When something is important enough, you do it even if the odds are not in your favor.",
      quoteAuthor: "Elon Musk",
    },
  ];

  // Map AI sections to slide layouts
  const sectionMappings: { keyword: string; layout: SlideData["layout"]; subtitle?: string }[] = [
    { keyword: "problem", layout: "section", subtitle: "First Principles" },
    { keyword: "why now", layout: "bullets" },
    { keyword: "target", layout: "two-column" },
    { keyword: "solution", layout: "section", subtitle: "10x Better" },
    { keyword: "market", layout: "big-number" },
    { keyword: "competitive", layout: "bullets" },
    { keyword: "revenue", layout: "bullets" },
    { keyword: "roadmap", layout: "bullets" },
    { keyword: "risk", layout: "two-column" },
  ];

  for (const sec of sections) {
    const title = sec.title.toLowerCase();
    const mapping = sectionMappings.find((m) => title.includes(m.keyword));
    const content = sec.content || "";
    const bullets = content
      .split("\n")
      .filter((l: string) => l.trim().startsWith("-") || l.trim().startsWith("•") || l.trim().match(/^\d+\./))
      .map((l: string) => l.replace(/^[-•\d.]+\s*/, "").trim())
      .filter(Boolean);

    if (mapping?.layout === "bullets" || bullets.length >= 3) {
      slides.push({
        id: sec.id,
        layout: "bullets",
        title: sec.title,
        bullets: bullets.length > 0 ? bullets.slice(0, 6) : content.split(". ").slice(0, 4),
      });
    } else if (mapping?.layout === "big-number") {
      const numMatch = content.match(/\$[\d.,]+[BMK]?|\d+%|\d[\d,]+\+?/);
      slides.push({
        id: sec.id,
        layout: "big-number",
        number: numMatch ? numMatch[0] : "$___",
        numberLabel: sec.title,
        content: content.slice(0, 200),
      });
    } else if (mapping?.layout === "two-column") {
      slides.push({
        id: sec.id,
        layout: "two-column",
        title: sec.title,
        leftContent: content.split("\n").filter((l: string) => !l.startsWith("-")).join(" ").slice(0, 300),
        rightBullets: bullets.length > 0 ? bullets.slice(0, 5) : [content.slice(0, 100)],
      });
    } else {
      slides.push({
        id: sec.id,
        layout: "section",
        subtitle: mapping?.subtitle,
        title: sec.title,
        content: content.slice(0, 400),
      });
    }
  }

  slides.push({
    id: "quote-close",
    layout: "quote",
    quote: "I think it is possible for ordinary people to choose to be extraordinary.",
    quoteAuthor: "Elon Musk",
  });

  slides.push({
    id: "closing",
    layout: "closing",
    title: "Let's Build This.",
    subtitle: project.name,
  });

  return slides;
}

function findSection(sections: any[], keyword: string) {
  return sections.find((s) => s.title.toLowerCase().includes(keyword));
}
