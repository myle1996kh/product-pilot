import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Key,
  Cpu,
  Plus,
  Trash2,
  Check,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import ModelMappingSettings from "@/components/ModelMappingSettings";

type ConnectionStatus = "idle" | "testing" | "success" | "error";

type ProviderConfig = {
  id?: string;
  provider_name: string;
  api_endpoint: string;
  api_key_encrypted: string;
  default_model: string;
  is_active: boolean;
  // UI-only state
  connectionStatus: ConnectionStatus;
  connectionMessage: string;
  connectionLatency?: number;
  fetchedModels: string[];
  isFetchingModels: boolean;
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
    models: [],
  },
  anthropic: {
    endpoint: "https://api.anthropic.com/v1/messages",
    models: [],
  },
  google: {
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: [],
  },
  custom: {
    endpoint: "",
    models: [],
  },
};

const TEST_PROVIDER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-provider`;

export default function SettingsPage() {
  const { user, session } = useAuth();
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
      setLoading(false);
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
          connectionStatus: "idle",
          connectionMessage: "",
          fetchedModels: [],
          isFetchingModels: false,
        }))
      );
    } else {
      setProviders([
        {
          provider_name: "lovable",
          api_endpoint: providerPresets.lovable.endpoint,
          api_key_encrypted: "",
          default_model: "google/gemini-3-flash-preview",
          is_active: true,
          connectionStatus: "idle",
          connectionMessage: "",
          fetchedModels: [],
          isFetchingModels: false,
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
        default_model: "",
        is_active: false,
        connectionStatus: "idle",
        connectionMessage: "",
        fetchedModels: [],
        isFetchingModels: false,
      },
    ]);
  };

  const updateProvider = (index: number, updates: Partial<ProviderConfig>) => {
    setProviders((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const updated = { ...p, ...updates };
        if (updates.provider_name && providerPresets[updates.provider_name]) {
          updated.api_endpoint = providerPresets[updates.provider_name].endpoint;
          updated.default_model = "";
          updated.fetchedModels = [];
          updated.connectionStatus = "idle";
          updated.connectionMessage = "";
        }
        return updated;
      })
    );
  };

  const removeProvider = (index: number) => {
    setProviders((prev) => prev.filter((_, i) => i !== index));
  };

  const testConnection = async (index: number) => {
    const provider = providers[index];
    updateProvider(index, { connectionStatus: "testing", connectionMessage: "Testing..." });

    try {
      const resp = await fetch(TEST_PROVIDER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: "test",
          provider_name: provider.provider_name,
          api_endpoint: provider.api_endpoint,
          api_key: provider.api_key_encrypted,
        }),
      });

      const data = await resp.json();

      if (data.success) {
        updateProvider(index, {
          connectionStatus: "success",
          connectionMessage: data.message,
          connectionLatency: data.latency_ms,
        });
        toast.success("Connection successful!");
      } else {
        updateProvider(index, {
          connectionStatus: "error",
          connectionMessage: data.message || data.error || "Connection failed",
        });
        toast.error(data.message || "Connection failed");
      }
    } catch (err: any) {
      updateProvider(index, {
        connectionStatus: "error",
        connectionMessage: err.message || "Network error",
      });
      toast.error("Failed to test connection");
    }
  };

  const fetchModels = async (index: number) => {
    const provider = providers[index];
    updateProvider(index, { isFetchingModels: true });

    try {
      const resp = await fetch(TEST_PROVIDER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: "fetch_models",
          provider_name: provider.provider_name,
          api_endpoint: provider.api_endpoint,
          api_key: provider.api_key_encrypted,
        }),
      });

      const data = await resp.json();

      if (data.success && data.models && data.models.length > 0) {
        updateProvider(index, {
          fetchedModels: data.models,
          isFetchingModels: false,
        });
        toast.success(`Found ${data.models.length} models`);
      } else {
        updateProvider(index, {
          isFetchingModels: false,
        });
        toast.info(data.message || "No models found. Enter model name manually.");
      }
    } catch (err: any) {
      updateProvider(index, { isFetchingModels: false });
      toast.error("Failed to fetch models");
    }
  };

  const saveProviders = async () => {
    if (!user) return;
    setSaving(true);

    try {
      await supabase.from("ai_provider_settings").delete().eq("user_id", user.id);

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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">AI Providers</h2>
            <Button variant="outline" size="sm" onClick={addProvider} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Provider
            </Button>
          </div>

          {providers.map((provider, index) => {
            const preset = providerPresets[provider.provider_name];
            const availableModels =
              provider.fetchedModels.length > 0
                ? provider.fetchedModels
                : preset?.models || [];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border bg-card p-5 shadow-soft"
              >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                      <Cpu className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {provider.provider_name === "lovable"
                          ? "Lovable AI Gateway"
                          : provider.provider_name === "custom"
                          ? "Custom / 9Router"
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

                {/* Config fields */}
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
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="flex items-center gap-1 text-xs">
                        <Key className="h-3 w-3" /> API Key
                      </Label>
                      <Input
                        type="password"
                        value={provider.api_key_encrypted}
                        onChange={(e) =>
                          updateProvider(index, { api_key_encrypted: e.target.value })
                        }
                        placeholder="sk-..."
                      />
                    </div>
                  )}
                </div>

                {/* Test Connection + Fetch Models */}
                <div className="mt-4 flex items-center gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={provider.connectionStatus === "testing"}
                    onClick={() => testConnection(index)}
                  >
                    {provider.connectionStatus === "testing" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                    Test Connection
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={provider.isFetchingModels}
                    onClick={() => fetchModels(index)}
                  >
                    {provider.isFetchingModels ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Fetch Models
                  </Button>

                  {/* Connection status indicator */}
                  {provider.connectionStatus !== "idle" &&
                    provider.connectionStatus !== "testing" && (
                      <div className="flex items-center gap-1.5">
                        {provider.connectionStatus === "success" ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span
                          className={`text-xs ${
                            provider.connectionStatus === "success"
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {provider.connectionMessage}
                        </span>
                      </div>
                    )}
                </div>

                {/* Model Selection */}
                <div className="mt-4 space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Model</Label>
                    {provider.fetchedModels.length > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-success/10 text-success border-success/30 text-[10px]"
                      >
                        {provider.fetchedModels.length} models loaded
                      </Badge>
                    )}
                  </div>

                  {availableModels.length > 0 ? (
                    <Select
                      value={provider.default_model}
                      onValueChange={(val) =>
                        updateProvider(index, { default_model: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {availableModels.map((m) => (
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
                      placeholder="Enter model name or click Fetch Models"
                    />
                  )}

                  {availableModels.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Or type a custom model name:
                      <Input
                        className="mt-1"
                        value={
                          availableModels.includes(provider.default_model)
                            ? ""
                            : provider.default_model
                        }
                        onChange={(e) =>
                          updateProvider(index, { default_model: e.target.value })
                        }
                        placeholder="custom-model-name"
                      />
                    </p>
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

          {/* Model Mapping per Document Type */}
          <div className="mt-8 border-t pt-8">
            <ModelMappingSettings />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
