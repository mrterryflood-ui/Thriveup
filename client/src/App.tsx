import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import CurriculumPage, { LevelDetailPage } from "@/pages/curriculum";
import SubjectsPage, { SubjectDetailPage } from "@/pages/subjects";
import ModuleDetailPage from "@/pages/module-detail";
import LessonViewerPage from "@/pages/lesson-viewer";
import QuizPage from "@/pages/quiz";
import DashboardPage from "@/pages/dashboard";
import AchievementsPage from "@/pages/achievements";
import AICompanionPage from "@/pages/ai-companion";
import CommunityPage from "@/pages/community";
import ParentResourcesPage from "@/pages/parents";
import CurriculumDocumentsPage, { CurriculumDocumentViewPage, CurriculumDocumentCreatePage } from "@/pages/curriculum-documents";
import Module12ToolsPage from "@/pages/module-1-2-tools";
import { LanguageProvider } from "@/lib/i18n";
import { BandwidthProvider } from "@/lib/bandwidth-mode";
import { HeaderControls } from "@/components/header-controls";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/subjects" component={SubjectsPage} />
      <Route path="/subject/:subjectId" component={SubjectDetailPage} />
      <Route path="/curriculum" component={CurriculumPage} />
      <Route path="/curriculum/:levelId" component={LevelDetailPage} />
      <Route path="/module/:moduleId" component={ModuleDetailPage} />
      <Route path="/lesson/:lessonId" component={LessonViewerPage} />
      <Route path="/quiz/:moduleId" component={QuizPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/achievements" component={AchievementsPage} />
      <Route path="/ai-companion" component={AICompanionPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/parents" component={ParentResourcesPage} />
      <Route path="/module-1-2-tools" component={Module12ToolsPage} />
      <Route path="/curriculum-documents" component={CurriculumDocumentsPage} />
      <Route path="/curriculum-documents/new" component={CurriculumDocumentCreatePage} />
      <Route path="/curriculum-documents/:id" component={CurriculumDocumentViewPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 p-2 border-b sticky top-0 z-50 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <HeaderControls />
          </header>
          <main className="flex-1 overflow-auto">
            <AppRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BandwidthProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <AppLayout />
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </BandwidthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
