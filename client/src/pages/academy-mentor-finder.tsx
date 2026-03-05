import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Briefcase,
  Heart,
  Building2,
  Users,
  Palette,
  UtensilsCrossed,
  ShoppingBag,
  Sparkles,
  ExternalLink,
  Search,
  Globe,
  Handshake,
  UserPlus,
  Send,
  User,
  Star,
  Scissors,
  FileText,
  Award,
  Shield,
  Accessibility,
  Flag,
  Clock,
} from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";

interface MentorProfile {
  id: string;
  name: string;
  title: string;
  organization: string | null;
  careerField: string;
  bio: string | null;
  expertise: string[] | null;
  availability: string | null;
  contactEmail: string | null;
  yearsExperience: number | null;
  isActive: boolean;
  createdAt: string;
}

const CATEGORY_CARDS = [
  {
    name: "Professional Services",
    url: "https://minoritycenterofexcellence.com/browse?category=Professional+Services",
    icon: Briefcase,
    count: "15,200+",
    color: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    name: "Health & Wellness",
    url: "https://minoritycenterofexcellence.com/browse?category=Health+%26+Wellness",
    icon: Heart,
    count: "12,400+",
    color: "bg-rose-100 dark:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    name: "Business Services",
    url: "https://minoritycenterofexcellence.com/browse?category=Business+Services",
    icon: Building2,
    count: "18,300+",
    color: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "Community Organizations",
    url: "https://minoritycenterofexcellence.com/browse?category=Community+Organization",
    icon: Users,
    count: "8,900+",
    color: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    name: "Arts & Entertainment",
    url: "https://minoritycenterofexcellence.com/browse?category=Arts+%26+Entertainment",
    icon: Palette,
    count: "9,600+",
    color: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    name: "Restaurants & Food",
    url: "https://minoritycenterofexcellence.com/browse?category=Restaurant",
    icon: UtensilsCrossed,
    count: "14,800+",
    color: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    name: "Retail & Shopping",
    url: "https://minoritycenterofexcellence.com/browse?category=Retail",
    icon: ShoppingBag,
    count: "11,200+",
    color: "bg-pink-100 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  {
    name: "Beauty & Skincare",
    url: "https://minoritycenterofexcellence.com/browse?category=Beauty+%26+Skincare",
    icon: Scissors,
    count: "10,500+",
    color: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
  },
];

