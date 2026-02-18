import { useEffect, useRef } from "react";
import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
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
import ParentDashboardPage from "@/pages/parent-dashboard";
import ClassroomsPage, { ClassroomDetailPage } from "@/pages/classrooms";
import ClassroomWizardPage from "@/pages/classroom-wizard";
import TeacherDashboardPage from "@/pages/teacher-dashboard";
import CertificatesPage, { CertificateViewPage } from "@/pages/certificates";
import SocialMediaLiteracyPage from "@/pages/social-media-literacy";
import AcademyHubPage from "@/pages/academy-hub";
import AcademyVillagePage from "@/pages/academy-village";
import AcademyAvatarPage from "@/pages/academy-avatar";
import AcademyStocksPage from "@/pages/academy-stocks";
import AcademyCampusPage from "@/pages/academy-campus";
import AcademyCompetitionsPage from "@/pages/academy-competitions";
import AcademyHousesPage from "@/pages/academy-houses";
import AcademyDreamsPage from "@/pages/academy-dreams";
import AcademyWalletPage from "@/pages/academy-wallet";
import AcademyMerchPage from "@/pages/academy-merch";
import AcademyPowerPage from "@/pages/academy-power";
import AcademyQuestsPage from "@/pages/academy-quests";
import AcademyLessonsPage from "@/pages/academy-lessons";
import AcademyScenariosPage from "@/pages/academy-scenarios";
import AcademyMarketplacePage from "@/pages/academy-marketplace";
import AcademyAdminPage from "@/pages/academy-admin";
import AcademyLongitudinalPage from "@/pages/academy-longitudinal";
import AcademyTutorialPage from "@/pages/academy-tutorial";
import AcademyCareersPage from "@/pages/academy-careers";
import AcademyPathwayPage from "@/pages/academy-pathway";
import AcademyMentorsPage from "@/pages/academy-mentors";
import AcademyFinancialLiteracyPage from "@/pages/academy-financial-literacy";
import AcademyStudentWizardPage from "@/pages/academy-student-wizard";
import AcademySelfAssessmentPage from "@/pages/academy-self-assessment";
import AcademyThrivePage from "@/pages/academy-thrive";
import AcademyAdminTutorialPage from "@/pages/academy-admin-tutorial";
import AcademyMentorFinderPage from "@/pages/academy-mentor-finder";
import AcademyGameLobbyPage from "@/pages/academy-game-lobby";
import AcademyDominoesGame from "@/pages/academy-dominoes-game";
import AcademyJournalPage from "@/pages/academy-journal";
import AcademyAnnouncementsPage from "@/pages/academy-announcements";
import AcademyCalendarPage from "@/pages/academy-calendar";
import AcademyHelpPage from "@/pages/academy-help";
import AcademyProgressReportPage from "@/pages/academy-progress-report";
import AcademyAttendancePage from "@/pages/academy-attendance";
import AcademyIntegrationPage from "@/pages/academy-integration";
import AcademyRiskMonitorPage from "@/pages/academy-risk-monitor";
import CourseCreatorPage from "@/pages/course-creator";
import SparkyCompanionPage from "@/pages/sparky-companion";
import AIToolsHubPage from "@/pages/ai-tools-hub";
import AIToolsWorkspacePage from "@/pages/ai-tools-workspace";
import ImplementationRecommendationsPage from "@/pages/implementation-recommendations";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import { LanguageProvider } from "@/lib/i18n";
import { BandwidthProvider } from "@/lib/bandwidth-mode";
import { AccessibilityProvider } from "@/lib/accessibility";
import { HeaderControls } from "@/components/header-controls";
import { AccessibilityPanel } from "@/components/accessibility-panel";

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
      <Route path="/sparky" component={SparkyCompanionPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/parents" component={ParentResourcesPage} />
      <Route path="/parents/dashboard" component={ParentDashboardPage} />
      <Route path="/module-1-2-tools" component={Module12ToolsPage} />
      <Route path="/curriculum-documents" component={CurriculumDocumentsPage} />
      <Route path="/curriculum-documents/new" component={CurriculumDocumentCreatePage} />
      <Route path="/curriculum-documents/:id" component={CurriculumDocumentViewPage} />
      <Route path="/classrooms" component={ClassroomsPage} />
      <Route path="/classrooms/wizard" component={ClassroomWizardPage} />
      <Route path="/classrooms/:classroomId" component={ClassroomDetailPage} />
      <Route path="/teacher-dashboard" component={TeacherDashboardPage} />
      <Route path="/certificates" component={CertificatesPage} />
      <Route path="/certificates/:id" component={CertificateViewPage} />
      <Route path="/social-media-literacy" component={SocialMediaLiteracyPage} />
      <Route path="/academy" component={AcademyVillagePage} />
      <Route path="/academy/hub" component={AcademyHubPage} />
      <Route path="/academy/avatar" component={AcademyAvatarPage} />
      <Route path="/academy/stocks" component={AcademyStocksPage} />
      <Route path="/academy/wallet" component={AcademyWalletPage} />
      <Route path="/academy/campus" component={AcademyCampusPage} />
      <Route path="/academy/competitions" component={AcademyCompetitionsPage} />
      <Route path="/academy/houses" component={AcademyHousesPage} />
      <Route path="/academy/dreams" component={AcademyDreamsPage} />
      <Route path="/academy/merch" component={AcademyMerchPage} />
      <Route path="/academy/power" component={AcademyPowerPage} />
      <Route path="/academy/quests" component={AcademyQuestsPage} />
      <Route path="/academy/lessons" component={AcademyLessonsPage} />
      <Route path="/academy/scenarios" component={AcademyScenariosPage} />
      <Route path="/academy/marketplace" component={AcademyMarketplacePage} />
      <Route path="/academy/admin" component={AcademyAdminPage} />
      <Route path="/academy/longitudinal" component={AcademyLongitudinalPage} />
      <Route path="/academy/tutorial" component={AcademyTutorialPage} />
      <Route path="/academy/careers" component={AcademyCareersPage} />
      <Route path="/academy/pathway" component={AcademyPathwayPage} />
      <Route path="/academy/mentors" component={AcademyMentorsPage} />
      <Route path="/academy/student-wizard" component={AcademyStudentWizardPage} />
      <Route path="/academy/self-assessment" component={AcademySelfAssessmentPage} />
      <Route path="/academy/thrive" component={AcademyThrivePage} />
      <Route path="/academy/admin-tutorial" component={AcademyAdminTutorialPage} />
      <Route path="/academy/mentor-finder" component={AcademyMentorFinderPage} />
      <Route path="/academy/games" component={AcademyGameLobbyPage} />
      <Route path="/academy/games/dominoes/:id" component={AcademyDominoesGame} />
      <Route path="/academy/financial-literacy" component={AcademyFinancialLiteracyPage} />
      <Route path="/academy/journal" component={AcademyJournalPage} />
      <Route path="/academy/announcements" component={AcademyAnnouncementsPage} />
      <Route path="/academy/calendar" component={AcademyCalendarPage} />
      <Route path="/academy/help" component={AcademyHelpPage} />
      <Route path="/academy/progress-report" component={AcademyProgressReportPage} />
      <Route path="/academy/attendance" component={AcademyAttendancePage} />
      <Route path="/academy/integration" component={AcademyIntegrationPage} />
      <Route path="/academy/risk-monitor" component={AcademyRiskMonitorPage} />
      <Route path="/academy/course-creator" component={CourseCreatorPage} />
      <Route path="/ai-tools" component={AIToolsHubPage} />
      <Route path="/ai-tools/:toolKey" component={AIToolsWorkspacePage} />
      <Route path="/implementation" component={ImplementationRecommendationsPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function useAttendanceLog() {
  const logged = useRef(false);
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    apiRequest("POST", "/api/attendance/log", {}).catch(() => {});
  }, []);
}

function AppLayout() {
  useAttendanceLog();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <a href="#main-content" className="skip-link bg-primary text-primary-foreground" data-testid="link-skip-nav">Skip to main content</a>
          <header className="flex items-center justify-between gap-2 p-2 border-b sticky top-0 z-50 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-1">
              <AccessibilityPanel />
              <HeaderControls />
            </div>
          </header>
          <main id="main-content" className="flex-1 overflow-auto">
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
        <AccessibilityProvider>
          <BandwidthProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <AppLayout />
                <Toaster />
              </TooltipProvider>
            </QueryClientProvider>
          </BandwidthProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
