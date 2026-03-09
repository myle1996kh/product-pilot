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

    const { section_id, feedback } = await req.json();
    if (!section_id) {
      return new Response(JSON.stringify({ error: "section_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the section + artifact + project context
    const { data: section, error: secErr } = await supabase
      .from("artifact_sections")
      .select("*, artifacts!inner(project_id, artifact_type)")
      .eq("id", section_id)
      .single();

    if (secErr || !section) {
      return new Response(JSON.stringify({ error: "Section not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectId = (section as any).artifacts.project_id;
    const artifactType = (section as any).artifacts.artifact_type;

    // Fetch project info
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    // Fetch conversation for context
    const { data: messages } = await supabase
      .from("conversation_messages")
      .select("role, content")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .limit(30);

    const conversationContext = messages?.map(m => `${m.role}: ${m.content}`).join("\n") || "";

    const projectContext = project
      ? `Project: ${project.name}\nProblem: ${project.problem_statement || "N/A"}\nTarget Users: ${project.target_users || "N/A"}\nDesired Outcome: ${project.desired_outcome || "N/A"}\nTimeline: ${project.timeline || "N/A"}\nBudget: ${project.budget_range || "N/A"}\nConstraints: ${project.constraints || "N/A"}`
      : "";

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
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
    } else {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      apiEndpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY;
      model = providerSettings?.default_model || "google/gemini-3-flash-preview";
      headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
    }

    const systemPrompt = `You are an expert document writer. You are regenerating a specific section of a ${artifactType.replace(/_/g, " ")} document.

Section title: "${section.title}"
Current content: "${section.content}"

${feedback ? `User feedback: "${feedback}"` : "The user wants you to improve this section."}

Project context:
${projectContext}

Conversation history:
${conversationContext}

Write an improved version of this section. Be detailed, specific, and actionable. Output ONLY the new section content as plain text (no JSON, no markdown headers for the title). Write in the same language the user used in the conversation.`;

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please regenerate the "${section.title}" section.${feedback ? ` Focus on: ${feedback}` : ""}` },
        ],
        temperature: 0.7,
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
    const newContent = aiResponse.choices?.[0]?.message?.content || "";

    // Update the section
    const { error: updateErr } = await supabase
      .from("artifact_sections")
      .update({
        content: newContent,
        status: "needs_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", section_id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: "Failed to update section" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, content: newContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-section error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
