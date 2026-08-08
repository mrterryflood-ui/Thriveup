import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Presentation, Video, Megaphone, Briefcase, Search, Compass,
  ClipboardList, FileText, UserCheck, Lightbulb, Lock, CheckCircle,
  Sparkles, BookOpen, ChevronRight
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ErrorRetry } from "@/components/error-retry";

const ICON_MAP: Record<string, any> = {
  "presentation": Presentation,
  "video": Video,
  "megaphone": Megaphone,
  "briefcase": Briefcase,
  "search": Search,
  "compass": Compass,
  "clipboard-list": ClipboardList,
  "file-text": FileText,
  "user-check": UserCheck,
  "lightbulb": Lightbulb,
};

const CATEGORY_FILTERS = ["All", "Create", "Plan", "Research", "Write"];

const MODULE_QUIZZES: Record<string, { q: string; qEs: string; options: string[]; optionsEs: string[]; answer: number }[]> = {
  "ai-brainstorm": [
    { q: "What is the most important rule of brainstorming?", qEs: "Cual es la regla mas importante de la lluvia de ideas?", options: ["Never judge ideas during brainstorming", "Only write down good ideas", "Always work alone", "Limit yourself to 3 ideas"], optionsEs: ["Nunca juzgues las ideas durante la lluvia de ideas", "Solo escribe buenas ideas", "Siempre trabaja solo", "Limitarte a 3 ideas"], answer: 0 },
    { q: "How can AI help with brainstorming?", qEs: "Como puede la IA ayudar con la lluvia de ideas?", options: ["It replaces your creativity", "It generates diverse perspectives you might not think of", "It decides the best idea for you", "It copies other people's ideas"], optionsEs: ["Reemplaza tu creatividad", "Genera perspectivas diversas que quizas no pensarias", "Decide la mejor idea por ti", "Copia las ideas de otras personas"], answer: 1 },
  ],
  "ai-research": [
    { q: "What should you always do with AI-generated research?", qEs: "Que deberias hacer siempre con la investigacion generada por IA?", options: ["Trust it completely", "Verify facts from reliable sources", "Share it without checking", "Ignore the sources"], optionsEs: ["Confiar completamente", "Verificar los hechos de fuentes confiables", "Compartirla sin revisar", "Ignorar las fuentes"], answer: 1 },
    { q: "What makes a good research question?", qEs: "Que hace una buena pregunta de investigacion?", options: ["It should be as broad as possible", "It should be specific and focused", "It should have only one answer", "It should be about your opinion"], optionsEs: ["Debe ser lo mas amplia posible", "Debe ser especifica y enfocada", "Debe tener una sola respuesta", "Debe ser sobre tu opinion"], answer: 1 },
  ],
  "ai-documents": [
    { q: "When using AI to write, what is your role?", qEs: "Cuando usas IA para escribir, cual es tu papel?", options: ["Let AI write everything for you", "Guide the AI and add your own voice and ideas", "Copy what AI writes exactly", "Only use AI for spelling"], optionsEs: ["Dejar que la IA escriba todo por ti", "Guiar la IA y agregar tu propia voz e ideas", "Copiar exactamente lo que la IA escribe", "Solo usar IA para ortografia"], answer: 1 },
    { q: "What is the best way to improve AI-generated writing?", qEs: "Cual es la mejor manera de mejorar la escritura generada por IA?", options: ["Submit it as-is", "Review, edit, and add your personal touch", "Ask AI to write it again", "Make it longer"], optionsEs: ["Enviarla tal cual", "Revisar, editar y agregar tu toque personal", "Pedir a la IA que la reescriba", "Hacerla mas larga"], answer: 1 },
  ],
  "ai-presentations": [
    { q: "What makes a great presentation slide?", qEs: "Que hace una gran diapositiva de presentacion?", options: ["Lots of text on every slide", "Clear visuals and key points only", "No images at all", "Reading directly from the slide"], optionsEs: ["Mucho texto en cada diapositiva", "Imagenes claras y solo puntos clave", "Sin imagenes", "Leer directamente de la diapositiva"], answer: 1 },
    { q: "How should you use AI when creating a presentation?", qEs: "Como deberias usar la IA al crear una presentacion?", options: ["Let AI create the whole thing", "Use AI to outline and organize, then personalize", "Only use AI for the title", "Avoid using AI for presentations"], optionsEs: ["Dejar que la IA cree todo", "Usar IA para esquematizar y organizar, luego personalizar", "Solo usar IA para el titulo", "Evitar usar IA para presentaciones"], answer: 1 },
  ],
  "ai-video": [
    { q: "What is the first step in creating a video?", qEs: "Cual es el primer paso para crear un video?", options: ["Start filming immediately", "Plan your story and write a script", "Add special effects", "Upload to the internet"], optionsEs: ["Empezar a filmar inmediatamente", "Planificar tu historia y escribir un guion", "Agregar efectos especiales", "Subir a internet"], answer: 1 },
    { q: "How can AI help with video creation?", qEs: "Como puede la IA ayudar con la creacion de videos?", options: ["It films the video for you", "It helps write scripts and plan storyboards", "It replaces the need for creativity", "It edits everything automatically"], optionsEs: ["Filma el video por ti", "Ayuda a escribir guiones y planificar storyboards", "Reemplaza la necesidad de creatividad", "Edita todo automaticamente"], answer: 1 },
  ],
  "ai-project-planning": [
    { q: "Why is breaking a project into smaller tasks helpful?", qEs: "Por que es util dividir un proyecto en tareas mas pequenas?", options: ["It makes the project take longer", "It makes each step manageable and trackable", "It creates more work", "It is not helpful at all"], optionsEs: ["Hace que el proyecto tome mas tiempo", "Hace cada paso manejable y rastreable", "Crea mas trabajo", "No es util en absoluto"], answer: 1 },
    { q: "What should a good project timeline include?", qEs: "Que debe incluir un buen cronograma de proyecto?", options: ["Only the final deadline", "Milestones, deadlines, and who does what", "Just a start date", "No dates at all"], optionsEs: ["Solo la fecha limite final", "Hitos, fechas limite y quien hace que", "Solo una fecha de inicio", "Sin fechas"], answer: 1 },
  ],
  "ai-life-planning": [
    { q: "What is the SMART goal method?", qEs: "Que es el metodo de metas SMART?", options: ["Goals that are really difficult", "Specific, Measurable, Achievable, Relevant, Time-bound", "Goals you keep secret", "Goals without deadlines"], optionsEs: ["Metas que son muy dificiles", "Especificas, Medibles, Alcanzables, Relevantes, con Tiempo definido", "Metas que mantienes en secreto", "Metas sin fechas limite"], answer: 1 },
    { q: "How can AI help you plan your future?", qEs: "Como puede la IA ayudarte a planificar tu futuro?", options: ["It tells you exactly what to do", "It helps you explore options and create action plans", "It makes decisions for you", "It predicts the future"], optionsEs: ["Te dice exactamente que hacer", "Te ayuda a explorar opciones y crear planes de accion", "Toma decisiones por ti", "Predice el futuro"], answer: 1 },
  ],
  "ai-business": [
    { q: "What is the most important part of a business plan?", qEs: "Cual es la parte mas importante de un plan de negocios?", options: ["The logo", "Understanding your customers and solving their problem", "Having the most money", "Choosing a cool name"], optionsEs: ["El logo", "Entender a tus clientes y resolver su problema", "Tener mas dinero", "Elegir un nombre genial"], answer: 1 },
    { q: "How can AI help with entrepreneurship?", qEs: "Como puede la IA ayudar con el emprendimiento?", options: ["It runs the business for you", "It helps analyze markets and develop strategies", "It guarantees success", "It replaces teamwork"], optionsEs: ["Dirige el negocio por ti", "Ayuda a analizar mercados y desarrollar estrategias", "Garantiza el exito", "Reemplaza el trabajo en equipo"], answer: 1 },
  ],
  "ai-sales": [
    { q: "What is ethical persuasion?", qEs: "Que es la persuasion etica?", options: ["Tricking people into buying things", "Honestly showing how something helps others", "Lying about your product", "Pressuring people to say yes"], optionsEs: ["Enganar a la gente para que compre cosas", "Mostrar honestamente como algo ayuda a otros", "Mentir sobre tu producto", "Presionar a la gente para que diga si"], answer: 1 },
    { q: "What makes a good sales pitch?", qEs: "Que hace un buen discurso de ventas?", options: ["Talking as fast as possible", "Clearly explaining the value and benefits", "Using complicated words", "Making promises you cannot keep"], optionsEs: ["Hablar lo mas rapido posible", "Explicar claramente el valor y los beneficios", "Usar palabras complicadas", "Hacer promesas que no puedes cumplir"], answer: 1 },
  ],
  "ai-resume": [
    { q: "What should a resume highlight?", qEs: "Que debe destacar un curriculum?", options: ["Every single thing you have ever done", "Your most relevant skills and achievements", "Your favorite color", "How old you are"], optionsEs: ["Todo lo que has hecho", "Tus habilidades y logros mas relevantes", "Tu color favorito", "Tu edad"], answer: 1 },
    { q: "How can AI help build your professional brand?", qEs: "Como puede la IA ayudar a construir tu marca profesional?", options: ["It creates a fake identity", "It helps organize your strengths and present them clearly", "It writes lies about you", "It replaces real experience"], optionsEs: ["Crea una identidad falsa", "Ayuda a organizar tus fortalezas y presentarlas claramente", "Escribe mentiras sobre ti", "Reemplaza la experiencia real"], answer: 1 },
  ],
};

