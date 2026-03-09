import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let mermaidInitialized = false;

function initMermaid(isDark: boolean) {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? "dark" : "default",
    securityLevel: "loose",
    fontFamily: "inherit",
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: "basis",
      padding: 16,
      nodeSpacing: 40,
      rankSpacing: 50,
    },
    themeVariables: isDark
      ? {
          primaryColor: "hsl(215, 80%, 55%)",
          primaryTextColor: "#fff",
          primaryBorderColor: "hsl(215, 60%, 40%)",
          lineColor: "hsl(215, 30%, 50%)",
          secondaryColor: "hsl(260, 50%, 40%)",
          tertiaryColor: "hsl(160, 50%, 30%)",
          background: "hsl(220, 20%, 14%)",
          mainBkg: "hsl(220, 20%, 18%)",
          nodeBorder: "hsl(215, 30%, 40%)",
          clusterBkg: "hsl(220, 15%, 20%)",
          titleColor: "#e2e8f0",
          edgeLabelBackground: "hsl(220, 20%, 14%)",
        }
      : {
          primaryColor: "hsl(215, 80%, 55%)",
          primaryTextColor: "#fff",
          primaryBorderColor: "hsl(215, 60%, 70%)",
          lineColor: "hsl(215, 30%, 60%)",
          secondaryColor: "hsl(260, 60%, 65%)",
          tertiaryColor: "hsl(160, 60%, 45%)",
          background: "#ffffff",
          mainBkg: "#f8fafc",
          nodeBorder: "hsl(215, 30%, 75%)",
          clusterBkg: "#f1f5f9",
          titleColor: "#1e293b",
          edgeLabelBackground: "#ffffff",
        },
  });
  mermaidInitialized = true;
}

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export default function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    initMermaid(isDark);
    mermaidInitialized = false; // Force re-init on theme change

    async function render() {
      try {
        const { svg: renderedSvg } = await mermaid.render(
          idRef.current,
          chart.trim()
        );
        setSvg(renderedSvg);
        setError("");
      } catch (e: any) {
        console.error("Mermaid render error:", e);
        setError(e.message || "Failed to render diagram");
      }
    }

    render();
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Diagram error: {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto rounded-xl border bg-card p-4 shadow-soft ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
