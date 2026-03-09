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

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, project_id } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's active AI provider settings
    const { data: providerSettings } = await supabase
      .from("ai_provider_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    let apiEndpoint: string;
    let apiKey: string;
    let model: string;
    let headers: Record<string, string>;

    if (providerSettings && providerSettings.provider_name !== "lovable") {
      // User's custom provider — use endpoint as-is
      apiEndpoint = providerSettings.api_endpoint || "";
      apiKey = providerSettings.api_key_encrypted || "";
      model = providerSettings.default_model || "gpt-5-mini";

      if (!apiEndpoint || !apiKey) {
        return new Response(
          JSON.stringify({
            error: "AI provider not configured. Please set up your API key in Settings.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
    } else {
      // Default: Lovable AI Gateway
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      apiEndpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY;
      model =
        providerSettings?.default_model || "google/gemini-3-flash-preview";
      headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
    }

    // System prompt for the discussion agent
    const systemPrompt = `You are PlanForge AI — an expert product planning assistant helping non-technical founders turn ideas into production-ready plans.

Your role in this Discussion phase:
1. Ask clarifying questions to fill gaps in the project brief
2. Cover: problem clarity, target users, business model, product scope, tech constraints, timeline
3. After each exchange, internally track which fields are covered vs missing
4. Be warm, encouraging, and use simple language — avoid jargon
5. When enough info is gathered, suggest moving to "Readiness Check"
6. Extract structured data from responses (problem, users, features, constraints, monetization)

Always respond in the same language the user writes in.
Keep responses concise (2-4 paragraphs max).
Ask ONE focused question at a time.`;

    // Track agent run
    const startTime = Date.now();
    let agentRunId: string | null = null;

    if (project_id) {
      const { data: run } = await supabase
        .from("agent_runs")
        .insert({
          project_id,
          user_id: user.id,
          agent_type: "discussion",
          model_used: model,
          status: "running",
        })
        .select("id")
        .single();
      agentRunId = run?.id || null;
    }

    console.log("Calling AI endpoint:", apiEndpoint, "model:", model);
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI API error:", response.status, "url:", apiEndpoint, "body:", errText);

      if (agentRunId) {
        await supabase
          .from("agent_runs")
          .update({
            status: "failed",
            error_message: `${response.status}: ${errText}`,
            duration_ms: Date.now() - startTime,
          })
          .eq("id", agentRunId);
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI provider error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update agent run as completed (approximate — streaming still going)
    if (agentRunId) {
      await supabase
        .from("agent_runs")
        .update({
          status: "completed",
          duration_ms: Date.now() - startTime,
        })
        .eq("id", agentRunId);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
