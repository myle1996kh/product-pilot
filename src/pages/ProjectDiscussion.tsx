import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Bot, User, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const initialMessages: Message[] = [
  {
    role: "assistant",
    content:
      "Hi! 👋 I've reviewed your project brief. Let me ask a few questions to better understand your vision.\n\nFirst — when you say 'e-commerce', are you thinking of a marketplace (multiple sellers) or a single-brand storefront?",
  },
];

export default function ProjectDiscussion() {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: input },
      {
        role: "assistant",
        content:
          "Got it! A single-brand storefront. That simplifies the architecture significantly. Next question — do you need inventory management, or will you integrate with an existing system?",
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Link to={`/project/${id}`} className="text-muted-foreground hover:text-foreground">
            E-commerce MVP
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
      <div className="flex-1 overflow-y-auto px-6 py-6">
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
                    : "bg-card border shadow-soft"
                }`}
              >
                {msg.content}
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

      {/* Summary sidebar hint */}
      <div className="border-t bg-card/50 px-6 py-2">
        <p className="text-center text-xs text-muted-foreground">
          🧠 AI is tracking{" "}
          <span className="font-medium text-foreground">5 of 8</span> required
          fields — keep chatting to fill the gaps
        </p>
      </div>

      {/* Input */}
      <div className="border-t px-6 py-4">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your answer..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
