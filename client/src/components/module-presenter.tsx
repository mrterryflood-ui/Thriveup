import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, X, Maximize2, Minimize2,
  Lightbulb, Wrench, BookOpen, Target, Clock, Users,
  Presentation, ArrowRight,
} from "lucide-react";

interface SlideModule {
  title: string;
  topics: string[];
  duration: string;
  project?: string;
  memoryAid?: string;
}

interface PresentationConfig {
  trackTitle: string;
  trackSubtitle: string;
  gradient: string;
  modules: SlideModule[];
  certification?: string;
}

interface Slide {
  type: "title" | "agenda" | "topic" | "activity" | "memory" | "summary";
  title: string;
  subtitle?: string;
  content?: string[];
  highlight?: string;
  moduleIndex?: number;
}

function buildSlides(config: PresentationConfig): Slide[] {
  const slides: Slide[] = [];

  slides.push({
    type: "title",
    title: config.trackTitle,
    subtitle: config.trackSubtitle,
  });

  config.modules.forEach((mod, mi) => {
    slides.push({
      type: "agenda",
      title: mod.title,
      subtitle: `Module ${mi + 1} of ${config.modules.length}`,
      content: mod.topics,
      highlight: mod.duration,
      moduleIndex: mi,
    });

    const chunkSize = 3;
    for (let i = 0; i < mod.topics.length; i += chunkSize) {
      const chunk = mod.topics.slice(i, i + chunkSize);
      slides.push({
        type: "topic",
        title: mod.title,
        subtitle: `Topics ${i + 1}–${Math.min(i + chunkSize, mod.topics.length)}`,
        content: chunk,
        moduleIndex: mi,
      });
    }

    if (mod.memoryAid) {
      slides.push({
        type: "memory",
        title: "Memory Aid",
        subtitle: mod.title,
        content: [mod.memoryAid],
        moduleIndex: mi,
      });
    }

    if (mod.project) {
      slides.push({
        type: "activity",
        title: "Hands-On Activity",
        subtitle: mod.title,
        content: [mod.project],
        moduleIndex: mi,
      });
    }
  });

  slides.push({
    type: "summary",
    title: "What We Covered",
    content: config.modules.map((m, i) => `Module ${i + 1}: ${m.title}`),
    highlight: config.certification,
  });

  return slides;
}

