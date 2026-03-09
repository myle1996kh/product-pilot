import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Bot, User, ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function ProjectDiscussion() {
  const { id } = useParams<{ id: string }>();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load project
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

  // Load messages
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

  useEffect(() => {
    if (dbMessages && dbMessages.length > 0) {
      setMessages(
        dbMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    } else if (project && dbMessages && dbMessages.length === 0) {
      // Send initial context to AI
      sendInitialContext();
    }
  }, [dbMessages, project]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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

Please introduce yourself briefly and ask the first clarifying question.`;

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

      // Add placeholder assistant message
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
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save to DB
      if (!isInitial) {
        await saveMessage("user", chatMessages[chatMessages.length - 1].content);
      }
      if (assistantContent) {
        await saveMessage("assistant", assistantContent);
      }

      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to get response");
      // Remove empty assistant message on error
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

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    await streamChat(newMessages);
  };

  const filledFields = messages.filter((m) => m.role === "assistant").length;
  const totalFields = 8;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Link to={`/project/${id}`} className="text-muted-foreground hover:text-foreground">
            {project?.name || "Project"}
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">Discussion</span>
        </div>
        <Link to={`/project/${id}/readiness`}>
          <Button size="sm" variant="outline" className="gap-2">
            Check Readiness <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
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
                {msg.content || (
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
        </div>
      </div>

      {/* Tracking bar */}
      <div className="border-t bg-card/50 px-6 py-2">
        <p className="text-center text-xs text-muted-foreground">
          🧠 AI is tracking{" "}
          <span className="font-medium text-foreground">
            {Math.min(filledFields, totalFields)} of {totalFields}
          </span>{" "}
          required fields — keep chatting to fill the gaps
        </p>
      </div>

      {/* Input */}
      <div className="border-t px-6 py-4">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type your answer..."
            className="flex-1"
            disabled={isStreaming}
          />
          <Button onClick={handleSend} size="icon" disabled={isStreaming || !input.trim()}>
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
