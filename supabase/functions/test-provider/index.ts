import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, provider_name, api_endpoint, api_key } = await req.json();

    if (action === "test") {
      // Test connection by sending a minimal chat completion
      const result = await testConnection(provider_name, api_endpoint, api_key);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "fetch_models") {
      const result = await fetchModels(provider_name, api_endpoint, api_key);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("test-provider error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function testConnection(
  providerName: string,
  apiEndpoint: string,
  apiKey: string
): Promise<{ success: boolean; message: string; latency_ms?: number }> {
  if (!apiEndpoint) {
    return { success: false, message: "API endpoint is required" };
  }

  // For lovable provider, use LOVABLE_API_KEY
  const actualKey = providerName === "lovable"
    ? Deno.env.get("LOVABLE_API_KEY") || ""
    : apiKey;

  if (!actualKey) {
    return { success: false, message: "API key is required" };
  }

  const startTime = Date.now();

  try {
    // Determine the correct endpoint and payload format
    let testEndpoint = apiEndpoint;
    let headers: Record<string, string>;
    let body: string;

    if (providerName === "anthropic") {
      // Anthropic uses a different format
      headers = {
        "x-api-key": actualKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      };
      body = JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 5,
        messages: [{ role: "user", content: "Hi" }],
      });
    } else {
      // OpenAI-compatible (OpenAI, Google, Lovable Gateway, custom/9Router)
      headers = {
        Authorization: `Bearer ${actualKey}`,
        "Content-Type": "application/json",
      };
      body = JSON.stringify({
        model: "gpt-5-nano",
        max_tokens: 5,
        messages: [{ role: "user", content: "Hi" }],
      });

      // For chat/completions endpoint, ensure correct path
      if (!testEndpoint.endsWith("/chat/completions")) {
        testEndpoint = testEndpoint.replace(/\/+$/, "") + "/chat/completions";
      }
    }

    const resp = await fetch(testEndpoint, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(15000),
    });

    const latency = Date.now() - startTime;

    if (resp.ok) {
      await resp.text(); // consume body
      return {
        success: true,
        message: `Connected successfully (${latency}ms)`,
        latency_ms: latency,
      };
    }

    const errText = await resp.text();
    // 401/403 = bad key, but connection works
    if (resp.status === 401 || resp.status === 403) {
      return {
        success: false,
        message: `Authentication failed (${resp.status}). Check your API key.`,
        latency_ms: latency,
      };
    }
    // 404 = wrong endpoint
    if (resp.status === 404) {
      return {
        success: false,
        message: `Endpoint not found (404). Check the API URL.`,
        latency_ms: latency,
      };
    }
    // Model not found is OK — means connection works but model name is wrong
    if (resp.status === 400 || resp.status === 422) {
      const parsed = JSON.parse(errText).catch?.(() => null);
      return {
        success: true,
        message: `Connected (${latency}ms). Model may need adjustment.`,
        latency_ms: latency,
      };
    }

    return {
      success: false,
      message: `Error ${resp.status}: ${errText.slice(0, 200)}`,
      latency_ms: latency,
    };
  } catch (err) {
    const latency = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("timeout") || msg.includes("AbortError")) {
      return { success: false, message: "Connection timed out (15s)", latency_ms: latency };
    }
    return { success: false, message: `Connection failed: ${msg}`, latency_ms: latency };
  }
}

async function fetchModels(
  providerName: string,
  apiEndpoint: string,
  apiKey: string
): Promise<{ success: boolean; models?: string[]; message?: string }> {
  if (!apiEndpoint) {
    return { success: false, message: "API endpoint is required" };
  }

  const actualKey = providerName === "lovable"
    ? Deno.env.get("LOVABLE_API_KEY") || ""
    : apiKey;

  if (!actualKey) {
    return { success: false, message: "API key is required" };
  }

  try {
    // Determine models endpoint
    let modelsEndpoint: string;
    let headers: Record<string, string>;

    if (providerName === "anthropic") {
      // Anthropic doesn't have a models list endpoint, return known models
      return {
        success: true,
        models: [
          "claude-sonnet-4-20250514",
          "claude-3-5-haiku-20241022",
          "claude-3-5-sonnet-20241022",
          "claude-3-opus-20240229",
        ],
      };
    }

    // OpenAI-compatible: strip /chat/completions and append /models
    modelsEndpoint = apiEndpoint
      .replace(/\/chat\/completions\/?$/, "")
      .replace(/\/+$/, "") + "/models";

    headers = {
      Authorization: `Bearer ${actualKey}`,
      "Content-Type": "application/json",
    };

    const resp = await fetch(modelsEndpoint, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      // If /models endpoint doesn't exist, return empty
      if (resp.status === 404) {
        return {
          success: false,
          message: "Models endpoint not found. Enter model name manually.",
        };
      }
      return {
        success: false,
        message: `Failed to fetch models (${resp.status}): ${errText.slice(0, 200)}`,
      };
    }

    const data = await resp.json();

    // Handle various response formats
    let models: string[] = [];

    if (Array.isArray(data)) {
      // Some APIs return array directly
      models = data.map((m: any) => typeof m === "string" ? m : m.id || m.name || "").filter(Boolean);
    } else if (data.data && Array.isArray(data.data)) {
      // OpenAI format: { data: [{ id: "model-name" }] }
      models = data.data.map((m: any) => m.id || m.name || "").filter(Boolean);
    } else if (data.models && Array.isArray(data.models)) {
      // Some APIs use { models: [...] }
      models = data.models.map((m: any) => typeof m === "string" ? m : m.id || m.name || "").filter(Boolean);
    }

    // Sort alphabetically
    models.sort();

    return {
      success: true,
      models: models.length > 0 ? models : undefined,
      message: models.length === 0 ? "No models found. Enter model name manually." : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Failed to fetch models: ${msg}` };
  }
}