const MODULE_INTROS: Record<string, { en: string; es: string }> = {
  "ai-brainstorm": { en: "In this module, you'll learn how AI can supercharge your brainstorming sessions. AI is a tool that helps you think of more ideas, not a replacement for your creativity. Remember: the best ideas come from combining AI suggestions with your own unique thoughts. Always use AI responsibly by thinking critically about the ideas it generates.", es: "En este modulo, aprenderas como la IA puede potenciar tus sesiones de lluvia de ideas. La IA es una herramienta que te ayuda a pensar en mas ideas, no un reemplazo de tu creatividad. Recuerda: las mejores ideas vienen de combinar las sugerencias de la IA con tus propios pensamientos unicos. Siempre usa la IA responsablemente pensando criticamente sobre las ideas que genera." },
  "ai-research": { en: "Research is about finding truth and understanding the world. AI can help you search faster and organize information, but you must always verify what AI tells you. Good researchers check multiple sources and think critically. In this module, you'll learn how to use AI as a research assistant while maintaining academic integrity.", es: "La investigacion se trata de encontrar la verdad y entender el mundo. La IA puede ayudarte a buscar mas rapido y organizar informacion, pero siempre debes verificar lo que la IA te dice. Los buenos investigadores verifican multiples fuentes y piensan criticamente. En este modulo, aprenderas como usar la IA como asistente de investigacion manteniendo la integridad academica." },
  "ai-documents": { en: "Writing is one of the most powerful skills you can develop. AI can help you get started, organize your thoughts, and improve your writing — but your voice and ideas should always lead the way. In this module, you'll learn to use AI as a writing partner, not a replacement for your own expression.", es: "La escritura es una de las habilidades mas poderosas que puedes desarrollar. La IA puede ayudarte a comenzar, organizar tus pensamientos y mejorar tu escritura, pero tu voz e ideas siempre deben liderar el camino. En este modulo, aprenderas a usar la IA como compañero de escritura, no como un reemplazo de tu propia expresion." },
  "ai-presentations": { en: "Great presentations combine clear structure with compelling visuals. AI can help you organize your ideas into slides, suggest key points, and create outlines — but your personality and delivery make the presentation memorable. Learn to use AI to prepare, then make it your own.", es: "Las grandes presentaciones combinan una estructura clara con visuales atractivos. La IA puede ayudarte a organizar tus ideas en diapositivas, sugerir puntos clave y crear esquemas, pero tu personalidad y presentacion hacen que sea memorable. Aprende a usar la IA para prepararte, luego hazla tuya." },
  "ai-video": { en: "Video storytelling is a creative art that combines writing, visuals, and sound. AI can help you write scripts, plan storyboards, and outline your video projects. Remember that the best videos come from authentic stories and creative vision. AI is your planning partner in this creative journey.", es: "La narracion en video es un arte creativo que combina escritura, visuales y sonido. La IA puede ayudarte a escribir guiones, planificar storyboards y esquematizar tus proyectos de video. Recuerda que los mejores videos vienen de historias autenticas y vision creativa. La IA es tu compañero de planificacion en este viaje creativo." },
  "ai-project-planning": { en: "Every big achievement starts with a good plan. AI can help you break down complex projects into manageable steps, create timelines, and identify potential challenges. In this module, you'll learn project management skills that professionals use every day, powered by AI assistance.", es: "Cada gran logro comienza con un buen plan. La IA puede ayudarte a dividir proyectos complejos en pasos manejables, crear cronogramas e identificar desafios potenciales. En este modulo, aprenderas habilidades de gestion de proyectos que los profesionales usan todos los dias, potenciadas por asistencia de IA." },
  "ai-life-planning": { en: "Your future is full of possibilities! AI can help you explore career paths, set meaningful goals, and create action plans for your dreams. This module teaches you how to use AI for personal development while remembering that you are always in charge of your own journey.", es: "Tu futuro esta lleno de posibilidades! La IA puede ayudarte a explorar caminos profesionales, establecer metas significativas y crear planes de accion para tus sueños. Este modulo te enseña como usar la IA para el desarrollo personal recordando que siempre estas a cargo de tu propio camino." },
  "ai-business": { en: "Entrepreneurship is about solving problems and creating value. AI can help you analyze markets, develop business strategies, and plan ventures — but the passion and drive must come from you. Learn how to use AI as your business planning assistant in this exciting module.", es: "El emprendimiento se trata de resolver problemas y crear valor. La IA puede ayudarte a analizar mercados, desarrollar estrategias de negocios y planificar empresas, pero la pasion y el impulso deben venir de ti. Aprende como usar la IA como tu asistente de planificacion empresarial en este emocionante modulo." },
  "ai-sales": { en: "Persuasion is a life skill that goes beyond sales — it helps in school, friendships, and future careers. AI can help you craft compelling messages and understand your audience. This module teaches ethical persuasion: being honest, helpful, and respectful while communicating your ideas effectively.", es: "La persuasion es una habilidad de vida que va mas alla de las ventas: ayuda en la escuela, amistades y futuras carreras. La IA puede ayudarte a crear mensajes convincentes y entender a tu audiencia. Este modulo enseña persuasion etica: ser honesto, util y respetuoso mientras comunicas tus ideas efectivamente." },
  "ai-resume": { en: "Your professional brand is how you present yourself to the world. AI can help you organize your skills, achievements, and experiences into a polished resume or portfolio. This module teaches you to showcase your authentic self while using AI to present your best qualities clearly.", es: "Tu marca profesional es como te presentas al mundo. La IA puede ayudarte a organizar tus habilidades, logros y experiencias en un curriculum o portafolio pulido. Este modulo te enseña a mostrar tu yo autentico mientras usas la IA para presentar tus mejores cualidades claramente." },
};

