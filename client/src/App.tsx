import { useEffect, useRef, lazy, Suspense, useState } from "react";
import { Switch, Route, Redirect } from "wouter";
import { cn } from "@/lib/utils";
import { NavModeProvider, useNavMode } from "@/lib/nav-mode";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { RequireAuth } from "@/components/require-auth";
import { OrgRedirectGuard } from "@/components/org-redirect-guard";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/not-found";
import { ContextualHelpButton } from "@/components/contextual-help";
import { openCommandPalette } from "@/components/command-palette";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
const ConceptsHubPage = lazy(() => import("@/pages/concepts/index"));
const OilPumpjackConceptPage = lazy(() => import("@/pages/concepts/oil-pumpjack"));
const TransformerConceptPage = lazy(() => import("@/pages/concepts/transformer"));
const SuspensionBridgeConceptPage = lazy(() => import("@/pages/concepts/suspension-bridge"));
const LithiumBatteryConceptPage = lazy(() => import("@/pages/concepts/lithium-battery"));
const AirplaneWingConceptPage = lazy(() => import("@/pages/concepts/airplane-wing"));
const PublicKeyEncryptionConceptPage = lazy(() => import("@/pages/concepts/public-key-encryption"));
const WindTurbineConceptPage = lazy(() => import("@/pages/concepts/wind-turbine"));
const PacemakerConceptPage = lazy(() => import("@/pages/concepts/pacemaker"));
const TradeSimsLandingPage = lazy(() => import("@/pages/academy/trade-sims/index"));
const TradeSimsTradeDetailPage = lazy(() => import("@/pages/academy/trade-sims/trade-detail"));
const TradeSimsLessonPlayerPage = lazy(() => import("@/pages/academy/trade-sims/lesson-player"));
const TradeSimsCertifyPage = lazy(() => import("@/pages/academy/trade-sims/certify"));

const TradeSimsTranscriptPage = lazy(() => import("@/pages/academy/trade-sims/transcript"));

