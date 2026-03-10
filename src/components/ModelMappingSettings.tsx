import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Cpu,
  BarChart3,
  Map,
  Lightbulb,
  Presentation,
  Loader2,
  Save,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type ArtifactModelMap = Record<string, string>;

const ARTIFACT_TYPES = [
  { key: "idea_brief", label: "Idea Brief", icon: Lightbulb, description: "Concise project summary & elevator pitch" },
  { key: "prd", label: "PRD", icon: FileText, description: "Product Requirements Document with specs" },
  { key: "architecture", label: "Architecture", icon: Cpu, description: "Technical architecture & stack decisions" },
  { key: "business_model", label: "Business Model", icon: BarChart3, description: "Revenue model, market analysis, GTM" },
  { key: "execution_plan", label: "Execution Plan", icon: Map, description: "Sprint breakdown, roadmap, testing" },
  { key: "intro_deck", label: "Intro Deck", icon: Presentation, description: "Pitch deck slides (Elon Musk style)" },
];

const AVAILABLE_MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash Preview", tier: "fast", description: "Fast, balanced speed & quality" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", tier: "premium", description: "Best for complex reasoning" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", tier: "balanced", description: "Good balance of cost & quality" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", tier: "economy", description: "Fastest, cheapest option" },
  { value: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview", tier: "premium", description: "Latest next-gen reasoning" },
  { value: "openai/gpt-5", label: "GPT-5", tier: "premium", description: "Powerful all-rounder, expensive" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini", tier: "balanced", description: "Strong performance, lower cost" },
  { value: "openai/gpt-5-nano", label: "GPT-5 Nano", tier: "economy", description: "Speed & cost optimized" },
  { value: "openai/gpt-5.2", label: "GPT-5.2", tier: "premium", description: "Enhanced reasoning capabilities" },
];

const RECOMMENDED_MAPPINGS: ArtifactModelMap = {
  idea_brief: "google/gemini-3-flash-preview",
  prd: "google/gemini-2.5-pro",
  architecture: "google/gemini-2.5-pro",
  business_model: "openai/gpt-5-mini",
  execution_plan: "google/gemini-2.5-flash",
  intro_deck: "google/gemini-2.5-pro",
};

const tierColors: Record<string, string> = {
  premium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  balanced: "bg-primary/15 text-primary border-primary/30",
  fast: "bg-success/15 text-success border-success/30",
  economy: "bg-muted text-muted-foreground border-muted-foreground/30",
};

export default function ModelMappingSettings() {
  const { user } = useAuth();
  const [mappings, setMappings] = useState<ArtifactModelMap>({ ...RECOMMENDED_MAPPINGS });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadMappings();
  }, [user]);

  const loadMappings = async () => {
    try {
      const { data } = await supabase
        .from("ai_provider_settings")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (data?.default_model) {
        // Check if there's a stored model_mappings in the provider's api_endpoint field as JSON
        // For now, use the default_model as the base for all types
        const storedMappings: ArtifactModelMap = {};
        ARTIFACT_TYPES.forEach(t => {
          storedMappings[t.key] = RECOMMENDED_MAPPINGS[t.key] || data.default_model || "google/gemini-3-flash-preview";
        });
        setMappings(storedMappings);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = (artifactType: string, model: string) => {
    setMappings(prev => ({ ...prev, [artifactType]: model }));
  };

  const resetToRecommended = () => {
    setMappings({ ...RECOMMENDED_MAPPINGS });
    toast.info("Reset to recommended model assignments");
  };

  const saveMappings = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Store mappings as JSON in localStorage for now (will be used by generate-docs)
      localStorage.setItem(`model_mappings_${user.id}`, JSON.stringify(mappings));
      toast.success("Model mappings saved!");
    } catch (err: any) {
      toast.error("Failed to save model mappings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Model Mapping</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={resetToRecommended} className="gap-1.5 text-xs">
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
          <Button size="sm" onClick={saveMappings} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Assign specific AI models to each document type. Premium models produce better results for complex docs like Architecture & PRD.
      </p>

      <div className="space-y-2">
        {ARTIFACT_TYPES.map((artifact) => {
          const Icon = artifact.icon;
          const currentModel = mappings[artifact.key] || RECOMMENDED_MAPPINGS[artifact.key];
          const modelInfo = AVAILABLE_MODELS.find(m => m.value === currentModel);

          return (
            <motion.div
              key={artifact.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-soft"
            >
              {/* Artifact info */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Icon className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{artifact.label}</p>
                <p className="truncate text-[11px] text-muted-foreground">{artifact.description}</p>
              </div>

              {/* Model selector */}
              <div className="flex items-center gap-2">
                {modelInfo && (
                  <Badge variant="outline" className={`hidden text-[10px] sm:inline-flex ${tierColors[modelInfo.tier]}`}>
                    {modelInfo.tier}
                  </Badge>
                )}
                <Select
                  value={currentModel}
                  onValueChange={(val) => updateMapping(artifact.key, val)}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex items-center gap-2">
                          <span>{model.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({model.tier})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cost hint */}
      <div className="rounded-lg border border-dashed bg-muted/30 p-3">
        <p className="text-[11px] text-muted-foreground">
          <strong className="text-foreground">💡 Tip:</strong> Use{" "}
          <Badge variant="outline" className={`text-[9px] ${tierColors.premium}`}>premium</Badge>{" "}
          models for complex documents (PRD, Architecture) and{" "}
          <Badge variant="outline" className={`text-[9px] ${tierColors.fast}`}>fast</Badge>{" "}
          models for simpler ones (Idea Brief) to optimize cost vs. quality.
        </p>
      </div>
    </div>
  );
}
