import { useEffect, useRef, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import CurriculumPage, { LevelDetailPage } from "@/pages/curriculum";
import SubjectsPage, { SubjectDetailPage } from "@/pages/subjects";
import DashboardPage from "@/pages/dashboard";
import AICompanionPage from "@/pages/ai-companion";

const ModuleDetailPage = lazy(() => import("@/pages/module-detail"));
const LessonViewerPage = lazy(() => import("@/pages/lesson-viewer"));
const QuizPage = lazy(() => import("@/pages/quiz"));
const AchievementsPage = lazy(() => import("@/pages/achievements"));
const CommunityPage = lazy(() => import("@/pages/community"));
const ParentResourcesPage = lazy(() => import("@/pages/parents"));
const CurriculumDocumentsPage = lazy(() => import("@/pages/curriculum-documents").then(m => ({ default: m.default })));
const CurriculumDocumentViewPage = lazy(() => import("@/pages/curriculum-documents").then(m => ({ default: m.CurriculumDocumentViewPage })));
const CurriculumDocumentCreatePage = lazy(() => import("@/pages/curriculum-documents").then(m => ({ default: m.CurriculumDocumentCreatePage })));
const Module12ToolsPage = lazy(() => import("@/pages/module-1-2-tools"));
const ParentDashboardPage = lazy(() => import("@/pages/parent-dashboard"));
const ClassroomsPage = lazy(() => import("@/pages/classrooms").then(m => ({ default: m.default })));
const ClassroomDetailPage = lazy(() => import("@/pages/classrooms").then(m => ({ default: m.ClassroomDetailPage })));
const ClassroomWizardPage = lazy(() => import("@/pages/classroom-wizard"));
const TeacherDashboardPage = lazy(() => import("@/pages/teacher-dashboard"));
const CertificatesPage = lazy(() => import("@/pages/certificates").then(m => ({ default: m.default })));
const CertificateViewPage = lazy(() => import("@/pages/certificates").then(m => ({ default: m.CertificateViewPage })));
const SocialMediaLiteracyPage = lazy(() => import("@/pages/social-media-literacy"));
const AcademyHubPage = lazy(() => import("@/pages/academy-hub"));
const AcademyVillagePage = lazy(() => import("@/pages/academy-village"));
const AcademyAvatarPage = lazy(() => import("@/pages/academy-avatar"));
const AcademyStocksPage = lazy(() => import("@/pages/academy-stocks"));
const AcademyCampusPage = lazy(() => import("@/pages/academy-campus"));
const AcademyCompetitionsPage = lazy(() => import("@/pages/academy-competitions"));
const AcademyHousesPage = lazy(() => import("@/pages/academy-houses"));
const AcademyDreamsPage = lazy(() => import("@/pages/academy-dreams"));
const AcademyWalletPage = lazy(() => import("@/pages/academy-wallet"));
const AcademyMerchPage = lazy(() => import("@/pages/academy-merch"));
const AcademyPowerPage = lazy(() => import("@/pages/academy-power"));
const AcademyQuestsPage = lazy(() => import("@/pages/academy-quests"));
const AcademyLessonsPage = lazy(() => import("@/pages/academy-lessons"));
const AcademyScenariosPage = lazy(() => import("@/pages/academy-scenarios"));
const AcademyMarketplacePage = lazy(() => import("@/pages/academy-marketplace"));
const AcademyAdminPage = lazy(() => import("@/pages/academy-admin"));
const AcademyLongitudinalPage = lazy(() => import("@/pages/academy-longitudinal"));
const AcademyTutorialPage = lazy(() => import("@/pages/academy-tutorial"));
const AcademyCareersPage = lazy(() => import("@/pages/academy-careers"));
const AcademyPathwayPage = lazy(() => import("@/pages/academy-pathway"));
const AcademyMentorsPage = lazy(() => import("@/pages/academy-mentors"));
const AcademyFinancialLiteracyPage = lazy(() => import("@/pages/academy-financial-literacy"));
const AcademyStudentWizardPage = lazy(() => import("@/pages/academy-student-wizard"));
const AcademySelfAssessmentPage = lazy(() => import("@/pages/academy-self-assessment"));
const AcademyThrivePage = lazy(() => import("@/pages/academy-thrive"));
const AcademyAdminTutorialPage = lazy(() => import("@/pages/academy-admin-tutorial"));
const AcademyMentorFinderPage = lazy(() => import("@/pages/academy-mentor-finder"));
const AcademyGameLobbyPage = lazy(() => import("@/pages/academy-game-lobby"));
const AcademyDominoesGame = lazy(() => import("@/pages/academy-dominoes-game"));
const AcademyJournalPage = lazy(() => import("@/pages/academy-journal"));
const AcademyAnnouncementsPage = lazy(() => import("@/pages/academy-announcements"));
const AcademyCalendarPage = lazy(() => import("@/pages/academy-calendar"));
const AcademyHelpPage = lazy(() => import("@/pages/academy-help"));
const AcademyProgressReportPage = lazy(() => import("@/pages/academy-progress-report"));
const AcademyAttendancePage = lazy(() => import("@/pages/academy-attendance"));
const AcademyIntegrationPage = lazy(() => import("@/pages/academy-integration"));
const AcademyRiskMonitorPage = lazy(() => import("@/pages/academy-risk-monitor"));
const PhasedRolloutPage = lazy(() => import("@/pages/phased-rollout"));
const CourseCreatorPage = lazy(() => import("@/pages/course-creator"));
const AdminVideoScriptPage = lazy(() => import("@/pages/admin-video-script"));
const AcademyStaarPrepPage = lazy(() => import("@/pages/academy-staar-prep"));
const SparkyCompanionPage = lazy(() => import("@/pages/sparky-companion"));
const AIToolsHubPage = lazy(() => import("@/pages/ai-tools-hub"));
const AIToolsWorkspacePage = lazy(() => import("@/pages/ai-tools-workspace"));
const ImplementationRecommendationsPage = lazy(() => import("@/pages/implementation-recommendations"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy-policy"));
const ResourceFinderPage = lazy(() => import("@/pages/resource-finder"));
const ImpactPage = lazy(() => import("@/pages/impact"));
const APIDocsPage = lazy(() => import("@/pages/api-docs"));
const StakeholderPresentationPage = lazy(() => import("@/pages/stakeholder-presentation"));
const GrantHubPage = lazy(() => import("@/pages/grant-hub"));
const ReentryDashboardPage = lazy(() => import("@/pages/reentry-dashboard"));
const CommunityPartnersPage = lazy(() => import("@/pages/community-partners"));
const OutcomeReportingPage = lazy(() => import("@/pages/outcome-reporting"));
const JusticePartnersPage = lazy(() => import("@/pages/justice-partners"));
const WorkforceAssessmentPage = lazy(() => import("@/pages/workforce-assessment"));
const WorkforceTrainingPage = lazy(() => import("@/pages/workforce-training"));
const WorkforceEmployersPage = lazy(() => import("@/pages/workforce-employers"));
const WorkforceDashboardPage = lazy(() => import("@/pages/workforce-dashboard"));
const CommunityMapPage = lazy(() => import("@/pages/community-map"));
const IntakeWizardPage = lazy(() => import("@/pages/intake-wizard"));
const ServiceDeliveryPage = lazy(() => import("@/pages/service-delivery"));
const HealthWellnessPage = lazy(() => import("@/pages/health-wellness"));
const PilotDashboardPage = lazy(() => import("@/pages/pilot-dashboard"));
const DosageReportPage = lazy(() => import("@/pages/dosage-report"));
const PreventionPage = lazy(() => import("@/pages/prevention"));
const CoalitionPage = lazy(() => import("@/pages/coalition"));
const ParentEducationPage = lazy(() => import("@/pages/parent-education"));

function PageFallback() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-6 w-96" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64 mt-4" />
    </div>
  );
}

import { LanguageProvider } from "@/lib/i18n";
import { BandwidthProvider } from "@/lib/bandwidth-mode";
import { AccessibilityProvider } from "@/lib/accessibility";
import { HeaderControls } from "@/components/header-controls";
import { AccessibilityPanel } from "@/components/accessibility-panel";
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandPalette } from "@/components/command-palette";
import { AINavigator } from "@/components/ai-navigator";

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
      <Route path="/academy/phased-rollout" component={PhasedRolloutPage} />
      <Route path="/academy/course-creator" component={CourseCreatorPage} />
      <Route path="/academy/admin-video-script" component={AdminVideoScriptPage} />
      <Route path="/academy/staar-prep" component={AcademyStaarPrepPage} />
      <Route path="/ai-tools" component={AIToolsHubPage} />
      <Route path="/ai-tools/:toolKey" component={AIToolsWorkspacePage} />
      <Route path="/implementation" component={ImplementationRecommendationsPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/resources" component={ResourceFinderPage} />
      <Route path="/impact" component={ImpactPage} />
      <Route path="/api-docs" component={APIDocsPage} />
      <Route path="/grants" component={GrantHubPage} />
      <Route path="/reentry" component={ReentryDashboardPage} />
      <Route path="/partners" component={CommunityPartnersPage} />
      <Route path="/outcomes" component={OutcomeReportingPage} />
      <Route path="/justice-partners" component={JusticePartnersPage} />
      <Route path="/workforce-assessment" component={WorkforceAssessmentPage} />
      <Route path="/workforce-training" component={WorkforceTrainingPage} />
      <Route path="/workforce-employers" component={WorkforceEmployersPage} />
      <Route path="/workforce-dashboard" component={WorkforceDashboardPage} />
      <Route path="/community-map" component={CommunityMapPage} />
      <Route path="/intake" component={IntakeWizardPage} />
      <Route path="/services" component={ServiceDeliveryPage} />
      <Route path="/health-wellness" component={HealthWellnessPage} />
      <Route path="/pilot" component={PilotDashboardPage} />
      <Route path="/dosage" component={DosageReportPage} />
      <Route path="/prevention" component={PreventionPage} />
      <Route path="/coalition" component={CoalitionPage} />
      <Route path="/parent-education" component={ParentEducationPage} />
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
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                <AppRouter />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      <CommandPalette />
      <AINavigator />
    </SidebarProvider>
  );
}

function PresentationLayout() {
  return (
    <Suspense fallback={<PageFallback />}>
      <StakeholderPresentationPage />
    </Suspense>
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
                <Switch>
                  <Route path="/presentation">
                    <PresentationLayout />
                  </Route>
                  <Route>
                    <AppLayout />
                  </Route>
                </Switch>
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