type Tool = {
  id: string;
  toolKey: string;
  name: string;
  description: string;
  category: string;
  iconName: string;
  isUnlocked: boolean;
  moduleInfo?: { key: string; title: string };
};

type Module = {
  key: string;
  title: string;
  description: string;
  unlocksTool: string;
  lessonCount: number;
  completed: boolean;
};

export default function AIToolsHubPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("tools");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [lessonDialog, setLessonDialog] = useState<{ open: boolean; module: Module | null }>({ open: false, module: null });
  const [lessonStep, setLessonStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([null, null]);

  // The client may REQUEST adult mode via ?mode=adult, but whether it is
  // actually granted is decided by the SERVER (based on user role). We never
  // override unlock state client-side.
  const requestedAdult = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "adult";
  }, []);

  const toolsQueryKey = requestedAdult ? "/api/ai-tools?mode=adult" : "/api/ai-tools";

  const { data: rawToolsData, isLoading: toolsLoading, error: toolsError, refetch: refetchTools } = useQuery<{ tools: Tool[]; adultMode: boolean }>({
    queryKey: [toolsQueryKey],
  });
  const tools = rawToolsData?.tools ?? [];
  // Server-authoritative: only true if the server actually granted adult mode.
  const isAdult = rawToolsData?.adultMode ?? false;

  const { data: rawModules, isLoading: modulesLoading, error: modulesError, refetch: refetchModules } = useQuery<Module[]>({
    queryKey: ["/api/ai-tools/modules"],
  });
  const modules = rawModules ?? [];

  const completeMutation = useMutation({
    mutationFn: async (moduleKey: string) => {
      const res = await apiRequest("POST", `/api/ai-tools/modules/${moduleKey}/complete`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-tools/modules"] });
      toast({
        title: language === "es" ? "Modulo completado!" : "Module completed!",
        description: language === "es" ? `Herramienta desbloqueada: ${data.toolName}` : `Tool unlocked: ${data.toolName}`,
      });
    },
  });

  const filteredTools = categoryFilter === "All"
    ? tools
    : tools.filter(t => t.category.toLowerCase() === categoryFilter.toLowerCase());

  const getIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Lightbulb;
    return IconComponent;
  };

  const openLesson = (mod: Module) => {
    setLessonDialog({ open: true, module: mod });
    setLessonStep(0);
    setQuizAnswers([null, null]);
  };

  const handleQuizAnswer = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = optionIndex;
    setQuizAnswers(newAnswers);
  };

  const handleCompleteModule = () => {
    if (!lessonDialog.module) return;
    completeMutation.mutate(lessonDialog.module.key);
    setLessonDialog({ open: false, module: null });
  };

  const isQuizCorrect = () => {
    if (!lessonDialog.module) return false;
    const quiz = MODULE_QUIZZES[lessonDialog.module.key];
    if (!quiz) return false;
    return quiz.every((q, i) => quizAnswers[i] === q.answer);
  };


  useEffect(() => { document.title = "AI Literacy Curriculum & Creation Studio | ThriveUp Academy"; }, []);

  if (toolsError) {
    return <div className="p-6"><ErrorRetry message="Failed to load AI tools." onRetry={refetchTools} /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="AI Literacy Curriculum & Creation Studio"
        description="A workforce-aligned AI literacy curriculum. Each tool is paired with a learning objective, a guided lesson, and a portfolio artifact — building the AI fluency reviewers expect of a 21st-century workforce program."
        breadcrumbs={[{ label: "AI Literacy Curriculum" }]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tools" data-testid="tab-tools">
            <Sparkles className="h-4 w-4 mr-1" />
            {language === "es" ? "Herramientas IA" : "AI Tools"}
          </TabsTrigger>
          <TabsTrigger value="course" data-testid="tab-course">
            <BookOpen className="h-4 w-4 mr-1" />
            {language === "es" ? "Curso de IA" : "AI Course"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORY_FILTERS.map(cat => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
                data-testid={`filter-${cat.toLowerCase()}`}
              >
                {language === "es"
                  ? cat === "All" ? "Todos" : cat === "Create" ? "Crear" : cat === "Plan" ? "Planificar" : cat === "Research" ? "Investigar" : "Escribir"
                  : cat}
              </Button>
            ))}
          </div>

          {toolsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-10 w-10 rounded bg-muted mb-3" />
                  <div className="h-4 w-3/4 rounded bg-muted mb-2" />
                  <div className="h-3 w-full rounded bg-muted" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTools.map(tool => {
                const Icon = getIcon(tool.iconName);
                return (
                  <Card
                    key={tool.id}
                    className={`p-4 relative ${!tool.isUnlocked ? "opacity-75" : ""}`}
                    data-testid={`card-tool-${tool.toolKey}`}
                  >
                    {!tool.isUnlocked && (
                      <div className="absolute top-3 right-3">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className={`h-10 w-10 rounded-md flex items-center justify-center mb-3 ${tool.isUnlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{tool.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{tool.description}</p>
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary" className="w-fit text-xs">{tool.category}</Badge>
                      {tool.isUnlocked ? (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/ai-tools/${tool.toolKey}${isAdult ? "?mode=adult" : ""}`)}
                          data-testid={`button-open-tool-${tool.toolKey}`}
                        >
                          <ChevronRight className="h-4 w-4 mr-1" />
                          {language === "es" ? "Abrir Herramienta" : "Open Tool"}
                        </Button>
                      ) : (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {language === "es" ? "Requiere: " : "Requires: "}
                            {tool.moduleInfo?.title || ""}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveTab("course")}
                            data-testid={`button-take-module-${tool.moduleInfo?.key || ""}`}
                          >
                            <BookOpen className="h-4 w-4 mr-1" />
                            {language === "es" ? "Tomar Modulo" : "Take Module"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="course">
          {modulesError ? (
            <ErrorRetry
              message={language === "es" ? "No se pudieron cargar los modulos del curso." : "Failed to load course modules."}
              onRetry={refetchModules}
            />
          ) : modulesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-5 w-1/2 rounded bg-muted mb-2" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((mod, index) => (
                <Card key={mod.key} className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 text-sm font-bold ${mod.completed ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
                        {mod.completed ? <CheckCircle className="h-5 w-5" /> : index + 1}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm">{mod.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {language === "es" ? "Desbloquea: " : "Unlocks: "}{mod.unlocksTool}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {mod.completed ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {language === "es" ? "Completado" : "Completed"}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => openLesson(mod)}
                          data-testid={`button-take-module-${mod.key}`}
                        >
                          {language === "es" ? "Iniciar Modulo" : "Start Module"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={lessonDialog.open}
        onOpenChange={(open) => { if (!open) setLessonDialog({ open: false, module: null }); }}
      >
        <DialogContent className="max-w-lg" data-testid="dialog-module-lesson">
          {lessonDialog.module && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {lessonStep === 0
                    ? lessonDialog.module.title
                    : lessonStep === 1
                    ? (language === "es" ? "Mini-Cuestionario" : "Mini-Quiz")
                    : (language === "es" ? "Modulo Completado!" : "Module Complete!")}
                </DialogTitle>
                <DialogDescription>
                  {lessonStep === 0
                    ? (language === "es" ? "Paso 1 de 3: Introduccion" : "Step 1 of 3: Introduction")
                    : lessonStep === 1
                    ? (language === "es" ? "Paso 2 de 3: Pon a prueba tu conocimiento" : "Step 2 of 3: Test your knowledge")
                    : (language === "es" ? "Paso 3 de 3: Confirmacion" : "Step 3 of 3: Confirmation")}
                </DialogDescription>
              </DialogHeader>

              {lessonStep === 0 && (
                <div className="py-4">
                  <p className="text-sm leading-relaxed">
                    {language === "es"
                      ? MODULE_INTROS[lessonDialog.module.key]?.es
                      : MODULE_INTROS[lessonDialog.module.key]?.en}
                  </p>
                </div>
              )}

              {lessonStep === 1 && MODULE_QUIZZES[lessonDialog.module.key] && (
                <div className="py-4 space-y-6">
                  {MODULE_QUIZZES[lessonDialog.module.key].map((quiz, qi) => (
                    <div key={qi}>
                      <p className="text-sm font-medium mb-2">
                        {language === "es" ? quiz.qEs : quiz.q}
                      </p>
                      <div className="space-y-2">
                        {(language === "es" ? quiz.optionsEs : quiz.options).map((opt, oi) => (
                          <Button
                            key={oi}
                            variant={quizAnswers[qi] === oi
                              ? (oi === quiz.answer ? "default" : "destructive")
                              : "outline"}
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() => handleQuizAnswer(qi, oi)}
                            data-testid={`quiz-option-${qi}-${oi}`}
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {lessonStep === 2 && (
                <div className="py-4 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm">
                    {language === "es"
                      ? `Has completado ${lessonDialog.module.title}. La herramienta "${lessonDialog.module.unlocksTool}" esta ahora desbloqueada!`
                      : `You've completed ${lessonDialog.module.title}. The "${lessonDialog.module.unlocksTool}" tool is now unlocked!`}
                  </p>
                </div>
              )}

              <DialogFooter>
                {lessonStep === 0 && (
                  <Button onClick={() => setLessonStep(1)} data-testid="button-continue-to-quiz">
                    {language === "es" ? "Continuar al Cuestionario" : "Continue to Quiz"}
                  </Button>
                )}
                {lessonStep === 1 && (
                  <Button
                    onClick={() => setLessonStep(2)}
                    disabled={!isQuizCorrect()}
                    data-testid="button-continue-from-quiz"
                  >
                    {language === "es" ? "Continuar" : "Continue"}
                  </Button>
                )}
                {lessonStep === 2 && (
                  <Button
                    onClick={handleCompleteModule}
                    disabled={completeMutation.isPending}
                    data-testid="button-complete-module"
                  >
                    {completeMutation.isPending
                      ? (language === "es" ? "Completando..." : "Completing...")
                      : (language === "es" ? "Desbloquear Herramienta" : "Unlock Tool")}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
