import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { TemplateSelector, TemplatePreview, type ProjectTemplate } from "@/components/SmartTemplates";

export default function CreateProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"choose" | "template-preview" | "manual">("choose");
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    problem_statement: "",
    target_users: "",
    desired_outcome: "",
    timeline: "",
    budget_range: "",
    constraints: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setMode("template-preview");
  };

  const handleTemplateConfirm = () => {
    if (!selectedTemplate) return;
    setForm({
      name: selectedTemplate.name,
      problem_statement: selectedTemplate.problem,
      target_users: selectedTemplate.target_users,
      desired_outcome: selectedTemplate.desired_outcome,
      timeline: selectedTemplate.timeline.includes("2 week") ? "2w" : selectedTemplate.timeline.includes("1 month") ? "1m" : selectedTemplate.timeline.includes("2-3") ? "3m" : "1m",
      budget_range: selectedTemplate.budget.includes("$0-500") || selectedTemplate.budget.toLowerCase().includes("low") ? "low" : selectedTemplate.budget.includes("5000") || selectedTemplate.budget.toLowerCase().includes("medium") ? "mid" : "low",
      constraints: "",
    });
    setMode("manual");
    setStep(1);
  };

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: form.name,
          problem_statement: form.problem_statement,
          target_users: form.target_users,
          desired_outcome: form.desired_outcome,
          timeline: form.timeline,
          budget_range: form.budget_range,
          constraints: form.constraints,
          status: "discussing",
        })
        .select("id")
        .single();

      if (error) throw error;
      toast.success("Project created!");
      navigate(`/project/${data.id}/discussion`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-semibold">
            Let's shape your idea
          </h1>
          <p className="mt-1 text-muted-foreground">
            Start from a template or describe your idea from scratch.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === "choose" && (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TemplateSelector onSelect={handleTemplateSelect} />
              <div className="mt-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="mt-6 text-center">
                <Button variant="outline" onClick={() => setMode("manual")} className="gap-2">
                  <Sparkles className="h-4 w-4" /> Start from Scratch
                </Button>
              </div>
            </motion.div>
          )}

          {mode === "template-preview" && selectedTemplate && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TemplatePreview
                template={selectedTemplate}
                onConfirm={handleTemplateConfirm}
                onBack={() => setMode("choose")}
              />
            </motion.div>
          )}

          {mode === "manual" && (
            <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {selectedTemplate && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
                  <span>{selectedTemplate.emoji}</span>
                  Based on "{selectedTemplate.name}" — customize below
                  <button onClick={() => { setMode("choose"); setSelectedTemplate(null); }} className="ml-auto underline">
                    Change template
                  </button>
                </div>
              )}

              <div className="mb-6 flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      s <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. FitTracker, EduPlatform..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="problem">What problem are you solving?</Label>
                    <Textarea id="problem" value={form.problem_statement} onChange={(e) => update("problem_statement", e.target.value)} placeholder="Describe the pain point or opportunity..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="users">Who is your target user?</Label>
                    <Input id="users" value={form.target_users} onChange={(e) => update("target_users", e.target.value)} placeholder="e.g. Small business owners, students..." />
                  </div>
                  <Button onClick={() => setStep(2)} className="gap-2" disabled={!form.name}>
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="outcome">Desired outcome</Label>
                    <Textarea id="outcome" value={form.desired_outcome} onChange={(e) => update("desired_outcome", e.target.value)} placeholder="What does success look like?" rows={4} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Timeline</Label>
                      <Select value={form.timeline} onValueChange={(val) => update("timeline", val)}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2w">2 weeks</SelectItem>
                          <SelectItem value="1m">1 month</SelectItem>
                          <SelectItem value="3m">3 months</SelectItem>
                          <SelectItem value="6m">6+ months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Budget Range</Label>
                      <Select value={form.budget_range} onValueChange={(val) => update("budget_range", val)}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Under $5K</SelectItem>
                          <SelectItem value="mid">$5K – $20K</SelectItem>
                          <SelectItem value="high">$20K – $50K</SelectItem>
                          <SelectItem value="enterprise">$50K+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={() => setStep(3)} className="gap-2">
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="constraints">Any constraints? (team, tech, legal)</Label>
                    <Textarea id="constraints" value={form.constraints} onChange={(e) => update("constraints", e.target.value)} placeholder="e.g. Solo founder, no backend experience..." rows={4} />
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm font-medium text-foreground">💡 What happens next?</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Our AI will start a guided discussion to fill in any gaps, then generate
                      your full planning package.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <Button onClick={handleCreate} className="gap-2" disabled={loading}>
                      {loading ? "Creating..." : "Start Discussion"} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
