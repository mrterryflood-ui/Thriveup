import { Accessibility, Eye, Type, Layout, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useAccessibility } from "@/lib/accessibility";
import { useLanguage } from "@/lib/i18n";

export function AccessibilityPanel() {
  const { settings, updateSetting, resetSettings, activeCount } = useAccessibility();
  const { language } = useLanguage();
  const isEs = language === "es";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" data-testid="button-accessibility" aria-label={isEs ? "Configuracion de accesibilidad" : "Accessibility settings"} className="relative">
          <Accessibility className="h-4 w-4" />
          {activeCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]" data-testid="badge-accessibility-count">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-auto" data-testid="panel-accessibility">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            {isEs ? "Accesibilidad" : "Accessibility"}
          </SheetTitle>
          <SheetDescription>
            {isEs
              ? "Personaliza tu experiencia de aprendizaje. Estos ajustes se guardan automaticamente."
              : "Customize your learning experience. These settings save automatically."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          <Card className="p-4 space-y-4" data-testid="section-reading">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span className="font-semibold text-sm">{isEs ? "Lectura y Texto" : "Reading & Text"}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="dyslexia-font" className="text-sm cursor-pointer">
                {isEs ? "Fuente para dislexia" : "Dyslexia-friendly font"}
                <span className="block text-xs text-muted-foreground">{isEs ? "Usa OpenDyslexic para mejor legibilidad" : "Uses OpenDyslexic for better readability"}</span>
              </Label>
              <Switch id="dyslexia-font" checked={settings.dyslexiaFont} onCheckedChange={(v) => updateSetting("dyslexiaFont", v)} data-testid="switch-dyslexia-font" />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="large-text" className="text-sm cursor-pointer">
                {isEs ? "Texto grande" : "Larger text"}
                <span className="block text-xs text-muted-foreground">{isEs ? "Aumenta el tamano del texto en todo el sitio" : "Increases text size across the site"}</span>
              </Label>
              <Switch id="large-text" checked={settings.largeText} onCheckedChange={(v) => updateSetting("largeText", v)} data-testid="switch-large-text" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{isEs ? "Espaciado de lineas" : "Line spacing"}</Label>
              <Select value={settings.lineSpacing} onValueChange={(v) => updateSetting("lineSpacing", v as "normal" | "relaxed" | "loose")}>
                <SelectTrigger data-testid="select-line-spacing" aria-label={isEs ? "Espaciado de lineas" : "Line spacing"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{isEs ? "Normal" : "Normal"}</SelectItem>
                  <SelectItem value="relaxed">{isEs ? "Relajado" : "Relaxed"}</SelectItem>
                  <SelectItem value="loose">{isEs ? "Amplio" : "Loose"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-4 space-y-4" data-testid="section-visual">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="font-semibold text-sm">{isEs ? "Visual" : "Visual"}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="high-contrast" className="text-sm cursor-pointer">
                {isEs ? "Alto contraste" : "High contrast"}
                <span className="block text-xs text-muted-foreground">{isEs ? "Aumenta el contraste de colores" : "Increases color contrast"}</span>
              </Label>
              <Switch id="high-contrast" checked={settings.highContrast} onCheckedChange={(v) => updateSetting("highContrast", v)} data-testid="switch-high-contrast" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{isEs ? "Filtro de color" : "Color overlay"}</Label>
              <Select value={settings.colorOverlay} onValueChange={(v) => updateSetting("colorOverlay", v as "none" | "warm" | "cool" | "yellow")}>
                <SelectTrigger data-testid="select-color-overlay" aria-label={isEs ? "Filtro de color" : "Color overlay"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isEs ? "Ninguno" : "None"}</SelectItem>
                  <SelectItem value="warm">{isEs ? "Calido (ambar)" : "Warm (amber)"}</SelectItem>
                  <SelectItem value="cool">{isEs ? "Frio (azul)" : "Cool (blue)"}</SelectItem>
                  <SelectItem value="yellow">{isEs ? "Amarillo" : "Yellow"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-4 space-y-4" data-testid="section-neurodivergent">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span className="font-semibold text-sm">{isEs ? "Neurodivergente" : "Neurodivergent Support"}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="reduced-motion" className="text-sm cursor-pointer">
                {isEs ? "Reducir movimiento" : "Reduce motion"}
                <span className="block text-xs text-muted-foreground">{isEs ? "Desactiva animaciones y transiciones" : "Disables animations and transitions"}</span>
              </Label>
              <Switch id="reduced-motion" checked={settings.reducedMotion} onCheckedChange={(v) => updateSetting("reducedMotion", v)} data-testid="switch-reduced-motion" />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="focus-mode" className="text-sm cursor-pointer">
                {isEs ? "Modo enfoque" : "Focus mode"}
                <span className="block text-xs text-muted-foreground">{isEs ? "Reduce distracciones visuales" : "Reduces visual distractions"}</span>
              </Label>
              <Switch id="focus-mode" checked={settings.focusMode} onCheckedChange={(v) => updateSetting("focusMode", v)} data-testid="switch-focus-mode" />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="simplified-layout" className="text-sm cursor-pointer">
                {isEs ? "Diseno simplificado" : "Simplified layout"}
                <span className="block text-xs text-muted-foreground">{isEs ? "Reduce la complejidad visual" : "Reduces visual complexity"}</span>
              </Label>
              <Switch id="simplified-layout" checked={settings.simplifiedLayout} onCheckedChange={(v) => updateSetting("simplifiedLayout", v)} data-testid="switch-simplified-layout" />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="screen-reader" className="text-sm cursor-pointer">
                {isEs ? "Optimizado para lector de pantalla" : "Screen reader optimized"}
                <span className="block text-xs text-muted-foreground">{isEs ? "Mejora la compatibilidad con lectores de pantalla" : "Improves screen reader compatibility"}</span>
              </Label>
              <Switch id="screen-reader" checked={settings.screenReaderOptimized} onCheckedChange={(v) => updateSetting("screenReaderOptimized", v)} data-testid="switch-screen-reader" />
            </div>
          </Card>

          <Button variant="outline" className="w-full" onClick={resetSettings} data-testid="button-reset-accessibility">
            <RotateCcw className="h-4 w-4 mr-2" />
            {isEs ? "Restablecer valores predeterminados" : "Reset to defaults"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