function SlideRenderer({ slide, gradient, slideNum, totalSlides }: {
  slide: Slide;
  gradient: string;
  slideNum: number;
  totalSlides: number;
}) {
  if (slide.type === "title") {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br ${gradient} text-white p-12`}>
        <Badge className="bg-white/20 text-white border-white/30 mb-6 text-base px-4 py-1.5">
          <Presentation className="h-4 w-4 mr-2" /> Instructor-Led Session
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-4">{slide.title}</h1>
        {slide.subtitle && <p className="text-2xl text-white/80 text-center">{slide.subtitle}</p>}
        <div className="mt-12 text-white/50 text-sm">ThriveUp Academy · Press arrow keys or click to navigate</div>
      </div>
    );
  }

  if (slide.type === "agenda") {
    return (
      <div className="flex flex-col h-full p-12 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-3 mb-2">
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white text-sm font-bold`}>
            {slide.subtitle}
          </div>
          {slide.highlight && (
            <Badge variant="outline" className="text-sm"><Clock className="h-3.5 w-3.5 mr-1" />{slide.highlight}</Badge>
          )}
        </div>
        <h2 className="text-4xl font-bold mb-8 text-zinc-900 dark:text-white">{slide.title}</h2>
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> What We'll Cover
          </h3>
          <ul className="space-y-3">
            {slide.content?.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-xl">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5`}>
                  {i + 1}
                </div>
                <span className="text-zinc-700 dark:text-zinc-200">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm text-muted-foreground">Slide {slideNum} of {totalSlides}</div>
      </div>
    );
  }

  if (slide.type === "topic") {
    return (
      <div className="flex flex-col h-full p-12 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
          <Target className="h-4 w-4" /> {slide.title} · {slide.subtitle}
        </div>
        <div className="flex-1 flex flex-col justify-center space-y-8">
          {slide.content?.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shrink-0`}>
                <ArrowRight className="h-5 w-5" />
              </div>
              <p className="text-2xl md:text-3xl text-zinc-800 dark:text-zinc-100 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">Slide {slideNum} of {totalSlides}</div>
      </div>
    );
  }

  if (slide.type === "memory") {
    return (
      <div className="flex flex-col h-full p-12 bg-amber-50 dark:bg-amber-950/30">
        <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300 text-sm">
          <Lightbulb className="h-4 w-4" /> {slide.subtitle}
        </div>
        <h2 className="text-4xl font-bold mb-8 text-amber-800 dark:text-amber-200 flex items-center gap-3">
          <Lightbulb className="h-10 w-10" /> Memory Aid
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-10 max-w-3xl border-2 border-amber-300 dark:border-amber-700">
            <p className="text-3xl md:text-4xl font-bold text-center text-amber-700 dark:text-amber-300 leading-relaxed">
              {slide.content?.[0]}
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">Slide {slideNum} of {totalSlides}</div>
      </div>
    );
  }

  if (slide.type === "activity") {
    return (
      <div className={`flex flex-col h-full p-12 bg-gradient-to-br ${gradient}`}>
        <div className="flex items-center gap-2 mb-2 text-white/70 text-sm">
          <Wrench className="h-4 w-4" /> {slide.subtitle}
        </div>
        <h2 className="text-4xl font-bold mb-8 text-white flex items-center gap-3">
          <Wrench className="h-10 w-10" /> Hands-On Activity
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-10 max-w-3xl border border-white/20">
            <p className="text-2xl md:text-3xl text-white text-center leading-relaxed">
              {slide.content?.[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/70">
          <Users className="h-5 w-5" />
          <span>Individual or Group Activity</span>
        </div>
        <div className="text-sm text-white/50 mt-2">Slide {slideNum} of {totalSlides}</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full p-12 bg-gradient-to-br ${gradient} text-white`}>
      <h2 className="text-4xl font-bold mb-8">{slide.title}</h2>
      <div className="flex-1 flex flex-col justify-center">
        <ul className="space-y-4">
          {slide.content?.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-xl">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">✓</div>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {slide.highlight && (
          <div className="mt-8 p-4 bg-white/10 rounded-xl border border-white/20 text-lg">
            🎓 {slide.highlight}
          </div>
        )}
      </div>
      <div className="text-sm text-white/50">Slide {slideNum} of {totalSlides}</div>
    </div>
  );
}

export function ModulePresenter({ config, moduleIndex, onClose }: {
  config: PresentationConfig;
  moduleIndex?: number;
  onClose: () => void;
}) {
  const allSlides = buildSlides(config);

  const slides = moduleIndex !== undefined
    ? [allSlides[0], ...allSlides.filter(s => s.moduleIndex === moduleIndex)]
    : allSlides;

  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const next = useCallback(() => setCurrent(c => Math.min(c + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setCurrent(c => Math.max(c - 1, 0)), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape") { onClose(); }
      if (e.key === "f" || e.key === "F") { toggleFullscreen(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onClose, toggleFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black" data-testid="module-presenter">
      <div className="relative w-full h-full">
        <SlideRenderer
          slide={slides[current]}
          gradient={config.gradient}
          slideNum={current + 1}
          totalSlides={slides.length}
        />

        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <Button
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white bg-black/20 hover:bg-black/40"
            onClick={toggleFullscreen}
            data-testid="button-fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white bg-black/20 hover:bg-black/40"
            onClick={onClose}
            data-testid="button-close-presenter"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-300`}
            style={{ width: `${((current + 1) / slides.length) * 100}%` }}
          />
        </div>

        {current > 0 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            onClick={prev}
            data-testid="button-prev-slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {current < slides.length - 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            onClick={next}
            data-testid="button-next-slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}

export function PresentButton({ onClick, label }: { onClick: () => void; label?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="gap-1.5"
      data-testid="button-present-module"
    >
      <Presentation className="h-3.5 w-3.5" />
      {label || "Present"}
    </Button>
  );
}