const TradeCertVerifyPage = lazy(() => import("@/pages/academy/trade-sims/verify"));
const TradeSimsSignupsAdminPage = lazy(() => import("@/pages/admin/trade-sims-signups"));
import { TradeSimsTrialGate } from "@/components/trade-sims-trial-gate";
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
const ReentryRouterPage = lazy(() => import("@/pages/reentry-router"));
const CommunityPartnersPage = lazy(() => import("@/pages/community-partners"));
const OutcomeReportingPage = lazy(() => import("@/pages/outcome-reporting"));
const JusticePartnersPage = lazy(() => import("@/pages/justice-partners"));
const JusticeCommandCenterPage = lazy(() => import("@/pages/justice-command-center"));
const WorkforceAssessmentPage = lazy(() => import("@/pages/workforce-assessment"));
const WorkforceTrainingPage = lazy(() => import("@/pages/workforce-training"));
const WorkforceEmployersPage = lazy(() => import("@/pages/workforce-employers"));
const WorkforcePellPage = lazy(() => import("@/pages/workforce-pell"));
const PlatformHealthPage = lazy(() => import("@/pages/admin/platform-health"));
const MOSTranslatorPage = lazy(() => import("@/pages/mos-translator"));
const WIOAOutcomesPage = lazy(() => import("@/pages/wioa-outcomes"));
const EquityDashboardPage = lazy(() => import("@/pages/EquityDashboard"));
const HouseholdProfilePage = lazy(() => import("@/pages/HouseholdProfile"));
const PolicyEnginePage = lazy(() => import("@/pages/PolicyEngine"));
const WorkforceDashboardPage = lazy(() => import("@/pages/workforce-dashboard"));
const CommunityMapPage = lazy(() => import("@/pages/community-map"));
const VoiceIndexPage = lazy(() => import("@/pages/voice/index"));
const RegionalBriefingPage = lazy(() => import("@/pages/regional-briefing"));
const VoiceProjectPage = lazy(() => import("@/pages/voice/project"));
const VoiceWizardPage = lazy(() => import("@/pages/voice/wizard"));
const VoiceInsightsPage = lazy(() => import("@/pages/voice/insights"));
const VoiceStoryPage = lazy(() => import("@/pages/voice/story"));
const VoiceAdminPage = lazy(() => import("@/pages/voice/admin"));
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
const CedsNavigatorPage = lazy(() => import("@/pages/ceds-navigator"));
const RfpWriterPage = lazy(() => import("@/pages/rfp-writer"));
const OrgOnboardingPage = lazy(() => import("@/pages/org-onboarding"));
const PartnerPortalPage = lazy(() => import("@/pages/partner-portal"));
const PartnersJoinPage = lazy(() => import("@/pages/partners-join"));
const OrgSettingsPage = lazy(() => import("@/pages/org-settings"));
const OrgDocumentsLibraryPage = lazy(() => import("@/pages/org-documents-library"));
const MyGrantsPage = lazy(() => import("@/pages/my-grants"));
const WonProposalsPage = lazy(() => import("@/pages/won-proposals"));
const ConglomerateTeamPage = lazy(() => import("@/pages/conglomerate-team"));
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
const ESignInvitePage = lazy(() => import("@/pages/esign-invite"));
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
const ConsortiumProposalPage = lazy(() => import("@/pages/consortium-proposal"));
const BusinessDocumentsPage = lazy(() => import("@/pages/business-documents"));
const CommunityResourceDirectoryPage = lazy(() => import("@/pages/community-resource-directory"));
const BenefitsCommandCenterPage = lazy(() => import("@/pages/benefits-command-center"));
const BenefitsScreenerPage = lazy(() => import("@/pages/benefits-screener"));
const CoalitionPortalPage = lazy(() => import("@/pages/coalition-portal"));
const LOIWriterPage = lazy(() => import("@/pages/loi-writer"));
const DonorsPage = lazy(() => import("@/pages/donors"));
const DonorReceiptDemoPage = lazy(() => import("@/pages/donor-receipt-demo"));
const SDOHChainPage = lazy(() => import("@/pages/sdoh-chain"));
const ChainwebBuilderPage = lazy(() => import("@/pages/chainweb-builder"));
const CommunityImpactPage = lazy(() => import("@/pages/community-impact"));
const CommunityDataPage = lazy(() => import("@/pages/community-data"));
const OrchestraDemoPage = lazy(() => import("@/pages/orchestra-demo"));
const CommunityComparePage = lazy(() => import("@/pages/community-compare"));
const ChildIncDeckPage = lazy(() => import("@/pages/childinc-deck"));
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
const RfpFidelityPage = lazy(() => import("@/pages/rfp-fidelity-page"));
const RfpFidelityIndexPage = lazy(() => import("@/pages/rfp-fidelity-index"));
const SedgwickVitalityProposalPage = lazy(() => import("@/pages/sedgwick-vitality-proposal"));
const ThisWeekPage = lazy(() => import("@/pages/this-week"));
const NsfTechAccessHubPage = lazy(() => import("@/pages/nsf-techaccess-hub"));
const StDavidsWAB2WorkspacePage = lazy(() => import("@/pages/st-davids-wab2-workspace"));
const NorthWilcoChildcareCoalitionPage = lazy(() => import("@/pages/north-wilco-childcare-coalition"));
const OurApproachPage = lazy(() => import("@/pages/our-approach"));
const WAB2EnrollmentHubPage = lazy(() => import("@/pages/wab2-enrollment-hub"));
const DataSourcesPage = lazy(() => import("@/pages/data-sources"));
const ReentryStipendPilotPage = lazy(() => import("@/pages/reentry-stipend-pilot"));
const ReentryStandardsPage = lazy(() => import("@/pages/reentry-standards"));
const JobBoardPage = lazy(() => import("@/pages/JobBoard"));
const ReentryIntakeEnhancedPage = lazy(() => import("@/pages/ReentryIntakeEnhanced"));
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
const FosterYouthHubPage = lazy(() => import("@/pages/foster-youth/hub"));
const FosterYouthToolkitPage = lazy(() => import("@/pages/foster-youth/toolkit"));
const FosterYouthTransitionPlanPage = lazy(() => import("@/pages/foster-youth/transition-plan"));
const FosterYouthWellbeingPage = lazy(() => import("@/pages/foster-youth/wellbeing"));
const FosterYouthRightsPage = lazy(() => import("@/pages/foster-youth/rights"));
const FosterYouthBenefitsPage = lazy(() => import("@/pages/foster-youth/benefits"));
const FosterYouthIntakePage = lazy(() => import("@/pages/foster-youth/intake"));
const FosterYouthCohortAnalyticsPage = lazy(() => import("@/pages/foster-youth/cohort-analytics"));
const FosterYouthStatePortalPage = lazy(() => import("@/pages/foster-youth/state-portal"));
const FosterYouthPolicyComparisonPage = lazy(() => import("@/pages/foster-youth/policy-comparison"));
const VannCollaborationHubPage = lazy(() => import("@/pages/partners/vann-collaboration-hub"));
const FamilyProgramTrackerPage = lazy(() => import("@/pages/partners/family-program-tracker"));
const RfpStorytellerPage = lazy(() => import("@/pages/partners/rfp-storyteller"));
const HubHomePage = lazy(() => import("@/pages/hub-home"));
const HubServePage = lazy(() => import("@/pages/hub-serve"));
const HubFundPage = lazy(() => import("@/pages/hub-fund"));
const HubGrowPage = lazy(() => import("@/pages/hub-grow"));
const HubMorePage = lazy(() => import("@/pages/hub-more"));
const HubConnectPage = lazy(() => import("@/pages/hub-connect"));
const WorkbenchPage = lazy(() => import("@/pages/workbench"));
const EcosystemIntelPage = lazy(() => import("@/pages/ecosystem-intel"));
const SafePassagePage = lazy(() => import("@/pages/safe-passage/index"));
const SafePassageSafetyPlanningPage = lazy(() => import("@/pages/safe-passage/safety-planning"));
const SafePassageHousingAssessmentPage = lazy(() => import("@/pages/safe-passage/housing-assessment"));
const SafePassageBenefitsBridgePage = lazy(() => import("@/pages/safe-passage/benefits-bridge"));
const SafePassageLegalNavigatorPage = lazy(() => import("@/pages/safe-passage/legal-navigator"));
const SafePassageEmploymentPathwayPage = lazy(() => import("@/pages/safe-passage/employment-pathway"));
const SafePassageHousingFinderPage = lazy(() => import("@/pages/safe-passage/housing-finder"));
const SafePassagePartnerPortalPage = lazy(() => import("@/pages/safe-passage/partner-portal"));
const SafePassageImpactDashboardPage = lazy(() => import("@/pages/safe-passage/impact-dashboard"));

