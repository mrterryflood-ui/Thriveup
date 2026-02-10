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
            <ThemeToggle />
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
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppLayout />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
