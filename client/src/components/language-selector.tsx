import { Globe, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/translations";
import type { Language } from "@/lib/translations";

export function LanguageSelector() {
  const { language, setLanguage, aiTranslate, setAiTranslate, isTranslating } = useLanguage();
  const current = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 toggle-elevate h-9 px-2"
          data-testid="button-language-selector"
          aria-label={`Current language: ${current.name}. Click to change.`}
        >
          {isTranslating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span className="text-base leading-none" aria-hidden>{current.flag}</span>
          <span className="hidden sm:inline text-xs font-medium uppercase">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Language / Idioma</span>
          {isTranslating && (
            <span className="text-xs font-normal text-gray-500 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Translating…
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {LANGUAGES.map(l => {
          const isAI = l.source === "ai";
          const disabled = isAI && !aiTranslate;
          const isCurrent = l.code === language;
          return (
            <DropdownMenuItem
              key={l.code}
              disabled={disabled}
              onSelect={(e) => {
                if (disabled) { e.preventDefault(); return; }
                setLanguage(l.code as Language);
              }}
              className="flex items-center justify-between gap-2 cursor-pointer"
              data-testid={`option-language-${l.code}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0" aria-hidden>{l.flag}</span>
                <span className="font-medium truncate">{l.native}</span>
                <span className="text-xs text-gray-500 truncate hidden md:inline">{l.name}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                {isAI ? (
                  <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                    <Sparkles className="h-2.5 w-2.5" />AI
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Human</Badge>
                )}
                {isCurrent && <Check className="h-3.5 w-3.5 text-green-600" />}
              </span>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <div className="px-2 py-2 flex items-center justify-between gap-3">
          <label htmlFor="ai-trans-toggle" className="flex flex-col cursor-pointer min-w-0">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              AI-Powered Translation
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
              Enables 8 additional languages. Verify critical content.
            </span>
          </label>
          <Switch
            id="ai-trans-toggle"
            checked={aiTranslate}
            onCheckedChange={setAiTranslate}
            data-testid="switch-ai-translate"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