const OWNERSHIP_CARDS = [
  {
    name: "Black-Owned",
    url: "https://minoritycenterofexcellence.com/browse?ownershipType=Black-Owned",
    icon: Star,
    color: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    name: "Hispanic/Latino-Owned",
    url: "https://minoritycenterofexcellence.com/browse?ownershipType=Hispanic%2FLatino-Owned",
    icon: Globe,
    color: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    name: "Asian-Owned",
    url: "https://minoritycenterofexcellence.com/browse?ownershipType=Asian-Owned",
    icon: Sparkles,
    color: "bg-sky-100 dark:bg-sky-900/30",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    name: "Women-Owned",
    url: "https://minoritycenterofexcellence.com/browse?ownershipType=Women-Owned",
    icon: Heart,
    color: "bg-pink-100 dark:bg-pink-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  {
    name: "Veteran-Owned",
    url: "https://minoritycenterofexcellence.com/browse?ownershipType=Veteran-Owned",
    icon: Shield,
    color: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "Native American-Owned",
    url: "https://minoritycenterofexcellence.com/browse?ownershipType=Native%20American-Owned",
    icon: Flag,
    color: "bg-teal-100 dark:bg-teal-900/30",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    name: "LGBTQ+-Owned",
    url: "https://minoritycenterofexcellence.com/browse?ownershipType=LGBTQ%2B-Owned",
    icon: Award,
    color: "bg-violet-100 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    name: "Disability-Owned",
    url: "https://minoritycenterofexcellence.com/browse?ownershipType=Disability-Owned",
    icon: Accessibility,
    color: "bg-indigo-100 dark:bg-indigo-900/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
];

const PARTNERSHIP_RESOURCES = [
  {
    name: "List Your Business on MCOE",
    url: "https://minoritycenterofexcellence.com/add-business",
    icon: UserPlus,
    description: "Register your minority-owned business in the national directory",
  },
  {
    name: "Find Government Contracts",
    url: "https://minoritycenterofexcellence.com/contracts",
    icon: FileText,
    description: "Access federal and state contracting opportunities",
  },
  {
    name: "Grant Opportunities",
    url: "https://minoritycenterofexcellence.com/grants",
    icon: Award,
    description: "Discover grants available for minority-owned businesses",
  },
  {
    name: "Professional Network",
    url: "https://minoritycenterofexcellence.com/network",
    icon: Users,
    description: "Join a network of minority professionals and entrepreneurs",
  },
  {
    name: "Start a Project",
    url: "https://minoritycenterofexcellence.com/start-project",
    icon: Sparkles,
    description: "Launch a collaborative project with community partners",
  },
];

const MENTOR_TYPES = [
  "Business Owner",
  "Professional",
  "Community Leader",
  "Educator",
  "Military/Public Service",
];

const CAREER_FIELDS = [
  "Technology",
  "Healthcare",
  "Business & Finance",
  "Arts & Design",
  "Education",
  "Engineering",
  "Law & Government",
  "Science & Research",
  "Media & Communications",
  "Sports & Recreation",
  "Social Services",
  "Trades & Construction",
];

const AVATAR_COLORS = [
  "bg-sky-200 dark:bg-sky-800",
  "bg-emerald-200 dark:bg-emerald-800",
  "bg-amber-200 dark:bg-amber-800",
  "bg-violet-200 dark:bg-violet-800",
  "bg-rose-200 dark:bg-rose-800",
  "bg-teal-200 dark:bg-teal-800",
];

function getAvailabilityBadge(availability: string | null) {
  switch (availability?.toLowerCase()) {
    case "available":
      return { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", label: "Available" };
    case "limited":
      return { className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", label: "Limited" };
    case "unavailable":
      return { className: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400", label: "Unavailable" };
    default:
      return { className: "", label: availability || "Unknown" };
  }
}

export default function AcademyMentorFinderPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [requestMentor, setRequestMentor] = useState<MentorProfile | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [mentorType, setMentorType] = useState("");
  const [careerInterest, setCareerInterest] = useState("");
  const [locationPref, setLocationPref] = useState("");
  const [outreachMessage, setOutreachMessage] = useState("");

  const { data: mentors, isLoading: mentorsLoading, isError: mentorsError, error: mentorsErrorObj, refetch: refetchMentors } = useQuery<MentorProfile[]>({
    queryKey: ["/api/mentors"],
  });

  const requestMutation = useMutation({
    mutationFn: async ({ mentorId, message }: { mentorId: string; message: string }) => {
      const res = await apiRequest("POST", "/api/mentors/request", { mentorId, message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentors/my-requests"] });
      setRequestMentor(null);
      setRequestMessage("");
      toast({ title: "Request Sent!", description: "Your mentor pairing request has been submitted for review." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const outreachMutation = useMutation({
    mutationFn: async (data: { mentorType: string; careerInterest: string; location: string; message: string }) => {
      const res = await apiRequest("POST", "/api/mentors/request", {
        mentorId: "outreach",
        message: `[Outreach Request]\nMentor Type: ${data.mentorType}\nCareer Interest: ${data.careerInterest}\nLocation: ${data.location}\n\n${data.message}`,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentors/my-requests"] });
      setMentorType("");
      setCareerInterest("");
      setLocationPref("");
      setOutreachMessage("");
      toast({ title: "Outreach Submitted!", description: "Your mentor outreach request has been submitted." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const activeMentors = (mentors ?? []).filter((m) => m.isActive);


  useEffect(() => { document.title = "Find a Mentor | AI Mastery Academy"; }, []);
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto" data-testid="academy-mentor-finder-page">
      <PageHeader
        title="Find a Mentor"
        breadcrumbs={[
          { label: "Academy", href: "/academy" },
          { label: "Mentor Finder" },
        ]}
      />
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-700 p-4 sm:p-6 lg:p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="rounded-md p-2.5 bg-white/10">
            <Handshake className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-mentor-finder-title">
            Find a Mentor & Partner
          </h1>
        </div>
        <p className="text-rose-100 text-base sm:text-lg mb-2" data-testid="text-mentor-finder-subtitle">
          Connect with local professionals, businesses, and organizations through the Minority Center of Excellence network
        </p>
        <p className="text-rose-200 text-sm" data-testid="text-mentor-finder-description">
          Discover role models, mentors, and community partners who represent your career interests and share your values
        </p>
      </div>

      <div className="mb-10" data-testid="section-category-search">
        <div className="flex items-center gap-2 mb-5">
          <Search className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Browse by Category</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORY_CARDS.map((cat) => {
            const kebab = cat.name.toLowerCase().replace(/[&\s/]+/g, "-");
            return (
              <Card key={cat.name} className="p-4" data-testid={`card-category-${kebab}`}>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`rounded-md p-2.5 ${cat.color}`}>
                    <cat.icon className={`h-5 w-5 ${cat.iconColor}`} />
                  </div>
                  <p className="font-medium text-sm">{cat.name}</p>
                  <Badge variant="secondary">{cat.count} businesses</Badge>
                  <a
                    href={cat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`link-category-${kebab}`}
                  >
                    <Button variant="outline" size="sm" data-testid={`button-browse-category-${kebab}`}>
                      Browse <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mb-10" data-testid="section-ownership-browse">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Browse by Ownership Type</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {OWNERSHIP_CARDS.map((own) => {
            const kebab = own.name.toLowerCase().replace(/[+/\s]+/g, "-");
            return (
              <a
                key={own.name}
                href={own.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`link-ownership-${kebab}`}
              >
                <Card className="p-4 hover-elevate cursor-pointer h-full" data-testid={`card-ownership-${kebab}`}>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-2 shrink-0 ${own.color}`}>
                      <own.icon className={`h-4 w-4 ${own.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{own.name}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      </div>

      <div className="mb-10" data-testid="section-mentor-outreach">
        <div className="flex items-center gap-2 mb-5">
          <Handshake className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Mentor Outreach</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4 sm:p-6" data-testid="card-outreach-form">
            <h3 className="font-semibold mb-4">Submit a Mentor Request</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Student Name</label>
                <Input
                  value={user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : ""}
                  disabled
                  placeholder="Sign in to auto-fill"
                  data-testid="input-student-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Career Interest</label>
                <Select value={careerInterest} onValueChange={setCareerInterest}>
                  <SelectTrigger data-testid="select-career-interest">
                    <SelectValue placeholder="Select a career field" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAREER_FIELDS.map((field) => (
                      <SelectItem key={field} value={field} data-testid={`option-career-${field.toLowerCase().replace(/\s+/g, "-")}`}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Preferred Mentor Type</label>
                <Select value={mentorType} onValueChange={setMentorType}>
                  <SelectTrigger data-testid="select-mentor-type">
                    <SelectValue placeholder="Select mentor type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MENTOR_TYPES.map((type) => (
                      <SelectItem key={type} value={type} data-testid={`option-type-${type.toLowerCase().replace(/[\s/]+/g, "-")}`}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Location Preference</label>
                <Input
                  value={locationPref}
                  onChange={(e) => setLocationPref(e.target.value)}
                  placeholder="e.g., Dallas, TX or Remote"
                  data-testid="input-location-pref"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">What I'd Like to Learn</label>
                <Textarea
                  value={outreachMessage}
                  onChange={(e) => setOutreachMessage(e.target.value)}
                  placeholder="Tell us about your goals and what you'd like to learn from a mentor..."
                  className="resize-none"
                  data-testid="input-outreach-message"
                />
              </div>
              <Button
                className="w-full"
                disabled={!careerInterest || !mentorType || !outreachMessage.trim() || outreachMutation.isPending}
                onClick={() =>
                  outreachMutation.mutate({
                    mentorType,
                    careerInterest,
                    location: locationPref,
                    message: outreachMessage,
                  })
                }
                data-testid="button-submit-outreach"
              >
                <Send className="h-4 w-4 mr-1" />
                {outreachMutation.isPending ? "Submitting..." : "Submit Outreach Request"}
              </Button>
            </div>
          </Card>

          <div data-testid="section-available-mentors">
            <h3 className="font-semibold mb-4">Available Mentors</h3>
            {mentorsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : mentorsError ? (
              <ErrorRetry message={mentorsErrorObj instanceof Error ? mentorsErrorObj.message : "Failed to load mentors. Please try again."} onRetry={refetchMentors} />
            ) : activeMentors.length > 0 ? (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {activeMentors.map((mentor, idx) => {
                  const availBadge = getAvailabilityBadge(mentor.availability);
                  const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  return (
                    <Card key={mentor.id} className="p-4" data-testid={`card-mentor-${mentor.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${avatarColor}`}>
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm truncate" data-testid={`text-mentor-name-${mentor.id}`}>
                            {mentor.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {mentor.title}{mentor.organization ? ` at ${mentor.organization}` : ""}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-[10px]">
                              <Briefcase className="h-2.5 w-2.5 mr-0.5" />
                              {mentor.careerField}
                            </Badge>
                            <Badge variant="secondary" className={`text-[10px] ${availBadge.className}`}>
                              {availBadge.label}
                            </Badge>
                          </div>
                        </div>
                        {mentor.availability?.toLowerCase() !== "unavailable" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRequestMentor(mentor);
                              setRequestMessage("");
                            }}
                            data-testid={`button-request-mentor-${mentor.id}`}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center" data-testid="card-no-mentors">
                <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">No mentors available yet. Check back soon!</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="mb-10" data-testid="section-partnership-resources">
        <div className="flex items-center gap-2 mb-5">
          <Briefcase className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Partnership Resources</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PARTNERSHIP_RESOURCES.map((res) => {
            const kebab = res.name.toLowerCase().replace(/\s+/g, "-");
            return (
              <a
                key={res.name}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`link-resource-${kebab}`}
              >
                <Card className="p-5 hover-elevate cursor-pointer h-full" data-testid={`card-resource-${kebab}`}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-md p-2 bg-muted shrink-0">
                      <res.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm mb-1">{res.name}</p>
                      <p className="text-xs text-muted-foreground">{res.description}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      </div>

      <Card className="p-6 mb-10" data-testid="section-stats-banner">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div data-testid="stat-businesses">
            <p className="text-2xl font-bold">111,986+</p>
            <p className="text-sm text-muted-foreground">Businesses Listed</p>
          </div>
          <div data-testid="stat-categories">
            <p className="text-2xl font-bold">10</p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </div>
          <div data-testid="stat-states">
            <p className="text-2xl font-bold">52</p>
            <p className="text-sm text-muted-foreground">States + DC & PR</p>
          </div>
          <div data-testid="stat-ownership-groups">
            <p className="text-2xl font-bold">10</p>
            <p className="text-sm text-muted-foreground">Ownership Groups</p>
          </div>
        </div>
      </Card>

      <div className="rounded-md bg-gradient-to-r from-rose-900 to-red-700 p-6 text-center" data-testid="section-footer-cta">
        <p className="text-rose-100 text-sm mb-2">Powered by partnership with</p>
        <a
          href="https://minoritycenterofexcellence.com"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-mcoe-main"
        >
          <p className="text-white text-xl font-bold mb-3">Minority Center of Excellence</p>
        </a>
        <a
          href="https://minoritycenterofexcellence.com"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-mcoe-visit"
        >
          <Button variant="outline" className="bg-white/10 border-white/20 text-white backdrop-blur-sm" data-testid="button-visit-mcoe">
            Visit MCOE <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </Button>
        </a>
      </div>

      <Dialog open={!!requestMentor} onOpenChange={() => setRequestMentor(null)}>
        <DialogContent data-testid="dialog-request-mentor">
          {requestMentor && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="text-dialog-mentor-name">
                  Request Pairing with {requestMentor.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {requestMentor.title}
                  {requestMentor.organization ? ` at ${requestMentor.organization}` : ""}
                </p>
                {requestMentor.bio && (
                  <p className="text-sm text-muted-foreground">{requestMentor.bio}</p>
                )}
                <div>
                  <label className="text-sm font-medium mb-1 block">Message</label>
                  <Textarea
                    placeholder="Tell this mentor why you'd like to connect..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="resize-none"
                    data-testid="input-request-message"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => setRequestMentor(null)}
                    data-testid="button-cancel-request"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      requestMutation.mutate({
                        mentorId: requestMentor.id,
                        message: requestMessage,
                      })
                    }
                    disabled={!requestMessage.trim() || requestMutation.isPending}
                    data-testid="button-submit-request"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {requestMutation.isPending ? "Sending..." : "Send Request"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
