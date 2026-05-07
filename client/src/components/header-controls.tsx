import { WifiOff, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { useLanguage } from "@/lib/i18n";
import { useBandwidth } from "@/lib/bandwidth-mode";
import { Moon, Sun } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LanguageSelector } from "./language-selector";

export function HeaderControls() {
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const { isLowBandwidth, toggleBandwidth } = useBandwidth();

  return (
    <div className="flex items-center gap-1">
      <LanguageSelector />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleBandwidth}
            data-testid="button-bandwidth-toggle"
            className={`toggle-elevate ${isLowBandwidth ? "toggle-elevated" : ""}`}
            aria-label={isLowBandwidth ? "Disable low-bandwidth mode" : "Enable low-bandwidth mode"}
          >
            {isLowBandwidth ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isLowBandwidth
            ? (language === "es" ? "Desactivar modo bajo ancho de banda" : "Disable low-bandwidth mode")
            : (language === "es" ? "Activar modo bajo ancho de banda" : "Enable low-bandwidth mode")}
        </TooltipContent>
      </Tooltip>

      <Button
        size="icon"
        variant="ghost"
        onClick={toggleTheme}
        data-testid="button-theme-toggle"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
