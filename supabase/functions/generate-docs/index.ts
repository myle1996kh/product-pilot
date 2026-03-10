import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ARTIFACT_PROMPTS: Record<string, { systemPrompt: string; sections: string[] }> = {
  prd: {
    systemPrompt: `You are a senior product manager. Generate a detailed PRD (Product Requirements Document) based on the project information provided. Output valid JSON with the structure: { "sections": [{ "title": string, "content": string, "order": number }] }. Include sections for: Problem Statement, Goals & Non-Goals, Target Users, Functional Requirements, Non-Functional Requirements, Acceptance Criteria, and Success Metrics.`,
    sections: ["Problem Statement", "Goals & Non-Goals", "Target Users", "Functional Requirements", "Non-Functional Requirements", "Acceptance Criteria", "Success Metrics"],
  },
  architecture: {
    systemPrompt: `You are a senior software architect. Generate a technical architecture document based on the project information. Output valid JSON with the structure: { "sections": [{ "title": string, "content": string, "order": number }] }. Include sections for: Tech Stack Recommendation, System Architecture, Data Model, API Design, Infrastructure & Deployment, Security Considerations, and Scalability Plan.`,
    sections: ["Tech Stack Recommendation", "System Architecture", "Data Model", "API Design", "Infrastructure & Deployment", "Security Considerations", "Scalability Plan"],
  },
  business_model: {
    systemPrompt: `You are a startup strategy consultant. Generate a business model document based on the project information. Output valid JSON with the structure: { "sections": [{ "title": string, "content": string, "order": number }] }. Include sections for: Value Proposition, Revenue Model, Market Analysis (TAM/SAM/SOM), Customer Segments, Competitive Landscape, Go-to-Market Strategy, and Key Metrics.`,
    sections: ["Value Proposition", "Revenue Model", "Market Analysis", "Customer Segments", "Competitive Landscape", "Go-to-Market Strategy", "Key Metrics"],
  },
  idea_brief: {
    systemPrompt: `You are a product strategist. Generate a concise idea brief summarizing the project. Output valid JSON with the structure: { "sections": [{ "title": string, "content": string, "order": number }] }. Include sections for: Elevator Pitch, Problem, Solution, Target Audience, Key Features, and Differentiation.`,
    sections: ["Elevator Pitch", "Problem", "Solution", "Target Audience", "Key Features", "Differentiation"],
  },
  execution_plan: {
    systemPrompt: `You are an engineering project manager. Generate a detailed execution plan / roadmap. Output valid JSON with the structure: { "sections": [{ "title": string, "content": string, "order": number }] }. Include sections for: MVP Scope, Sprint Breakdown, Resource Requirements, Dependencies & Risks, Testing Strategy, Launch Checklist, and Post-Launch Plan.`,
    sections: ["MVP Scope", "Sprint Breakdown", "Resource Requirements", "Dependencies & Risks", "Testing Strategy", "Launch Checklist", "Post-Launch Plan"],
  },
  intro_deck: {
    systemPrompt: `You are a world-class pitch deck strategist who thinks like Elon Musk — first principles, 10x thinking, brutal clarity. Generate a pitch deck outline for this project. Each section becomes a slide. Use Markdown formatting with bullet points for lists. Output valid JSON with the structure: { "sections": [{ "title": string, "content": string, "order": number }] }. Include these slides/sections:
1. "Elevator Pitch" - One powerful sentence that captures everything
2. "The Problem" - What fundamental problem exists? Why is it painful? Use first-principles thinking
3. "Why Now" - Technology convergence, market timing, behavior shifts (use bullet points)
4. "Target Users" - Who specifically, with demographics and psychographics  
5. "The Solution" - How we solve it 10x better than alternatives
6. "Market Size" - TAM/SAM/SOM with real numbers if possible
7. "Competitive Landscape" - What exists, why it fails (bullet points)
8. "Revenue Model" - How we make money (bullet points)
9. "Execution Roadmap" - Phased plan with timelines (bullet points)
10. "Risks & Mitigation" - Honest risks and how we handle them

Make content punchy, data-driven, and inspiring. No fluff.`,
    sections: ["Elevator Pitch", "The Problem", "Why Now", "Target Users", "The Solution", "Market Size", "Competitive Landscape", "Revenue Model", "Execution Roadmap", "Risks & Mitigation"],
  },
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

    const { project_id, artifact_types, model_mappings } = await req.json();
    if (!project_id || !artifact_types || !Array.isArray(artifact_types)) {
      return new Response(JSON.stringify({ error: "project_id and artifact_types[] required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch project data
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

    // Fetch conversation history for context
    const { data: messages } = await supabase
      .from("conversation_messages")
      .select("role, content")
      .eq("project_id", project_id)
      .order("created_at", { ascending: true })
      .limit(50);

    const conversationContext = messages?.map(m => `${m.role}: ${m.content}`).join("\n") || "";

    const projectContext = `
## Project: ${project.name}
- Problem: ${project.problem_statement || "Not specified"}
- Target Users: ${project.target_users || "Not specified"}
- Desired Outcome: ${project.desired_outcome || "Not specified"}
- Timeline: ${project.timeline || "Not specified"}
- Budget: ${project.budget_range || "Not specified"}
- Constraints: ${project.constraints || "Not specified"}

## Conversation History:
${conversationContext}
`;

    // Get AI provider settings
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

    // Track agent run
    const startTime = Date.now();
    const { data: run } = await supabase
      .from("agent_runs")
      .insert({
        project_id,
        user_id: user.id,
        agent_type: "generate_docs",
        model_used: model,
        status: "running",
      })
      .select("id")
      .single();

    const results: Record<string, { artifact_id: string; sections_count: number }> = {};

    for (const artifactType of artifact_types) {
      const config = ARTIFACT_PROMPTS[artifactType];
      if (!config) continue;

      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: config.systemPrompt },
              { role: "user", content: `Generate the document based on this project info:\n${projectContext}` },
            ],
            temperature: 0.7,
            stream: false,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`AI error for ${artifactType}:`, response.status, errText);
          if (response.status === 429) {
            await supabase.from("agent_runs").update({ status: "failed", error_message: "Rate limited", duration_ms: Date.now() - startTime }).eq("id", run?.id);
            return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          if (response.status === 402) {
            await supabase.from("agent_runs").update({ status: "failed", error_message: "Payment required", duration_ms: Date.now() - startTime }).eq("id", run?.id);
            return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          continue;
        }

        const aiResponse = await response.json();
        const content = aiResponse.choices?.[0]?.message?.content || "";

        // Parse JSON from response (handle markdown code blocks)
        let parsed: { sections: { title: string; content: string; order: number }[] };
        try {
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
          parsed = JSON.parse(jsonMatch[1]!.trim());
        } catch {
          // Fallback: create single section with raw content
          parsed = { sections: [{ title: artifactType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), content, order: 0 }] };
        }

        // Create artifact record
        const { data: artifact, error: artErr } = await supabase
          .from("artifacts")
          .insert({
            project_id,
            user_id: user.id,
            artifact_type: artifactType as any,
            version: 1,
          })
          .select("id")
          .single();

        if (artErr || !artifact) {
          console.error(`Failed to create artifact for ${artifactType}:`, artErr);
          continue;
        }

        // Insert sections
        const sectionsToInsert = parsed.sections.map((s, i) => ({
          artifact_id: artifact.id,
          user_id: user.id,
          title: s.title,
          content: s.content,
          section_order: s.order ?? i,
          status: "draft" as const,
        }));

        await supabase.from("artifact_sections").insert(sectionsToInsert);

        results[artifactType] = { artifact_id: artifact.id, sections_count: sectionsToInsert.length };
      } catch (e) {
        console.error(`Error generating ${artifactType}:`, e);
      }
    }

    // Update project status
    await supabase.from("projects").update({ status: "in_review" }).eq("id", project_id);

    // Complete agent run
    if (run?.id) {
      await supabase.from("agent_runs").update({
        status: "completed",
        duration_ms: Date.now() - startTime,
      }).eq("id", run.id);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-docs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
