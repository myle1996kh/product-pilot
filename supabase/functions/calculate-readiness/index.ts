import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const READINESS_AXES = [
  "problem_clarity",
  "target_users",
  "business_model",
  "product_scope",
  "tech_feasibility",
  "execution_clarity",
];

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

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch project
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch conversation
    const { data: messages } = await supabase
      .from("conversation_messages")
      .select("role, content")
      .eq("project_id", project_id)
      .order("created_at", { ascending: true })
      .limit(50);

    const conversationText = messages?.map(m => `${m.role}: ${m.content}`).join("\n") || "";

    // Get AI provider
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
      let baseUrl = (providerSettings.api_endpoint || "").replace(/\/+$/, "");
      if (providerSettings.provider_name === "anthropic") {
        apiEndpoint = baseUrl;
      } else if (!baseUrl.endsWith("/chat/completions")) {
        apiEndpoint = `${baseUrl}/chat/completions`;
      } else {
        apiEndpoint = baseUrl;
      }
      apiKey = providerSettings.api_key_encrypted || "";
      model = providerSettings.default_model || "gpt-5-mini";
      if (!apiEndpoint || !apiKey) {
        return new Response(JSON.stringify({ error: "AI provider not configured" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
    } else {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      apiEndpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY;
      model = providerSettings?.default_model || "google/gemini-3-flash-preview";
      headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
    }

    const systemPrompt = `You are a project readiness evaluator. Analyze the project data and conversation history to score how ready this project is for development.

Score each axis from 0-100:
- problem_clarity: How well-defined is the problem being solved?
- target_users: How clearly are target users identified?
- business_model: How clear is the monetization/business model?
- product_scope: How well-defined are features and MVP scope?
- tech_feasibility: How clear are technical requirements and constraints?
- execution_clarity: How clear is the timeline, budget, and execution plan?

Also provide:
- suggested_questions: 3 questions to ask to improve low-scoring areas
- summary: A 1-2 sentence overall assessment

Respond with ONLY valid JSON (no markdown):
{
  "axes": {
    "problem_clarity": { "score": number, "reason": "string" },
    "target_users": { "score": number, "reason": "string" },
    "business_model": { "score": number, "reason": "string" },
    "product_scope": { "score": number, "reason": "string" },
    "tech_feasibility": { "score": number, "reason": "string" },
    "execution_clarity": { "score": number, "reason": "string" }
  },
  "suggested_questions": ["string", "string", "string"],
  "summary": "string"
}`;

    const projectContext = `Project: ${project.name}
Problem: ${project.problem_statement || "Not specified"}
Target Users: ${project.target_users || "Not specified"}
Desired Outcome: ${project.desired_outcome || "Not specified"}
Timeline: ${project.timeline || "Not specified"}
Budget: ${project.budget_range || "Not specified"}
Constraints: ${project.constraints || "Not specified"}

Conversation:
${conversationText || "No conversation yet."}`;

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: projectContext },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI provider error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      console.error("Failed to parse readiness response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate overall score
    const axisScores = Object.values(parsed.axes) as { score: number; reason: string }[];
    const overallScore = Math.round(axisScores.reduce((sum, a) => sum + a.score, 0) / axisScores.length);

    // Save to project
    await supabase.from("projects").update({
      readiness_score: overallScore,
      readiness_details: parsed,
    }).eq("id", project_id);

    return new Response(JSON.stringify({
      overall_score: overallScore,
      ...parsed,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("calculate-readiness error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
