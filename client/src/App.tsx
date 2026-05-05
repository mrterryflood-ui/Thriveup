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
import { ContextualHelpButton } from "@/components/contextual-help";
import LandingPage from "@/pages/landing";
import CoveragePage from "@/pages/coverage";
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
const AcademyHubPage = lazy(() => import("@/pages/academy/hub"));
const AcademyVillagePage = lazy(() => import("@/pages/academy/village"));
const AcademyAvatarPage = lazy(() => import("@/pages/academy/avatar"));
const AcademyStocksPage = lazy(() => import("@/pages/academy/stocks"));
const AcademyCampusPage = lazy(() => import("@/pages/academy/campus"));
const AcademyCompetitionsPage = lazy(() => import("@/pages/academy/competitions"));
const AcademyHousesPage = lazy(() => import("@/pages/academy/houses"));
const AcademyDreamsPage = lazy(() => import("@/pages/academy/dreams"));
const AcademyWalletPage = lazy(() => import("@/pages/academy/wallet"));
const AcademyMerchPage = lazy(() => import("@/pages/academy/merch"));
const AcademyPowerPage = lazy(() => import("@/pages/academy/power"));
const AcademyQuestsPage = lazy(() => import("@/pages/academy/quests"));
const AcademyLessonsPage = lazy(() => import("@/pages/academy/lessons"));
const AcademyScenariosPage = lazy(() => import("@/pages/academy/scenarios"));
const AcademyMarketplacePage = lazy(() => import("@/pages/academy/marketplace"));
const AcademyAdminPage = lazy(() => import("@/pages/academy/admin"));
const AcademyLongitudinalPage = lazy(() => import("@/pages/academy/longitudinal"));
const AcademyTutorialPage = lazy(() => import("@/pages/academy/tutorial"));
const AcademyCareersPage = lazy(() => import("@/pages/academy/careers"));
const AcademyPathwayPage = lazy(() => import("@/pages/academy/pathway"));
const AcademyMentorsPage = lazy(() => import("@/pages/academy/mentors"));
const AcademyFinancialLiteracyPage = lazy(() => import("@/pages/academy/financial-literacy"));
const AcademyStudentWizardPage = lazy(() => import("@/pages/academy/student-wizard"));
const AcademySelfAssessmentPage = lazy(() => import("@/pages/academy/self-assessment"));
const AcademyThrivePage = lazy(() => import("@/pages/academy/thrive"));
const AcademyAdminTutorialPage = lazy(() => import("@/pages/academy/admin-tutorial"));
const AcademyMentorFinderPage = lazy(() => import("@/pages/academy/mentor-finder"));
const AcademyGameLobbyPage = lazy(() => import("@/pages/academy/game-lobby"));
const AcademyDominoesGame = lazy(() => import("@/pages/academy/dominoes-game"));
const AcademyJournalPage = lazy(() => import("@/pages/academy/journal"));
const AcademyAnnouncementsPage = lazy(() => import("@/pages/academy/announcements"));
const AcademyCalendarPage = lazy(() => import("@/pages/academy/calendar"));
const AcademyHelpPage = lazy(() => import("@/pages/academy/help"));
const AcademyProgressReportPage = lazy(() => import("@/pages/academy/progress-report"));
const AcademyAttendancePage = lazy(() => import("@/pages/academy/attendance"));
const AcademyIntegrationPage = lazy(() => import("@/pages/academy/integration"));
const AcademyRiskMonitorPage = lazy(() => import("@/pages/academy/risk-monitor"));
const PhasedRolloutPage = lazy(() => import("@/pages/phased-rollout"));
const CourseCreatorPage = lazy(() => import("@/pages/course-creator"));
const AdminVideoScriptPage = lazy(() => import("@/pages/admin-video-script"));
const AcademyStaarPrepPage = lazy(() => import("@/pages/academy/staar-prep"));
const SparkyCompanionPage = lazy(() => import("@/pages/sparky-companion"));
const AIToolsHubPage = lazy(() => import("@/pages/ai-tools-hub"));
const AIToolsWorkspacePage = lazy(() => import("@/pages/ai-tools-workspace"));
const ImplementationRecommendationsPage = lazy(() => import("@/pages/implementation-recommendations"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy-policy"));
const NonDiscriminationPage = lazy(() => import("@/pages/non-discrimination"));
const VeteransProgramPage = lazy(() => import("@/pages/veterans-program"));
const BehavioralHealthProgramPage = lazy(() => import("@/pages/behavioral-health-program"));
const ReentryProgramPage = lazy(() => import("@/pages/reentry-program"));
const ResearchMethodologyPage = lazy(() => import("@/pages/research-methodology"));
const TransparencyMatrixPage = lazy(() => import("@/pages/transparency-matrix"));
const StakeholderMapPage = lazy(() => import("@/pages/stakeholder-map"));
const OpenInnovationLabPage = lazy(() => import("@/pages/open-innovation-lab"));
const ResourceFinderPage = lazy(() => import("@/pages/resource-finder"));
const GetHelpPage = lazy(() => import("@/pages/get-help"));
const ImpactPage = lazy(() => import("@/pages/impact"));
const APIDocsPage = lazy(() => import("@/pages/api-docs"));
const StakeholderPresentationPage = lazy(() => import("@/pages/stakeholder-presentation"));
const GrantHubPage = lazy(() => import("@/pages/grant-hub"));
const ReentryDashboardPage = lazy(() => import("@/pages/reentry-dashboard"));
const CommunityPartnersPage = lazy(() => import("@/pages/community-partners"));
const OutcomeReportingPage = lazy(() => import("@/pages/outcome-reporting"));
const JusticePartnersPage = lazy(() => import("@/pages/justice-partners"));
const JusticeCommandCenterPage = lazy(() => import("@/pages/justice-command-center"));
const WorkforceAssessmentPage = lazy(() => import("@/pages/workforce-assessment"));
const WorkforceTrainingPage = lazy(() => import("@/pages/workforce-training"));
const WorkforceEmployersPage = lazy(() => import("@/pages/workforce-employers"));
const WorkforceDashboardPage = lazy(() => import("@/pages/workforce-dashboard"));
const CommunityMapPage = lazy(() => import("@/pages/community-map"));
const IntakeWizardPage = lazy(() => import("@/pages/intake-wizard"));
const ServiceDeliveryPage = lazy(() => import("@/pages/service-delivery"));
const HealthWellnessPage = lazy(() => import("@/pages/health-wellness"));
const HealthNetworkPage = lazy(() => import("@/pages/health-network"));
const MentorshipDirectoryPage = lazy(() => import("@/pages/mentorship-directory"));
const PilotDashboardPage = lazy(() => import("@/pages/pilot-dashboard"));
const DosageReportPage = lazy(() => import("@/pages/dosage-report"));
const PreventionPage = lazy(() => import("@/pages/prevention"));
const CoalitionPage = lazy(() => import("@/pages/coalition"));
const ParentEducationPage = lazy(() => import("@/pages/parent-education"));
const MyJourneyPage = lazy(() => import("@/pages/my-journey"));
const CohortOnboardingPage = lazy(() => import("@/pages/cohort-onboarding"));
const MapGapCqiPage = lazy(() => import("@/pages/map-gap-cqi"));
const LogicModelPage = lazy(() => import("@/pages/logic-model"));
const GrantNarrativePage = lazy(() => import("@/pages/grant-narrative"));
const AdvisoryBoardPage = lazy(() => import("@/pages/advisory-board"));
const StaffingPlanPage = lazy(() => import("@/pages/staffing-plan"));
const EcosystemHubPage = lazy(() => import("@/pages/ecosystem-hub"));
const PreventionStrategiesPage = lazy(() => import("@/pages/prevention-strategies"));
const FacilitatorHubPage = lazy(() => import("@/pages/facilitator-hub"));
const PlatformMetricsPage = lazy(() => import("@/pages/platform-metrics"));
const AboutLeadershipPage = lazy(() => import("@/pages/about-leadership"));
const EcosystemStoryPage = lazy(() => import("@/pages/ecosystem-story"));
const ProgramManagementPage = lazy(() => import("@/pages/program-management"));
const ContactPage = lazy(() => import("@/pages/contact"));
const BusinessPlanPage = lazy(() => import("@/pages/business-plan"));
const ApexAcceleratorsPage = lazy(() => import("@/pages/apex-accelerators"));
const ResearchHubPage = lazy(() => import("@/pages/research-hub"));
const ChwDashboardPage = lazy(() => import("@/pages/chw-dashboard"));
const MapGapFrameworkPage = lazy(() => import("@/pages/mapgap-framework"));
const TransparencyDashboardPage = lazy(() => import("@/pages/transparency-dashboard"));
const CaseStudiesPage = lazy(() => import("@/pages/case-studies"));
const ProgramDesignerPage = lazy(() => import("@/pages/program-designer"));
const PeerReviewPage = lazy(() => import("@/pages/peer-review"));
const CollaborationHubPage = lazy(() => import("@/pages/collaboration-hub"));
const ProgramLifecyclePage = lazy(() => import("@/pages/program-lifecycle"));
const GrantPackagesPage = lazy(() => import("@/pages/grant-packages"));
const GrantApplicationsPage = lazy(() => import("@/pages/grant-applications"));
const GrantPriorAwardsPage = lazy(() => import("@/pages/grant-prior-awards"));
const EcosystemOrchestrationPage = lazy(() => import("@/pages/ecosystem-orchestration"));
const StDavidsPrepPage = lazy(() => import("@/pages/stdavids-prep"));
const ESignPage = lazy(() => import("@/pages/esign"));
const EcosystemConnectorPage = lazy(() => import("@/pages/ecosystem-connector"));
const AustinHousingInitiativePage = lazy(() => import("@/pages/austin-housing-initiative"));
const RokuAdsPage = lazy(() => import("@/pages/roku-ads"));
const VoicesOfAustinPage = lazy(() => import("@/pages/voices-of-austin"));
const ManorCommunityHubPage = lazy(() => import("@/pages/manor-community-hub"));
const PflugervilleCommunityHubPage = lazy(() => import("@/pages/pflugerville-community-hub"));
const EcosystemOpsCenterPage = lazy(() => import("@/pages/ecosystem-ops-center"));
const PresentationsHubPage = lazy(() => import("@/pages/presentations"));
const EcosystemEmbedPage = lazy(() => import("@/pages/ecosystem-embed"));
const LifeBridgeEmbedPage = lazy(() => import("@/pages/ecosystem-embed").then(m => ({ default: m.LifeBridgeEmbedPage })));
const TexasAssessmentPage = lazy(() => import("@/pages/texas-assessment"));
const ThirdSpacesPage = lazy(() => import("@/pages/third-spaces"));
const EcosystemAIPage = lazy(() => import("@/pages/ecosystem-ai"));
const AIConsultingPage = lazy(() => import("@/pages/ai-consulting"));
const HealthcareGrantsPage = lazy(() => import("@/pages/healthcare-grants"));
const AIWorkforcePage = lazy(() => import("@/pages/ai-workforce"));
const PMAcademyPage = lazy(() => import("@/pages/pm-academy"));
const DirectiveCompliancePage = lazy(() => import("@/pages/directive-compliance"));
const RpliceToolsPage = lazy(() => import("@/pages/rplice-tools"));
const MceContractsPage = lazy(() => import("@/pages/mce-contracts"));
const VideoPipelinePage = lazy(() => import("@/pages/video-pipeline"));
const ProgramEnginePage = lazy(() => import("@/pages/program-engine"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const ProposalCommandPage = lazy(() => import("@/pages/proposal-command"));
const ProposalPipelinePage = lazy(() => import("@/pages/proposal-pipeline"));
const BusinessDocumentsPage = lazy(() => import("@/pages/business-documents"));
const CommunityResourceDirectoryPage = lazy(() => import("@/pages/community-resource-directory"));
const BenefitsCommandCenterPage = lazy(() => import("@/pages/benefits-command-center"));
const BenefitsScreenerPage = lazy(() => import("@/pages/benefits-screener"));
const CoalitionPortalPage = lazy(() => import("@/pages/coalition-portal"));
const LOIWriterPage = lazy(() => import("@/pages/loi-writer"));
const DonorsPage = lazy(() => import("@/pages/donors"));
const DonorReceiptDemoPage = lazy(() => import("@/pages/donor-receipt-demo"));
const SDOHChainPage = lazy(() => import("@/pages/sdoh-chain"));
const SDOHExplorerPage = lazy(() => import("@/pages/sdoh-explorer"));
const CityComparisonPage = lazy(() => import("@/pages/city-comparison"));
const FafsaNavigatorPage = lazy(() => import("@/pages/fafsa-navigator"));
const TransitionPlansPage = lazy(() => import("@/pages/transition-plans"));
const ApprenticeshipTrackerPage = lazy(() => import("@/pages/apprenticeship-tracker"));
const OpportunityYouthPage = lazy(() => import("@/pages/opportunity-youth"));
const NeighborhoodLookupPage = lazy(() => import("@/pages/neighborhood-lookup"));
const WorkforceReadinessPage = lazy(() => import("@/pages/workforce-readiness"));
const BusinessCardPage = lazy(() => import("@/pages/business-card"));
const GrantCommandCenterPage = lazy(() => import("@/pages/grant-command-center"));
const NsfTechAccessHubPage = lazy(() => import("@/pages/nsf-techaccess-hub"));
const StDavidsWAB2WorkspacePage = lazy(() => import("@/pages/st-davids-wab2-workspace"));
const WAB2EnrollmentHubPage = lazy(() => import("@/pages/wab2-enrollment-hub"));
const DataSourcesPage = lazy(() => import("@/pages/data-sources"));
const ReentryStipendPilotPage = lazy(() => import("@/pages/reentry-stipend-pilot"));
const ReentryStandardsPage = lazy(() => import("@/pages/reentry-standards"));
const StandardsPublicPage = lazy(() => import("@/pages/standards-public"));
const StrategicPlanPage = lazy(() => import("@/pages/strategic-plan"));
const OutcomeReportsNrrcPage = lazy(() => import("@/pages/outcome-reports-nrrc"));
const ResumeBuilderPage = lazy(() => import("@/pages/resume-builder"));
const EngagementHubPage = lazy(() => import("@/pages/engagement-hub"));
const CorridorIntelligencePage = lazy(() => import("@/pages/corridor-intelligence"));
const CorridorEvidencePage = lazy(() => import("@/pages/corridor-evidence"));
const CorridorDocsPage = lazy(() => import("@/pages/corridor-docs"));
const CorridorDocsLivePage = lazy(() => import("@/pages/corridor-docs-live"));
const NetworkMembersPage = lazy(() => import("@/pages/network-members"));
const ResidentJourneyPage = lazy(() => import("@/pages/resident-journey"));
const CaseManagerViewPage = lazy(() => import("@/pages/case-manager-view"));

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
      <Route path="/coverage" component={CoveragePage} />
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
      <Route path="/non-discrimination" component={NonDiscriminationPage} />
      <Route path="/veterans" component={VeteransProgramPage} />
      <Route path="/behavioral-health" component={BehavioralHealthProgramPage} />
      <Route path="/reentry-program" component={ReentryProgramPage} />
      <Route path="/research" component={ResearchMethodologyPage} />
      <Route path="/methodology" component={ResearchMethodologyPage} />
      <Route path="/transparency-matrix" component={TransparencyMatrixPage} />
      <Route path="/stakeholder-map" component={StakeholderMapPage} />
      <Route path="/open-innovation-lab" component={OpenInnovationLabPage} />
      <Route path="/resources" component={ResourceFinderPage} />
      <Route path="/get-help" component={GetHelpPage} />
      <Route path="/impact" component={ImpactPage} />
      <Route path="/api-docs" component={APIDocsPage} />
      <Route path="/grants" component={GrantHubPage} />
      <Route path="/reentry" component={ReentryDashboardPage} />
      <Route path="/partners" component={CommunityPartnersPage} />
      <Route path="/outcomes" component={OutcomeReportingPage} />
      <Route path="/justice-partners" component={JusticePartnersPage} />
      <Route path="/justice-command-center" component={JusticeCommandCenterPage} />
      <Route path="/resource-directory" component={CommunityResourceDirectoryPage} />
      <Route path="/workforce-assessment" component={WorkforceAssessmentPage} />
      <Route path="/workforce-training" component={WorkforceTrainingPage} />
      <Route path="/workforce-employers" component={WorkforceEmployersPage} />
      <Route path="/workforce-dashboard" component={WorkforceDashboardPage} />
      <Route path="/workforce-readiness" component={WorkforceReadinessPage} />
      <Route path="/business-card" component={BusinessCardPage} />
      <Route path="/grant-command-center" component={GrantCommandCenterPage} />
      <Route path="/nsf-techaccess-hub" component={NsfTechAccessHubPage} />
      <Route path="/st-davids-wab2" component={StDavidsWAB2WorkspacePage} />
      <Route path="/wab2-enrollment" component={WAB2EnrollmentHubPage} />
      <Route path="/st-davids" component={WAB2EnrollmentHubPage} />
      <Route path="/community-map" component={CommunityMapPage} />
      <Route path="/intake" component={IntakeWizardPage} />
      <Route path="/services" component={ServiceDeliveryPage} />
      <Route path="/health-wellness" component={HealthWellnessPage} />
      <Route path="/health-network" component={HealthNetworkPage} />
      <Route path="/mentorship-directory" component={MentorshipDirectoryPage} />
      <Route path="/pilot" component={PilotDashboardPage} />
      <Route path="/dosage" component={DosageReportPage} />
      <Route path="/prevention" component={PreventionPage} />
      <Route path="/coalition" component={CoalitionPage} />
      <Route path="/parent-education" component={ParentEducationPage} />
      <Route path="/my-journey" component={MyJourneyPage} />
      <Route path="/cohort-onboarding" component={CohortOnboardingPage} />
      <Route path="/cqi" component={MapGapCqiPage} />
      <Route path="/logic-model" component={LogicModelPage} />
      <Route path="/grant-narrative" component={GrantNarrativePage} />
      <Route path="/advisory-board" component={AdvisoryBoardPage} />
      <Route path="/staffing-plan" component={StaffingPlanPage} />
      <Route path="/ecosystem" component={EcosystemConnectorPage} />
      <Route path="/ecosystem-hub-legacy" component={EcosystemHubPage} />
      <Route path="/prevention-strategies" component={PreventionStrategiesPage} />
      <Route path="/facilitator-hub" component={FacilitatorHubPage} />
      <Route path="/platform-metrics" component={PlatformMetricsPage} />
      <Route path="/about" component={AboutLeadershipPage} />
      <Route path="/ecosystem-story" component={EcosystemStoryPage} />
      <Route path="/program-management" component={ProgramManagementPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/business-plan" component={BusinessPlanPage} />
      <Route path="/business-documents" component={BusinessDocumentsPage} />
      <Route path="/apex-accelerators" component={ApexAcceleratorsPage} />
      <Route path="/research-hub" component={ResearchHubPage} />
      <Route path="/chw-dashboard" component={ChwDashboardPage} />
      <Route path="/mapgap-framework" component={MapGapFrameworkPage} />
      <Route path="/transparency" component={TransparencyDashboardPage} />
      <Route path="/case-studies" component={CaseStudiesPage} />
      <Route path="/program-designer" component={ProgramDesignerPage} />
      <Route path="/peer-review" component={PeerReviewPage} />
      <Route path="/collaboration-hub" component={CollaborationHubPage} />
      <Route path="/program-lifecycle" component={ProgramLifecyclePage} />
      <Route path="/grant-packages" component={GrantPackagesPage} />
      <Route path="/grants/applications" component={GrantApplicationsPage} />
      <Route path="/grant-prior-awards" component={GrantPriorAwardsPage} />
      <Route path="/ecosystem-orchestration" component={EcosystemOrchestrationPage} />
      <Route path="/stdavids-prep" component={StDavidsPrepPage} />
      <Route path="/esign" component={ESignPage} />
      <Route path="/esign/:id" component={ESignPage} />
      <Route path="/austin" component={AustinHousingInitiativePage} />
      <Route path="/roku-ads" component={RokuAdsPage} />
      <Route path="/voices-of-austin" component={VoicesOfAustinPage} />
      <Route path="/manor" component={ManorCommunityHubPage} />
      <Route path="/pflugerville" component={PflugervilleCommunityHubPage} />
      <Route path="/ops-center" component={EcosystemOpsCenterPage} />
      <Route path="/presentations" component={PresentationsHubPage} />
      <Route path="/texas-assessment" component={TexasAssessmentPage} />
      <Route path="/third-spaces" component={ThirdSpacesPage} />
      <Route path="/ecosystem-ai" component={EcosystemAIPage} />
      <Route path="/ai-consulting" component={AIConsultingPage} />
      <Route path="/healthcare-grants" component={HealthcareGrantsPage} />
      <Route path="/benefits" component={BenefitsCommandCenterPage} />
      <Route path="/benefits-screener" component={BenefitsScreenerPage} />
      <Route path="/coalition" component={CoalitionPortalPage} />
      <Route path="/loi-writer" component={LOIWriterPage} />
      <Route path="/donors" component={DonorsPage} />
      <Route path="/donor-receipt-demo" component={DonorReceiptDemoPage} />
      <Route path="/sdoh-chain" component={SDOHChainPage} />
      <Route path="/sdoh-explorer" component={SDOHExplorerPage} />
      <Route path="/resident-journey" component={ResidentJourneyPage} />
      <Route path="/resident-journey/:id" component={ResidentJourneyPage} />
      <Route path="/case-manager" component={CaseManagerViewPage} />
      <Route path="/case-manager/:id" component={CaseManagerViewPage} />
      <Route path="/city-comparison" component={CityComparisonPage} />
      <Route path="/transition-plans" component={TransitionPlansPage} />
      <Route path="/ai-workforce" component={AIWorkforcePage} />
      <Route path="/pm-academy" component={PMAcademyPage} />
      <Route path="/directive-compliance" component={DirectiveCompliancePage} />
      <Route path="/rplice-tools" component={RpliceToolsPage} />
      <Route path="/video-pipeline" component={VideoPipelinePage} />
      <Route path="/mce-contracts" component={MceContractsPage} />
      <Route path="/program-engine" component={ProgramEnginePage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/proposal-command" component={ProposalCommandPage} />
      <Route path="/proposal-pipeline" component={ProposalPipelinePage} />
      <Route path="/apprenticeship-tracker" component={ApprenticeshipTrackerPage} />
      <Route path="/opportunity-youth" component={OpportunityYouthPage} />
      <Route path="/fafsa-navigator" component={FafsaNavigatorPage} />
      <Route path="/neighborhood" component={NeighborhoodLookupPage} />
      <Route path="/data-sources" component={DataSourcesPage} />
      <Route path="/reentry-stipend-pilot" component={ReentryStipendPilotPage} />
      <Route path="/reentry/standards" component={ReentryStandardsPage} />
      <Route path="/standards/public" component={StandardsPublicPage} />
      <Route path="/reentry/strategic-plan" component={StrategicPlanPage} />
      <Route path="/reentry/outcome-reports" component={OutcomeReportsNrrcPage} />
      <Route path="/resume-builder" component={ResumeBuilderPage} />
      <Route path="/engagement-hub" component={EngagementHubPage} />
      <Route path="/corridor" component={CorridorIntelligencePage} />
      <Route path="/corridor-intelligence" component={CorridorIntelligencePage} />
      <Route path="/corridor/evidence" component={CorridorEvidencePage} />
      <Route path="/corridor/docs" component={CorridorDocsPage} />
      <Route path="/corridor/docs/live" component={CorridorDocsLivePage} />
      <Route path="/network/members" component={NetworkMembersPage} />
      <Route path="/network" component={NetworkMembersPage} />
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
      <ContextualHelpButton />
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

function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Suspense fallback={<PageFallback />}>
        {children}
      </Suspense>
    </div>
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
                  <Route path="/ecosystem/embed">
                    <EmbedLayout><EcosystemEmbedPage /></EmbedLayout>
                  </Route>
                  <Route path="/ecosystem/lifebridge">
                    <EmbedLayout><LifeBridgeEmbedPage /></EmbedLayout>
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
