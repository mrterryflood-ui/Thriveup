import { useState, useCallback, useEffect } from "react";
import { BadgeIcon } from "@/components/badge-icon";
import type { Badge } from "@shared/schema";
import { X } from "lucide-react";

interface CelebrationState {
  visible: boolean;
  badge: Badge | null;
}

export function useCelebration() {
  const [state, setState] = useState<CelebrationState>({ visible: false, badge: null });

  const celebrate = useCallback((badge: Badge) => {
    setState({ visible: true, badge });
  }, []);

  const dismiss = useCallback(() => {
    setState({ visible: false, badge: null });
  }, []);

  return { state, celebrate, dismiss };
}

interface CelebrationOverlayProps {
  badge: Badge | null;
  visible: boolean;
  onDismiss: () => void;
}

function Sparkle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute w-2 h-2 rounded-full animate-sparkle-float"
      style={style}
    />
  );
}

export function CelebrationOverlay({ badge, visible, onDismiss }: CelebrationOverlayProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible || !badge) return null;

  const sparkleColors = [
    "bg-amber-400", "bg-pink-400", "bg-blue-400", "bg-emerald-400",
    "bg-purple-400", "bg-cyan-400", "bg-rose-400", "bg-yellow-300",
  ];

  const sparkles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const distance = 80 + Math.random() * 120;
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;
    const delay = Math.random() * 0.6;
    const size = 4 + Math.random() * 8;

    return (
      <Sparkle
        key={i}
        style={{
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: `${delay}s`,
          animationDuration: `${1 + Math.random() * 0.5}s`,
        }}
      />
    );
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-celebration-in cursor-pointer"
      onClick={onDismiss}
      data-testid="celebration-overlay"
    >
      <button
        onClick={onDismiss}
        className="absolute top-6 right-6 text-white/70"
        data-testid="button-dismiss-celebration"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="relative flex flex-col items-center gap-4 animate-celebration-badge-in">
        {sparkles.map((s, i) => (
          <div key={i} className={sparkleColors[i % sparkleColors.length]}>
            {s}
          </div>
        ))}

        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-white/20 blur-xl scale-150 animate-pulse" />
          <BadgeIcon badge={badge} size="lg" earned />
        </div>

        <div className="text-center mt-4">
          <p className="text-white/80 text-sm font-medium tracking-wider uppercase mb-1">
            Badge Earned
          </p>
          <p className="text-white text-2xl font-bold">{badge.name}</p>
          <p className="text-white/60 text-sm mt-1 max-w-xs">{badge.description}</p>
        </div>
      </div>
    </div>
  );
}
