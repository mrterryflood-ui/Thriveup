import { useEffect } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import AICompanion from "@/components/ai-companion";
import { useLanguage } from "@/lib/i18n";

export default function AICompanionPage() {
  const { language } = useLanguage();

  useEffect(() => { document.title = "Spark AI Companion | ThriveUp Academy"; }, []);
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-ai-companion-heading">
          <Sparkles className="h-7 w-7 text-primary" />
          {language === "es" ? "Companero de Aprendizaje" : "Learning Companion"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === "es"
            ? "Conoce a Spark — tu companero personal de aprendizaje que esta aqui para ayudarte a entender, explorar y crecer."
            : "Meet Spark — your personal learning buddy who's here to help you understand, explore, and grow."}
        </p>
        <Link href="/ai-tools">
          <Button variant="outline" size="sm" className="mt-2" data-testid="button-spark-ai-tools">
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            {language === "es" ? "Abrir herramientas de creacion" : "Open AI Creation Tools"}
          </Button>
        </Link>
      </div>
      <AICompanion className="h-[calc(100vh-250px)]" language={language} />
    </div>
  );
}
