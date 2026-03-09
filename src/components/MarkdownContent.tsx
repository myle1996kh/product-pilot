import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content) {
    return <span className="italic text-muted-foreground">No content yet</span>;
  }

  return (
    <div className={cn("prose-custom", className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-5 text-lg font-bold text-foreground first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-base font-semibold text-foreground first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 text-sm font-semibold text-foreground first:mt-0">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-2 text-sm leading-relaxed text-foreground/80 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-4 list-disc space-y-1 text-sm text-foreground/80">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-foreground/80">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm leading-relaxed">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/70">{children}</em>
          ),
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-lg bg-muted p-3 text-xs font-mono text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-lg border bg-muted/50 p-0">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-3 border-primary/40 pl-4 italic text-foreground/70">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-border" />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs">{children}</td>
          ),
          tr: ({ children }) => (
            <tr className="border-b last:border-0">{children}</tr>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