// ─── Initiatives ──────────────────────────────────────────────────────────────
const InitiativesPage = lazy(() => import("@/pages/initiatives"));
const InitiativeDetailPage = lazy(() => import("@/pages/initiative-detail"));

// ─── Child Care & Workforce ────────────────────────────────────────────────────
const ChildCarePage = lazy(() => import("@/pages/child-care"));
const ChildCareWilcoPage = lazy(() => import("@/pages/child-care-wilco"));
const ChildCareNorthTexasPage = lazy(() => import("@/pages/child-care-north-texas"));
const ChildCareWorkforcePage = lazy(() => import("@/pages/child-care-workforce"));

// ─── Rural & Agricultural Tools (USDA NIFA Open Data Framework) ──────────────
const RuralIntelPage = lazy(() => import("@/pages/rural-intel"));
const ContractorOpportunitiesPage = lazy(() => import("@/pages/contractor-opportunities"));
const Grants101Page = lazy(() => import("@/pages/grants-101"));
// ─── YHSI (HUD CPD-2600-DC-0035) ──────────────────────────────────────────────
const YouthVoicePage = lazy(() => import("@/pages/youth-voice"));
const YhsiOpsPage = lazy(() => import("@/pages/yhsi-ops"));
const YhsiSystemPage = lazy(() => import("@/pages/yhsi-system"));
const YouthRightsPage = lazy(() => import("@/pages/youth-rights"));
const FarmCooperativePage = lazy(() => import("@/pages/farm-cooperative"));
const FarmProfitabilityPage = lazy(() => import("@/pages/farm-profitability"));
const InvasiveSpeciesPage = lazy(() => import("@/pages/invasive-species"));
const FsaEligibilityPage = lazy(() => import("@/pages/fsa-eligibility"));
const AgTradeSimsPage = lazy(() => import("@/pages/ag-trade-sims"));
const FarmworkerItiPage = lazy(() => import("@/pages/farmworker-iti"));
const ProducerVoicePage = lazy(() => import("@/pages/producer-voice"));
const RuralAlertsPage = lazy(() => import("@/pages/rural-alerts"));
const RuralHealthPage = lazy(() => import("@/pages/rural-health"));
const RuralConnectivityPage = lazy(() => import("@/pages/rural-connectivity"));
const RuralHousingPage = lazy(() => import("@/pages/rural-housing"));
const RuralWorkforcePage = lazy(() => import("@/pages/rural-workforce"));
const StreetsProgramPage = lazy(() => import("@/pages/streets-program"));
const AlignPage = lazy(() => import("@/pages/align"));
const AlignJourneyPage = lazy(() => import("@/pages/align-journey"));
const AlignOrgAssessmentPage = lazy(() => import("@/pages/align-org-assessment"));
const AlignCommunityPage = lazy(() => import("@/pages/align-community"));
const WhyThriveUpPage = lazy(() => import("@/pages/why-thriveup"));
const ThrivePage = lazy(() => import("@/pages/thrive"));
const MyDocumentsPage = lazy(() => import("@/pages/my-documents"));
const MyAppointmentsPage = lazy(() => import("@/pages/my-appointments"));
const MyHouseholdPage = lazy(() => import("@/pages/my-household"));
const ShadowWorkerHubPage = lazy(() => import("@/pages/shadow-worker-hub"));
const DataCouncilPage = lazy(() => import("@/pages/data-council"));
const SdvosbTrackerPage = lazy(() => import("@/pages/sdvosb-tracker"));
const ClinicalScreeningPage = lazy(() => import("@/pages/ClinicalScreening"));
const FoiaTrackerPage = lazy(() => import("@/pages/FoiaTracker"));
const EmployerRegistrationPage = lazy(() => import("@/pages/EmployerRegistration"));
const ResidentEquityDashboardPage = lazy(() => import("@/pages/resident-equity-dashboard"));
const PartnerScorecardPage = lazy(() => import("@/pages/partner-scorecard"));
const LearnerSettingsPage = lazy(() => import("@/pages/learner-settings"));
const Community411Page = lazy(() => import("@/pages/community-411"));
const CommunityAnalysisPage = lazy(() => import("@/pages/community-analysis"));

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

import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { BandwidthProvider } from "@/lib/bandwidth-mode";
import { AccessibilityProvider } from "@/lib/accessibility";
import { HeaderControls } from "@/components/header-controls";
import { AccessibilityPanel } from "@/components/accessibility-panel";
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandPalette } from "@/components/command-palette";
import { AINavigator } from "@/components/ai-navigator";

function NavigatorPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AINavigator mode="page" />
    </div>
  );
}

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
      <Route path="/concepts" component={ConceptsHubPage} />
      <Route path="/regional-briefing">
        <RequireAuth adminOnly reason="The Regional Briefing pulls TCAF's internal grant pipeline and runs paid AI. Restricted to TCAF admins.">
          <RegionalBriefingPage />
        </RequireAuth>
      </Route>
      <Route path="/concepts/oil-pumpjack" component={OilPumpjackConceptPage} />
      <Route path="/concepts/transformer" component={TransformerConceptPage} />
      <Route path="/concepts/suspension-bridge" component={SuspensionBridgeConceptPage} />
      <Route path="/concepts/lithium-battery" component={LithiumBatteryConceptPage} />
      <Route path="/concepts/airplane-wing" component={AirplaneWingConceptPage} />
      <Route path="/concepts/public-key-encryption" component={PublicKeyEncryptionConceptPage} />
      <Route path="/concepts/wind-turbine" component={WindTurbineConceptPage} />
      <Route path="/concepts/pacemaker" component={PacemakerConceptPage} />
      <Route path="/academy/trade-sims">
        <TradeSimsTrialGate><TradeSimsLandingPage /></TradeSimsTrialGate>
      </Route>
      {/* Public employer verification — deliberately NOT behind the trial gate */}
      <Route path="/verify/trade-cert/:certificateId" component={TradeCertVerifyPage} />
      <Route path="/academy/trade-sims/:tradeSlug/transcript">
        <TradeSimsTrialGate><TradeSimsTranscriptPage /></TradeSimsTrialGate>
      </Route>
      <Route path="/academy/trade-sims/:tradeSlug/certify">
        <TradeSimsTrialGate><TradeSimsCertifyPage /></TradeSimsTrialGate>
      </Route>
      <Route path="/academy/trade-sims/:tradeSlug/:lessonSlug">
        <TradeSimsTrialGate><TradeSimsLessonPlayerPage /></TradeSimsTrialGate>
      </Route>
      <Route path="/academy/trade-sims/:tradeSlug">
        <TradeSimsTrialGate><TradeSimsTradeDetailPage /></TradeSimsTrialGate>
      </Route>
      <Route path="/admin/trade-sims-signups" component={TradeSimsSignupsAdminPage} />
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
      <Route path="/411" component={Community411Page} />
      <Route path="/community-analysis" component={CommunityAnalysisPage} />
      <Route path="/impact" component={ImpactPage} />
      <Route path="/api-docs" component={APIDocsPage} />
      <Route path="/grants">
        <RequireAuth adminOnly reason="Your grant pipeline is restricted to TCAF admins.">
          <GrantHubPage />
        </RequireAuth>
      </Route>
      <Route path="/reentry" component={ReentryRouterPage} />
      <Route path="/intake-wizard" component={IntakeWizardPage} />
      <Route path="/transparency-dashboard" component={TransparencyDashboardPage} />
      <Route path="/partners" component={CommunityPartnersPage} />
      <Route path="/outcomes" component={OutcomeReportingPage} />
      <Route path="/justice-partners" component={JusticePartnersPage} />
      <Route path="/justice-command-center" component={JusticeCommandCenterPage} />
      <Route path="/resource-directory" component={CommunityResourceDirectoryPage} />
      <Route path="/workforce-assessment" component={WorkforceAssessmentPage} />
      <Route path="/workforce-training" component={WorkforceTrainingPage} />
      <Route path="/workforce-employers" component={WorkforceEmployersPage} />
      <Route path="/workforce-dashboard">
        <RequireAuth adminOnly reason="The Workforce Pipeline Dashboard contains internal placement and retention data. Restricted to TCAF admins.">
          <WorkforceDashboardPage />
        </RequireAuth>
      </Route>
      <Route path="/workforce-readiness" component={WorkforceReadinessPage} />
      <Route path="/workforce-pell" component={WorkforcePellPage} />
      <Route path="/mos-translator" component={MOSTranslatorPage} />
      <Route path="/equity-dashboard" component={EquityDashboardPage} />
      <Route path="/household/:id" component={HouseholdProfilePage} />
      <Route path="/policy-engine" component={PolicyEnginePage} />
      <Route path="/wioa-outcomes">
        <RequireAuth adminOnly reason="The WIOA Outcome Dashboard contains placement and wage data. Restricted to TCAF admins.">
          <WIOAOutcomesPage />
        </RequireAuth>
      </Route>
      <Route path="/admin/platform-health">
        <RequireAuth adminOnly reason="Platform Health Monitor is restricted to TCAF admins.">
          <PlatformHealthPage />
        </RequireAuth>
      </Route>
      <Route path="/business-card" component={BusinessCardPage} />
      <Route path="/grant-command-center">
        <RequireAuth adminOnly reason="The Grant Command Center is restricted to TCAF admins.">
          <GrantCommandCenterPage />
        </RequireAuth>
      </Route>
      <Route path="/grants/sedgwick-vitality">
        <RequireAuth adminOnly reason="This proposal package is restricted to TCAF admins.">
          <SedgwickVitalityProposalPage />
        </RequireAuth>
      </Route>
      <Route path="/rfp-fidelity">
        <RequireAuth adminOnly reason="The RFP Fidelity Engine is restricted to TCAF admins.">
          <RfpFidelityIndexPage />
        </RequireAuth>
      </Route>
      <Route path="/grants/:grantId/compliance">
        <RequireAuth adminOnly reason="The RFP compliance workspace is restricted to TCAF admins.">
          <RfpFidelityPage />
        </RequireAuth>
      </Route>
      <Route path="/ceds" component={CedsNavigatorPage} />
      <Route path="/ceds/:regionId" component={CedsNavigatorPage} />
      <Route path="/this-week" component={ThisWeekPage} />
      <Route path="/nsf-techaccess-hub" component={NsfTechAccessHubPage} />
      <Route path="/st-davids-wab2">
        <RequireAuth adminOnly reason="The WAB2 Coalition Impact Dashboard is an internal workspace restricted to TCAF admins.">
          <StDavidsWAB2WorkspacePage />
        </RequireAuth>
      </Route>
      <Route path="/north-wilco-childcare-coalition" component={NorthWilcoChildcareCoalitionPage} />
      <Route path="/our-approach" component={OurApproachPage} />
      <Route path="/wab2-enrollment" component={WAB2EnrollmentHubPage} />
      <Route path="/st-davids" component={WAB2EnrollmentHubPage} />
      <Route path="/community-map" component={CommunityMapPage} />
      <Route path="/voice" component={VoiceIndexPage} />
      <Route path="/voice/new">
        <RequireAuth reason="Sign in to launch a Community Voice project for the community you serve.">
          <VoiceWizardPage />
        </RequireAuth>
      </Route>
      <Route path="/voice/:slug/story" component={VoiceStoryPage} />
      <Route path="/voice/:slug/insights">
        <RequireAuth adminOnly reason="The Insights workspace clusters resident voice into AI themes and routes them to the TCAF ecosystem. Restricted to TCAF admins.">
          <VoiceInsightsPage />
        </RequireAuth>
      </Route>
      <Route path="/voice/:slug/admin">
        <RequireAuth adminOnly reason="The Voice admin workspace lets you moderate pins, review safety routings, and adjust settings. Restricted to TCAF admins.">
          <VoiceAdminPage />
        </RequireAuth>
      </Route>
      <Route path="/voice/:slug" component={VoiceProjectPage} />
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
      <Route path="/grant-narrative">
        <RequireAuth adminOnly reason="The grant writer is restricted to TCAF admins.">
          <RfpWriterPage />
        </RequireAuth>
      </Route>
      <Route path="/grant-narrative-legacy">
        <RequireAuth adminOnly reason="Restricted to TCAF admins.">
          <GrantNarrativePage />
        </RequireAuth>
      </Route>
      <Route path="/partner-portal">
        <RequireAuth reason="Sign in to access your community partner portal.">
          <PartnerPortalPage />
        </RequireAuth>
      </Route>
      <Route path="/onboarding/org">
        <RequireAuth reason="Sign in to create your organization profile.">
          <OrgOnboardingPage />
        </RequireAuth>
      </Route>
      <Route path="/partners/join" component={PartnersJoinPage} />
      <Route path="/join" component={PartnersJoinPage} />
      <Route path="/settings/organization">
        <RequireAuth reason="Sign in to manage your organization profile.">
          <OrgSettingsPage />
        </RequireAuth>
      </Route>
      <Route path="/settings/documents">
        <RequireAuth reason="Sign in to manage your document library.">
          <OrgDocumentsLibraryPage />
        </RequireAuth>
      </Route>
      <Route path="/my-grants">
        <RequireAuth adminOnly reason="Your personal grant pipeline is restricted to TCAF admins.">
          <MyGrantsPage />
        </RequireAuth>
      </Route>
      <Route path="/won-proposals">
        <RequireAuth adminOnly reason="Your winning-proposals library is restricted to TCAF admins.">
          <WonProposalsPage />
        </RequireAuth>
      </Route>
      <Route path="/teaming-network">
        <RequireAuth adminOnly reason="The internal teaming network is restricted to TCAF admins.">
          <ConglomerateTeamPage />
        </RequireAuth>
      </Route>
      <Route path="/conglomerate">
        <RequireAuth adminOnly reason="The internal teaming network is restricted to TCAF admins.">
          <ConglomerateTeamPage />
        </RequireAuth>
      </Route>
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
      <Route path="/apex-accelerators">
        <RequireAuth adminOnly reason="Apex Accelerators workspace is restricted to TCAF admins.">
          <ApexAcceleratorsPage />
        </RequireAuth>
      </Route>
      <Route path="/research-hub" component={ResearchHubPage} />
      <Route path="/chw-dashboard" component={ChwDashboardPage} />
      <Route path="/mapgap-framework" component={MapGapFrameworkPage} />
      <Route path="/transparency" component={TransparencyDashboardPage} />
      <Route path="/case-studies" component={CaseStudiesPage} />
      <Route path="/program-designer" component={ProgramDesignerPage} />
      <Route path="/peer-review" component={PeerReviewPage} />
      <Route path="/collaboration-hub" component={CollaborationHubPage} />
      <Route path="/program-lifecycle" component={ProgramLifecyclePage} />
      <Route path="/grant-packages">
        <RequireAuth adminOnly reason="Grant packages are restricted to TCAF admins.">
          <GrantPackagesPage />
        </RequireAuth>
      </Route>
      <Route path="/grants/applications">
        <RequireAuth adminOnly reason="Grant applications are restricted to TCAF admins.">
          <GrantApplicationsPage />
        </RequireAuth>
      </Route>
      <Route path="/grant-prior-awards">
        <RequireAuth adminOnly reason="Prior awards library is restricted to TCAF admins.">
          <GrantPriorAwardsPage />
        </RequireAuth>
      </Route>
      <Route path="/ecosystem-orchestration" component={EcosystemOrchestrationPage} />
      <Route path="/stdavids-prep">
        <RequireAuth adminOnly reason="CTX Benefits field preparation documents are internal to TCAF staff.">
          <StDavidsPrepPage />
        </RequireAuth>
      </Route>
      <Route path="/esign" component={ESignPage} />
      <Route path="/esign/invite/:id" component={ESignInvitePage} />
      <Route path="/esign/:id" component={ESignPage} />
      <Route path="/austin" component={AustinHousingInitiativePage} />
      <Route path="/roku-ads" component={RokuAdsPage} />
      <Route path="/voices-of-austin" component={VoicesOfAustinPage} />
      <Route path="/manor" component={ManorCommunityHubPage} />
      <Route path="/pflugerville" component={PflugervilleCommunityHubPage} />
      <Route path="/ops-center">
        <RequireAuth adminOnly reason="The Ecosystem Ops Center controls platform wake/keep-alive, deliverable verification, and partner API keys. Restricted to TCAF admins.">
          <EcosystemOpsCenterPage />
        </RequireAuth>
      </Route>
      <Route path="/presentations" component={PresentationsHubPage} />
      <Route path="/texas-assessment" component={TexasAssessmentPage} />
      <Route path="/third-spaces" component={ThirdSpacesPage} />
      <Route path="/ecosystem-ai" component={EcosystemAIPage} />
      <Route path="/ai-consulting" component={AIConsultingPage} />
      <Route path="/healthcare-grants">
        <RequireAuth adminOnly reason="Healthcare grants workspace is restricted to TCAF admins.">
          <HealthcareGrantsPage />
        </RequireAuth>
      </Route>
      <Route path="/benefits" component={BenefitsCommandCenterPage} />
      <Route path="/benefits-screener" component={BenefitsScreenerPage} />
      <Route path="/coalition-portal" component={CoalitionPortalPage} />
      <Route path="/loi-writer">
        <RequireAuth adminOnly reason="The LOI writer is restricted to TCAF admins.">
          <LOIWriterPage />
        </RequireAuth>
      </Route>
      <Route path="/donors" component={DonorsPage} />
      <Route path="/donor-receipt-demo" component={DonorReceiptDemoPage} />
      <Route path="/sdoh-chain" component={SDOHChainPage} />
      <Route path="/chainweb" component={ChainwebBuilderPage} />
      <Route path="/community-impact" component={CommunityImpactPage} />
      <Route path="/community-data" component={CommunityDataPage} />
      <Route path="/orchestra">
        <RequireAuth adminOnly reason="The Full Orchestra runs paid AI across every engine. Restricted to TCAF admins.">
          <OrchestraDemoPage />
        </RequireAuth>
      </Route>
      <Route path="/community-compare" component={CommunityComparePage} />
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
      <Route path="/consortium-proposals" component={ConsortiumProposalPage} />
      <Route path="/apprenticeship-tracker" component={ApprenticeshipTrackerPage} />
      <Route path="/opportunity-youth" component={OpportunityYouthPage} />
      <Route path="/foster-youth" component={FosterYouthHubPage} />
      <Route path="/foster-youth/toolkit" component={FosterYouthToolkitPage} />
      <Route path="/foster-youth/transition-plan" component={FosterYouthTransitionPlanPage} />
      <Route path="/foster-youth/wellbeing" component={FosterYouthWellbeingPage} />
      <Route path="/foster-youth/rights" component={FosterYouthRightsPage} />
      <Route path="/foster-youth/benefits" component={FosterYouthBenefitsPage} />
      <Route path="/foster-youth/intake" component={FosterYouthIntakePage} />
      <Route path="/foster-youth/cohort-analytics" component={FosterYouthCohortAnalyticsPage} />
      <Route path="/foster-youth/state-portal">
        <RequireAuth reason="The State-Agency Portal contains de-identified caseload data and is restricted to TCAF privileged staff (admin, case manager, teacher).">
          <FosterYouthStatePortalPage />
        </RequireAuth>
      </Route>
      <Route path="/foster-youth/policy-comparison" component={FosterYouthPolicyComparisonPage} />
      <Route path="/partners/vann-hub" component={VannCollaborationHubPage} />
      <Route path="/partners/family-program-tracker">
        <RequireAuth reason="The Family & Program Tracker contains community-partner household data (illustrative demo for the Dr. Vann conversation). Sign in to view.">
          <FamilyProgramTrackerPage />
        </RequireAuth>
      </Route>
      <Route path="/partners/rfp-storyteller">
        <RequireAuth reason="The RFP-Match Storyteller reads live tracker data. Sign in to view.">
          <RfpStorytellerPage />
        </RequireAuth>
      </Route>
      <Route path="/fafsa-navigator" component={FafsaNavigatorPage} />
      <Route path="/neighborhood" component={NeighborhoodLookupPage} />
      <Route path="/data-sources" component={DataSourcesPage} />
      <Route path="/jobs" component={JobBoardPage} />
      <Route path="/clinical-screening/:participantId?" component={ClinicalScreeningPage} />
      <Route path="/foia-tracker" component={FoiaTrackerPage} />
      <Route path="/employer/register" component={EmployerRegistrationPage} />
      <Route path="/resident-equity" component={ResidentEquityDashboardPage} />
      <Route path="/partner-scorecard" component={PartnerScorecardPage} />
      <Route path="/learner-settings" component={LearnerSettingsPage} />
      <Route path="/reentry/intake" component={ReentryIntakeEnhancedPage} />
      <Route path="/reentry-stipend-pilot" component={ReentryStipendPilotPage} />
      <Route path="/reentry/standards" component={ReentryStandardsPage} />
      <Route path="/standards/public" component={StandardsPublicPage} />
      <Route path="/reentry/strategic-plan" component={StrategicPlanPage} />
      <Route path="/reentry/outcome-reports" component={OutcomeReportsNrrcPage} />
      <Route path="/resume-builder" component={ResumeBuilderPage} />
      <Route path="/engagement-hub" component={EngagementHubPage} />
      <Route path="/corridor-intelligence" component={CorridorIntelligencePage} />
      <Route path="/corridor/evidence" component={CorridorEvidencePage} />
      <Route path="/corridor/docs" component={CorridorDocsPage} />
      <Route path="/corridor/docs/live" component={CorridorDocsLivePage} />
      <Route path="/network" component={NetworkMembersPage} />
      <Route path="/navigator" component={NavigatorPage} />
      <Route path="/hub" component={HubHomePage} />
      <Route path="/hub/serve" component={HubServePage} />
      <Route path="/hub/fund" component={HubFundPage} />
      <Route path="/hub/grow" component={HubGrowPage} />
      <Route path="/hub/more" component={HubMorePage} />
      <Route path="/hub/connect" component={HubConnectPage} />
      <Route path="/workbench" component={WorkbenchPage} />
      <Route path="/safe-passage" component={SafePassagePage} />
      <Route path="/safe-passage/safety-planning" component={SafePassageSafetyPlanningPage} />
      <Route path="/safe-passage/housing-assessment" component={SafePassageHousingAssessmentPage} />
      <Route path="/safe-passage/benefits-bridge" component={SafePassageBenefitsBridgePage} />
      <Route path="/safe-passage/legal-navigator" component={SafePassageLegalNavigatorPage} />
      <Route path="/safe-passage/employment-pathway" component={SafePassageEmploymentPathwayPage} />
      <Route path="/safe-passage/housing-finder" component={SafePassageHousingFinderPage} />
      <Route path="/safe-passage/partner-portal" component={SafePassagePartnerPortalPage} />
      <Route path="/safe-passage/impact-dashboard" component={SafePassageImpactDashboardPage} />
      <Route path="/ecosystem-intel" component={EcosystemIntelPage} />
      {/* ── Initiatives ── */}
      <Route path="/initiatives" component={InitiativesPage} />
      <Route path="/initiatives/:slug" component={InitiativeDetailPage} />
      {/* ── Child Care & Workforce ── */}
      <Route path="/child-care" component={ChildCarePage} />
      <Route path="/child-care-wilco" component={ChildCareWilcoPage} />
      <Route path="/child-care-north-texas" component={ChildCareNorthTexasPage} />
      <Route path="/child-care-workforce" component={ChildCareWorkforcePage} />
      {/* ── Rural & Agricultural Tools (USDA NIFA Open Data Framework) ── */}
      <Route path="/rural-intel" component={RuralIntelPage} />
      <Route path="/contractor-opportunities" component={ContractorOpportunitiesPage} />
      <Route path="/grants-101" component={Grants101Page} />
      {/* ── YHSI — Youth Voice is public by design (no login, capability tokens) ── */}
      <Route path="/youth-voice" component={YouthVoicePage} />
      <Route path="/yhsi-ops">
        <RequireAuth adminOnly reason="YHSI Operations contains youth PII (McKinney-Vento status, housing situations). Restricted to staff.">
          <YhsiOpsPage />
        </RequireAuth>
      </Route>
      <Route path="/youth-rights" component={YouthRightsPage} />
      <Route path="/yhsi-system">
        <RequireAuth staffOnly reason="YHSI System Improvement contains youth assessment data and grant financials. Restricted to staff.">
          <YhsiSystemPage />
        </RequireAuth>
      </Route>
      <Route path="/farm-cooperative" component={FarmCooperativePage} />
      <Route path="/farm-profitability" component={FarmProfitabilityPage} />
      <Route path="/invasive-species" component={InvasiveSpeciesPage} />
      <Route path="/fsa-eligibility" component={FsaEligibilityPage} />
      <Route path="/ag-trade-sims" component={AgTradeSimsPage} />
      <Route path="/farmworker-iti" component={FarmworkerItiPage} />
      <Route path="/producer-voice" component={ProducerVoicePage} />
      <Route path="/rural-alerts" component={RuralAlertsPage} />
      <Route path="/rural-health" component={RuralHealthPage} />
      <Route path="/rural-connectivity" component={RuralConnectivityPage} />
      <Route path="/rural-housing" component={RuralHousingPage} />
      <Route path="/rural-workforce" component={RuralWorkforcePage} />
      {/* ── Redirect aliases (old / alternate paths → canonical routes) ── */}
      <Route path="/streets" component={StreetsProgramPage} />
      <Route path="/align" component={AlignPage} />
      <Route path="/align/my-journey" component={AlignJourneyPage} />
      <Route path="/align/org-assessment" component={AlignOrgAssessmentPage} />
      <Route path="/align/community" component={AlignCommunityPage} />
      <Route path="/why-thriveup" component={WhyThriveUpPage} />
      <Route path="/thrive" component={ThrivePage} />
      <Route path="/my-documents" component={MyDocumentsPage} />
      <Route path="/my-appointments" component={MyAppointmentsPage} />
      <Route path="/my-household" component={MyHouseholdPage} />
      <Route path="/shadow-worker-hub" component={ShadowWorkerHubPage} />
      <Route path="/data-council" component={DataCouncilPage} />
      <Route path="/sdvosb-tracker" component={SdvosbTrackerPage} />
      <Route path="/reentry-dashboard"><Redirect to="/reentry" /></Route>
      <Route path="/corridor"><Redirect to="/corridor-intelligence" /></Route>
      <Route path="/network/members"><Redirect to="/network" /></Route>
      <Route path="/wab2-enrollment-hub"><Redirect to="/wab2-enrollment" /></Route>
      <Route path="/benefits-command-center"><Redirect to="/benefits" /></Route>
      <Route path="/about-leadership"><Redirect to="/about" /></Route>
      <Route path="/career-pathways"><Redirect to="/academy/careers" /></Route>
      <Route path="/community-resource-directory"><Redirect to="/resource-directory" /></Route>
      <Route path="/outcome-reporting"><Redirect to="/outcomes" /></Route>
      <Route path="/ecosystem-hub"><Redirect to="/ecosystem" /></Route>
      <Route path="/financial-literacy"><Redirect to="/academy/financial-literacy" /></Route>
      <Route path="/mentorship"><Redirect to="/mentorship-directory" /></Route>
      <Route path="/open-innovation"><Redirect to="/open-innovation-lab" /></Route>
      <Route path="/parent-dashboard"><Redirect to="/parents/dashboard" /></Route>
      <Route path="/rplice"><Redirect to="/rplice-tools" /></Route>
      <Route path="/sdoh"><Redirect to="/sdoh-chain" /></Route>
      <Route path="/sedgwick"><Redirect to="/grants/sedgwick-vitality" /></Route>
      <Route path="/voices"><Redirect to="/voices-of-austin" /></Route>
      <Route path="/workforce"><Redirect to="/workforce-assessment" /></Route>
      <Route path="/advisory"><Redirect to="/advisory-board" /></Route>
      <Route path="/apprenticeship"><Redirect to="/apprenticeship-tracker" /></Route>
      <Route path="/mapgap"><Redirect to="/mapgap-framework" /></Route>
      <Route path="/dfc-command-center"><Redirect to="/ecosystem" /></Route>
      <Route path="/community-partners"><Redirect to="/partners" /></Route>
      <Route path="/herhealth"><Redirect to="/health-network" /></Route>
      <Route path="/safereport"><Redirect to="/resources" /></Route>
      <Route path="/sankofa"><Redirect to="/health-network" /></Route>
      <Route path="/civic-signal"><Redirect to="/community-map" /></Route>
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

