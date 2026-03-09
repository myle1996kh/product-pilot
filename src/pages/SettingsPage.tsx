import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Key, Cpu, Plus, Trash2, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

type ProviderConfig = {
  id?: string;
  provider_name: string;
  api_endpoint: string;
  api_key_encrypted: string;
  default_model: string;
  is_active: boolean;
};

const providerPresets: Record<string, { endpoint: string; models: string[] }> = {
  lovable: {
    endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
    models: [
      "google/gemini-3-flash-preview",
      "google/gemini-2.5-pro",
      "google/gemini-2.5-flash",
      "openai/gpt-5",
      "openai/gpt-5-mini",
    ],
  },
  openai: {
    endpoint: "https://api.openai.com/v1/chat/completions",
    models: ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4o"],
  },
  anthropic: {
    endpoint: "https://api.anthropic.com/v1/messages",
    models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"],
  },
  google: {
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-3-flash-preview"],
  },
  custom: {
    endpoint: "",
    models: [],
  },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadProviders();
  }, [user]);

  const loadProviders = async () => {
    const { data, error } = await supabase
      .from("ai_provider_settings")
      .select("*")
      .order("created_at");

    if (error) {
      toast.error("Failed to load settings");
      return;
    }

    if (data && data.length > 0) {
      setProviders(
        data.map((d) => ({
          id: d.id,
          provider_name: d.provider_name,
          api_endpoint: d.api_endpoint || "",
          api_key_encrypted: d.api_key_encrypted || "",
          default_model: d.default_model || "",
          is_active: d.is_active ?? true,
        }))
      );
    } else {
      // Default provider
      setProviders([
        {
          provider_name: "lovable",
          api_endpoint: providerPresets.lovable.endpoint,
          api_key_encrypted: "",
          default_model: "google/gemini-3-flash-preview",
          is_active: true,
        },
      ]);
    }
    setLoading(false);
  };

  const addProvider = () => {
    setProviders((prev) => [
      ...prev,
      {
        provider_name: "openai",
        api_endpoint: providerPresets.openai.endpoint,
        api_key_encrypted: "",
        default_model: providerPresets.openai.models[0],
        is_active: false,
      },
    ]);
  };

  const updateProvider = (index: number, updates: Partial<ProviderConfig>) => {
    setProviders((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const updated = { ...p, ...updates };
        // Auto-fill endpoint when provider changes
        if (updates.provider_name && providerPresets[updates.provider_name]) {
          updated.api_endpoint = providerPresets[updates.provider_name].endpoint;
          updated.default_model = providerPresets[updates.provider_name].models[0] || "";
        }
        return updated;
      })
    );
  };

  const removeProvider = (index: number) => {
    setProviders((prev) => prev.filter((_, i) => i !== index));
  };

  const saveProviders = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Delete existing
      await supabase.from("ai_provider_settings").delete().eq("user_id", user.id);

      // Insert all
      const inserts = providers.map((p) => ({
        user_id: user.id,
        provider_name: p.provider_name,
        api_endpoint: p.api_endpoint,
        api_key_encrypted: p.api_key_encrypted,
        default_model: p.default_model,
        is_active: p.is_active,
      }));

      const { error } = await supabase.from("ai_provider_settings").insert(inserts);
      if (error) throw error;

      toast.success("Settings saved!");
      loadProviders();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure your AI providers and model preferences
            </p>
          </div>
        </div>

        {/* AI Provider Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">AI Providers</h2>
            <Button variant="outline" size="sm" onClick={addProvider} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Provider
            </Button>
          </div>

          {providers.map((provider, index) => {
            const preset = providerPresets[provider.provider_name];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border bg-card p-5 shadow-soft"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                      <Cpu className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {provider.provider_name === "lovable"
                          ? "Lovable AI Gateway"
                          : provider.provider_name}
                      </p>
                      {provider.provider_name === "lovable" && (
                        <p className="text-[11px] text-muted-foreground">
                          Built-in — no API key needed
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={provider.is_active}
                      onCheckedChange={(checked) =>
                        updateProvider(index, { is_active: checked })
                      }
                    />
                    {providers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeProvider(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Provider</Label>
                    <Select
                      value={provider.provider_name}
                      onValueChange={(val) =>
                        updateProvider(index, { provider_name: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lovable">Lovable AI Gateway</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google AI</SelectItem>
                        <SelectItem value="custom">Custom / 9Router</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Model</Label>
                    {preset && preset.models.length > 0 ? (
                      <Select
                        value={provider.default_model}
                        onValueChange={(val) =>
                          updateProvider(index, { default_model: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {preset.models.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={provider.default_model}
                        onChange={(e) =>
                          updateProvider(index, { default_model: e.target.value })
                        }
                        placeholder="model-name"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">API Endpoint</Label>
                    <Input
                      value={provider.api_endpoint}
                      onChange={(e) =>
                        updateProvider(index, { api_endpoint: e.target.value })
                      }
                      placeholder="https://api.example.com/v1/chat/completions"
                    />
                  </div>

                  {provider.provider_name !== "lovable" && (
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <Key className="h-3 w-3" /> API Key
                      </Label>
                      <Input
                        type="password"
                        value={provider.api_key_encrypted}
                        onChange={(e) =>
                          updateProvider(index, {
                            api_key_encrypted: e.target.value,
                          })
                        }
                        placeholder="sk-..."
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          <div className="flex justify-end">
            <Button onClick={saveProviders} disabled={saving} className="gap-2">
              <Check className="h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
