import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClipboardList, MapPin, MessageCircle, Heart, HandHeart, BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * RelatedTools — contextual cross-link strip between the major public tools.
 *
 * Every major tool page renders this so a visitor never dead-ends: from any
 * tool they can reach the logical next step without knowing it exists first.
 * Pass `current` to hide the link to the page the user is already on.
 */
export type RelatedToolKey =
  | "benefits-screener"
  | "how-to-apply"
  | "resource-finder"
  | "resource-directory"
  | "navigator"
  | "health-wellness"
  | "get-help";

const TOOLS: Array<{ key: RelatedToolKey; href: string; label: string; icon: LucideIcon }> = [
  { key: "benefits-screener", href: "/benefits-screener", label: "See what benefits I qualify for", icon: ClipboardList },
  { key: "how-to-apply", href: "/benefits/how-to-apply/SNAP", label: "Apply for benefits (step-by-step)", icon: BookOpen },
  { key: "resource-finder", href: "/resources", label: "Find help near me", icon: MapPin },
  { key: "resource-directory", href: "/resource-directory", label: "Local organizations directory", icon: HandHeart },
  { key: "navigator", href: "/navigator", label: "Talk to the AI Navigator", icon: MessageCircle },
  { key: "health-wellness", href: "/health-wellness", label: "Health & wellness", icon: Heart },
];

export function RelatedTools({ current, exclude = [] }: { current?: RelatedToolKey; exclude?: RelatedToolKey[] }) {
  const hidden = new Set<RelatedToolKey>([...(current ? [current] : []), ...exclude]);
  const tools = TOOLS.filter((t) => !hidden.has(t.key));
  if (tools.length === 0) return null;
  return (
    <Card className="bg-muted/30" data-testid="section-related-tools">
      <CardContent className="pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          What else can help
        </p>
        <div className="flex flex-wrap gap-2">
          {tools.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-background text-sm font-medium hover:bg-primary/5 hover:border-primary/40 transition-colors"
              data-testid={`link-related-${t.key}`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label} →
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
