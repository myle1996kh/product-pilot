import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Bot, User, ArrowRight, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  StructuredCard,
  ProgressTracker,
  DISCUSSION_FIELDS,
  FIELD_PROMPTS,
  type DiscussionField,
} from "@/components/GuidedDiscussion";
import { LiveReadinessSidebar, computeFieldReadiness } from "@/components/LiveReadiness";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Detect which field an AI question is about
function detectCurrentField(aiMessage: string): string | null {
  const fieldKeywords: Record<string, string[]> = {
    problem: ["problem", "pain point", "struggle", "challenge", "issue"],
    target_users: ["target user", "audience", "who will use", "customer", "persona"],
    desired_outcome: ["success", "outcome", "goal", "achieve", "result"],
    features: ["feature", "functionality", "capability", "MVP", "must-have"],
    revenue: ["revenue", "monetize", "pricing", "business model", "charge", "money"],
    tech_pref: ["technical", "technology", "stack", "platform", "framework", "integration"],
    timeline: ["timeline", "deadline", "launch", "when", "schedule"],
    budget: ["budget", "cost", "spend", "afford", "investment"],
  };

  const lower = aiMessage.toLowerCase();
  for (const [field, keywords] of Object.entries(fieldKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return field;
    }
  }
  return null;
}

export default function ProjectDiscussion() {
  const { id } = useParams<{ id: string }>();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [filledFields, setFilledFields] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: project } = useQuery({
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

  const { data: dbMessages } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversation_messages")
        .select("*")
        .eq("project_id", id!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Initialize filled fields from project data
  useEffect(() => {
    if (project) {
      const filled: Record<string, string> = {};
      if (project.problem_statement) filled.problem = project.problem_statement;
      if (project.target_users) filled.target_users = project.target_users;
      if (project.desired_outcome) filled.desired_outcome = project.desired_outcome;
      if (project.timeline) filled.timeline = project.timeline;
      if (project.budget_range) filled.budget = project.budget_range;
      if (project.constraints) filled.tech_pref = project.constraints;
      setFilledFields(prev => ({ ...prev, ...filled }));
    }
  }, [project]);

  useEffect(() => {
    if (dbMessages && dbMessages.length > 0) {
      setMessages(
        dbMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
      // Detect current field from last assistant message
      const lastAssistant = [...dbMessages].reverse().find(m => m.role === "assistant");
      if (lastAssistant) {
        setCurrentField(detectCurrentField(lastAssistant.content));
      }
    } else if (project && dbMessages && dbMessages.length === 0) {
      sendInitialContext();
    }
  }, [dbMessages, project]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Compute readiness from filled fields
  const readinessAxes = useMemo(() => computeFieldReadiness(filledFields), [filledFields]);
  const overallScore = useMemo(() => {
    if (readinessAxes.length === 0) return 0;
    return Math.round(readinessAxes.reduce((sum, a) => sum + a.score, 0) / readinessAxes.length);
  }, [readinessAxes]);

  // Track which discussion fields are filled
  const discussionFields: DiscussionField[] = useMemo(() => {
    return DISCUSSION_FIELDS.map(f => ({
      ...f,
      status: filledFields[f.key] && filledFields[f.key].length > 10
        ? "complete"
        : filledFields[f.key]
        ? "partial"
        : "empty",
      value: filledFields[f.key],
    }));
  }, [filledFields]);

  const sendInitialContext = async () => {
    if (!project || !user || !session) return;
    const contextMsg = `Here is the project brief:
- Name: ${project.name}
- Problem: ${project.problem_statement || "Not specified"}
- Target Users: ${project.target_users || "Not specified"}
- Desired Outcome: ${project.desired_outcome || "Not specified"}
- Timeline: ${project.timeline || "Not specified"}
- Budget: ${project.budget_range || "Not specified"}
- Constraints: ${project.constraints || "Not specified"}

Please introduce yourself briefly and ask the first clarifying question to help refine this project idea.`;

    await streamChat([{ role: "user" as const, content: contextMsg }], true);
  };

  const saveMessage = async (role: string, content: string) => {
    if (!user || !id) return;
    await supabase.from("conversation_messages").insert({
      project_id: id,
      user_id: user.id,
      role,
      content,
    });
  };

  const streamChat = async (chatMessages: Message[], isInitial = false) => {
    setIsStreaming(true);
    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: chatMessages, project_id: id }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save messages
      if (!isInitial) {
        await saveMessage("user", chatMessages[chatMessages.length - 1].content);
      }
      if (assistantContent) {
        await saveMessage("assistant", assistantContent);
        // Detect what field the AI is asking about next
        setCurrentField(detectCurrentField(assistantContent));
      }

      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to get response");
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = async (content?: string) => {
    const userMsg = content || input.trim();
    if (!userMsg || isStreaming) return;
    setInput("");

    // Track filled field
    if (currentField && userMsg.length > 5) {
      setFilledFields(prev => ({ ...prev, [currentField]: userMsg }));
    }

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    await streamChat(newMessages);
  };

  const handleStructuredSelect = (value: string) => {
    handleSend(value);
  };

  // Get prompt config for current field
  const currentPrompt = currentField ? FIELD_PROMPTS[currentField] : null;
  const showStructuredCard = currentPrompt && !isStreaming && messages.length > 0;

  return (
    <div className="flex h-screen">
      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link to={`/project/${id}`} className="text-muted-foreground hover:text-foreground">
              {project?.name || "Project"}
            </Link>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">Discussion</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/project/${id}/readiness`}>
              <Button size="sm" variant="outline" className="gap-2">
                {overallScore >= 75 ? (
                  <Sparkles className="h-3.5 w-3.5 text-success" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                {overallScore >= 75 ? "Ready! Check Score" : "Check Readiness"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-md rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border bg-card shadow-soft"
                  }`}
                >
                  {msg.content ? (
                    msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Structured response card */}
            {showStructuredCard && (
              <StructuredCard
                question={currentPrompt.question}
                description={currentPrompt.description}
                options={currentPrompt.options}
                examples={currentPrompt.examples}
                onSelect={handleStructuredSelect}
              />
            )}
          </div>
        </div>

        {/* Progress tracker */}
        <div className="border-t bg-card/50 px-6 py-2">
          <ProgressTracker fields={discussionFields} />
        </div>

        {/* Input */}
        <div className="border-t px-6 py-4">
          <div className="mx-auto flex max-w-2xl gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type your answer or pick from suggestions above..."
              className="flex-1"
              disabled={isStreaming}
            />
            <Button onClick={() => handleSend()} size="icon" disabled={isStreaming || !input.trim()}>
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Live Readiness Sidebar */}
      <div className="hidden w-64 shrink-0 border-l p-3 lg:block">
        <LiveReadinessSidebar axes={readinessAxes} overallScore={overallScore} />
      </div>
    </div>
  );
}