function NavModeToggle() {
  const { mode, toggle } = useNavMode();
  return (
    <button
      onClick={toggle}
      className="text-xs font-medium px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors whitespace-nowrap flex-shrink-0"
      data-testid="button-nav-mode-toggle"
      title={mode === "hub" ? "Switch to classic sidebar" : "Switch to hub view"}
    >
      {mode === "hub" ? "☰ Classic" : "⊞ Hub View"}
    </button>
  );
}

function AppLayoutInner() {
  useAttendanceLog();
  const { mode } = useNavMode();
  const { t } = useLanguage();
  const [isInIframe] = useState(() => typeof window !== "undefined" && window.self !== window.top);
  const style = { "--sidebar-width": "16rem", "--sidebar-width-icon": "3rem" };

  if (isInIframe) {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <main className="w-full min-h-screen overflow-auto">
          <ErrorBoundary>
            <Suspense fallback={<PageFallback />}>
              <AppRouter />
            </Suspense>
          </ErrorBoundary>
        </main>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen={false} style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className={cn("flex flex-col flex-1 min-w-0", mode === "hub" && "pb-[60px]")}>
          <a href="#main-content" className="skip-link bg-primary text-primary-foreground" data-testid="link-skip-nav">
            {t("shell.skipToContent")}
          </a>
          <header className="flex items-center gap-2 px-3 py-2 border-b sticky top-0 z-50 bg-background/95 backdrop-blur-md">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="shrink-0" />
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="font-bold text-sm tracking-wide uppercase leading-none select-none truncate">ThriveUp</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={openCommandPalette}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-2.5 h-8 rounded-lg border border-border/60 bg-muted/50 hover:bg-muted"
                data-testid="button-search-palette"
                aria-label={t("shell.searchAll")}
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">{t("shell.search")}</span>
                <kbd className="hidden md:flex h-4 items-center rounded border bg-background px-1 text-[10px] font-mono text-muted-foreground/70 select-none">⌘K</kbd>
              </Button>
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
      {mode === "hub" && <BottomTabBar />}
      <CommandPalette />
      <AINavigator />
      <ContextualHelpButton />
    </SidebarProvider>
  );
}

