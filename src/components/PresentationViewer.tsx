import { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─── Scaled Slide ─── */
interface ScaledSlideProps {
  children: ReactNode;
  containerWidth: number;
  containerHeight: number;
  className?: string;
  onClick?: () => void;
}

export function ScaledSlide({ children, containerWidth, containerHeight, className, onClick }: ScaledSlideProps) {
  const scaleX = containerWidth / 1920;
  const scaleY = containerHeight / 1080;
  const scale = Math.min(scaleX, scaleY);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ width: containerWidth, height: containerHeight }}
      onClick={onClick}
    >
      <div
        className="slide-content absolute"
        style={{
          width: 1920,
          height: 1080,
          left: "50%",
          top: "50%",
          marginLeft: -960,
          marginTop: -540,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Slide Data Type ─── */
export interface SlideData {
  id: string;
  title?: string;
  subtitle?: string;
  content?: string;
  bullets?: string[];
  quote?: string;
  quoteAuthor?: string;
  layout: "title" | "section" | "bullets" | "quote" | "two-column" | "big-number" | "closing";
  accent?: string;
  number?: string;
  numberLabel?: string;
  leftContent?: string;
  rightContent?: string;
  rightBullets?: string[];
}

/* ─── Slide Layouts ─── */
function TitleSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[hsl(20,20%,12%)] via-[hsl(16,30%,18%)] to-[hsl(20,20%,10%)] px-[160px] text-center">
      <div className="mb-[30px] h-[4px] w-[120px] rounded-full bg-[hsl(16,65%,56%)]" />
      <h1 className="mb-[30px] font-[Fraunces] text-[84px] font-bold leading-[1.05] tracking-tight text-white">
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p className="max-w-[1100px] text-[36px] font-light leading-[1.4] text-white/60">
          {slide.subtitle}
        </p>
      )}
    </div>
  );
}

function SectionSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex h-full w-full flex-col justify-center bg-[hsl(40,33%,98%)] px-[160px]">
      <div className="mb-[24px] text-[22px] font-semibold uppercase tracking-[6px] text-[hsl(16,65%,56%)]">
        {slide.subtitle || "Section"}
      </div>
      <h2 className="mb-[32px] font-[Fraunces] text-[72px] font-bold leading-[1.1] text-[hsl(20,20%,16%)]">
        {slide.title}
      </h2>
      {slide.content && (
        <p className="max-w-[1000px] text-[32px] leading-[1.5] text-[hsl(20,10%,40%)]">
          {slide.content}
        </p>
      )}
    </div>
  );
}

function BulletsSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex h-full w-full flex-col justify-center bg-[hsl(40,33%,98%)] px-[160px]">
      <h2 className="mb-[56px] font-[Fraunces] text-[56px] font-bold leading-[1.1] text-[hsl(20,20%,16%)]">
        {slide.title}
      </h2>
      <div className="space-y-[28px]">
        {slide.bullets?.map((bullet, i) => (
          <div key={i} className="flex items-start gap-[24px]">
            <div className="mt-[10px] flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-[hsl(16,65%,56%)] text-[16px] font-bold text-white">
              {i + 1}
            </div>
            <p className="text-[30px] leading-[1.5] text-[hsl(20,20%,24%)]">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuoteSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[hsl(20,20%,12%)] to-[hsl(16,20%,16%)] px-[200px] text-center">
      <div className="mb-[40px] text-[120px] leading-none text-[hsl(16,65%,56%)]">"</div>
      <blockquote className="mb-[48px] max-w-[1200px] font-[Fraunces] text-[44px] font-medium italic leading-[1.4] text-white/90">
        {slide.quote}
      </blockquote>
      {slide.quoteAuthor && (
        <p className="text-[24px] font-medium tracking-wide text-[hsl(16,65%,56%)]">
          — {slide.quoteAuthor}
        </p>
      )}
    </div>
  );
}

function BigNumberSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[hsl(40,33%,98%)] px-[160px] text-center">
      <div className="mb-[20px] text-[160px] font-bold leading-none text-[hsl(16,65%,56%)]">
        {slide.number}
      </div>
      <div className="mb-[36px] text-[36px] font-semibold text-[hsl(20,20%,16%)]">
        {slide.numberLabel}
      </div>
      {slide.content && (
        <p className="max-w-[900px] text-[28px] leading-[1.5] text-[hsl(20,10%,40%)]">
          {slide.content}
        </p>
      )}
    </div>
  );
}

function TwoColumnSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex h-full w-full bg-[hsl(40,33%,98%)]">
      <div className="flex w-1/2 flex-col justify-center px-[100px]">
        <h2 className="mb-[32px] font-[Fraunces] text-[52px] font-bold leading-[1.1] text-[hsl(20,20%,16%)]">
          {slide.title}
        </h2>
        <p className="text-[28px] leading-[1.5] text-[hsl(20,10%,40%)]">
          {slide.leftContent || slide.content}
        </p>
      </div>
      <div className="flex w-1/2 flex-col justify-center border-l-[3px] border-[hsl(30,15%,88%)] px-[100px]">
        {slide.rightBullets?.map((b, i) => (
          <div key={i} className="mb-[20px] flex items-start gap-[16px]">
            <div className="mt-[6px] h-[12px] w-[12px] shrink-0 rounded-full bg-[hsl(16,65%,56%)]" />
            <p className="text-[26px] leading-[1.4] text-[hsl(20,20%,24%)]">{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClosingSlide({ slide }: { slide: SlideData }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[hsl(20,20%,12%)] via-[hsl(16,30%,18%)] to-[hsl(20,20%,10%)] px-[160px] text-center">
      <h1 className="mb-[30px] font-[Fraunces] text-[72px] font-bold tracking-tight text-white">
        {slide.title || "Let's Build This."}
      </h1>
      {slide.subtitle && (
        <p className="mb-[50px] text-[32px] text-white/50">{slide.subtitle}</p>
      )}
      <div className="h-[4px] w-[80px] rounded-full bg-[hsl(16,65%,56%)]" />
    </div>
  );
}

const LAYOUT_COMPONENTS: Record<SlideData["layout"], React.FC<{ slide: SlideData }>> = {
  title: TitleSlide,
  section: SectionSlide,
  bullets: BulletsSlide,
  quote: QuoteSlide,
  "big-number": BigNumberSlide,
  "two-column": TwoColumnSlide,
  closing: ClosingSlide,
};

function RenderSlide({ slide }: { slide: SlideData }) {
  const Component = LAYOUT_COMPONENTS[slide.layout] || SectionSlide;
  return <Component slide={slide} />;
}

/* ─── Presentation Viewer ─── */
interface PresentationViewerProps {
  slides: SlideData[];
  title?: string;
}

export default function PresentationViewer({ slides, title }: PresentationViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 450 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keyboard navigation
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentIndex((i) => Math.min(i + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen?.();
        }
        setShowGrid(false);
      } else if (e.key === "g" || e.key === "G") {
        setShowGrid((v) => !v);
      } else if (e.key === "f" || e.key === "F5") {
        e.preventDefault();
        toggleFullscreen();
      }
    },
    [slides.length, isFullscreen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      fullscreenRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (slides.length === 0) return null;
  const currentSlide = slides[currentIndex];

  // Grid view
  if (showGrid) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-muted-foreground">
            All Slides ({slides.length})
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowGrid(false)} className="gap-1.5 text-xs">
            <Grid3X3 className="h-3.5 w-3.5" /> Close Grid
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              onClick={() => { setCurrentIndex(i); setShowGrid(false); }}
              className={cn(
                "cursor-pointer overflow-hidden rounded-lg border-2 transition-all hover:shadow-card",
                i === currentIndex ? "border-primary shadow-card" : "border-border"
              )}
            >
              <ScaledSlide containerWidth={280} containerHeight={158}>
                <RenderSlide slide={slide} />
              </ScaledSlide>
              <div className="bg-card px-2 py-1.5 text-center text-[10px] font-medium text-muted-foreground">
                {i + 1}. {slide.title || slide.layout}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={fullscreenRef} className={cn(isFullscreen && "flex h-screen w-screen items-center justify-center bg-black")}>
      {/* Main slide */}
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-xl border shadow-card",
          isFullscreen ? "h-full w-full border-0 rounded-none" : "aspect-video w-full"
        )}
      >
        <ScaledSlide
          containerWidth={isFullscreen ? window.innerWidth : containerSize.w}
          containerHeight={isFullscreen ? window.innerHeight : containerSize.h}
        >
          <RenderSlide slide={currentSlide} />
        </ScaledSlide>

        {/* Navigation overlay */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/40 to-transparent px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
              disabled={currentIndex === 0}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[60px] text-center text-xs font-medium text-white">
              {currentIndex + 1} / {slides.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex((i) => Math.min(i + 1, slides.length - 1))}
              disabled={currentIndex === slides.length - 1}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGrid(true)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {!isFullscreen && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-all",
                i === currentIndex ? "border-primary shadow-soft" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <ScaledSlide containerWidth={120} containerHeight={68}>
                <RenderSlide slide={slide} />
              </ScaledSlide>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