function AppLayout() {
  return (
    <NavModeProvider>
      <AppLayoutInner />
    </NavModeProvider>
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

function DemoFlagsHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    if (demo === "partners-on") {
      window.localStorage.setItem("tcaf_demo_partners", "1");
      window.dispatchEvent(new Event("tcaf-demo-partners-changed"));
      params.delete("demo");
      const q = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (q ? `?${q}` : "") + window.location.hash);
    } else if (demo === "partners-off") {
      window.localStorage.removeItem("tcaf_demo_partners");
      window.dispatchEvent(new Event("tcaf-demo-partners-changed"));
      params.delete("demo");
      const q = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (q ? `?${q}` : "") + window.location.hash);
    }
  }, []);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AccessibilityProvider>
          <BandwidthProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                {/* Toaster stays OUTSIDE the boundary so session-expiry / error
                    toasts still render even if the routed subtree crashes; the
                    boundary catches render errors inside the providers while it
                    (and the toaster) keep rendering. */}
                <ErrorBoundary>
                  <DemoFlagsHandler />
                  <OrgRedirectGuard />
                  <Switch>
                    <Route path="/presentation">
                      <PresentationLayout />
                    </Route>
                    <Route path="/childinc-deck">
                      <Suspense fallback={<div className="fixed inset-0 bg-slate-950" />}>
                        <ChildIncDeckPage />
                      </Suspense>
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
                </ErrorBoundary>
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
