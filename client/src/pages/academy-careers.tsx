import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Briefcase,
  GraduationCap,
  Wrench,
  Shield,
  Rocket,
  Search,
  Star,
  BookmarkPlus,
  Bookmark,
  Award,
  ChevronRight,
} from "lucide-react";

interface CareerField {
  id: string;
  name: string;
  category: string;
  description: string;
  educationPath: string;
  salaryRange: string | null;
  requiredSkills: string[] | null;
  relatedSubjects: string[] | null;
  gradeLevel: string | null;
  iconName: string | null;
  sortOrder: number | null;
}

interface CareerMilestone {
  id: string;
  gradeLevel: number;
  title: string;
  description: string;
  category: string;
  awardName: string | null;
  awardDescription: string | null;
  requirements: string | null;
  sortOrder: number | null;
}

const CATEGORIES = ["All", "College", "Trade/Tech", "Military", "Entrepreneurship"];

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "college": return GraduationCap;
    case "trade/tech": return Wrench;
    case "military": return Shield;
    case "entrepreneurship": return Rocket;
    default: return Briefcase;
  }
}

function getCategoryColor(category: string) {
  switch (category.toLowerCase()) {
    case "college": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "trade/tech": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "military": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "entrepreneurship": return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
    default: return "";
  }
}

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-36 w-full rounded-md" />
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>
      <Skeleton className="h-9 w-full max-w-sm" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}

export default function AcademyCareersPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<CareerField | null>(null);

  const { data: careers, isLoading: careersLoading } = useQuery<CareerField[]>({
    queryKey: ["/api/careers"],
  });

  const { data: milestones, isLoading: milestonesLoading } = useQuery<CareerMilestone[]>({
    queryKey: ["/api/career-milestones"],
  });

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  if (careersLoading) {
    return <LoadingSkeleton />;
  }

  const allCareers = careers ?? [];
  const allMilestones = milestones ?? [];

  const filteredCareers = allCareers.filter((c) => {
    const matchesCategory =
      activeCategory === "All" ||
      c.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const bookmarkedCareers = allCareers.filter((c) => bookmarked.includes(c.id));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto" data-testid="academy-careers-page">
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-700 p-4 sm:p-6 lg:p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="rounded-md p-2.5 bg-white/10">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-careers-title">
            Career Explorer
          </h1>
        </div>
        <p className="text-rose-100 text-base sm:text-lg" data-testid="text-careers-subtitle">
          Discover Your Future Path
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap" data-testid="section-category-filters">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={activeCategory === cat ? "default" : "outline"}
            onClick={() => setActiveCategory(cat)}
            data-testid={`button-filter-${cat.toLowerCase().replace("/", "-")}`}
            className="toggle-elevate"
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="relative mb-6 w-full sm:max-w-sm" data-testid="section-search">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search careers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-careers"
        />
      </div>

      {filteredCareers.length > 0 ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          data-testid="section-career-grid"
        >
          {filteredCareers.map((career) => {
            const IconComp = getCategoryIcon(career.category);
            const isBookmarked = bookmarked.includes(career.id);
            return (
              <Card
                key={career.id}
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => setSelectedCareer(career)}
                data-testid={`card-career-${career.id}`}
              >
                <div className="flex items-start justify-between gap-1 mb-3">
                  <div className="rounded-md p-2 bg-rose-100 dark:bg-rose-900/30 shrink-0">
                    <IconComp className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(career.id);
                    }}
                    data-testid={`button-bookmark-${career.id}`}
                  >
                    {isBookmarked ? (
                      <Bookmark className="h-4 w-4 text-amber-500" />
                    ) : (
                      <BookmarkPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <h3
                  className="font-semibold text-sm mb-1"
                  data-testid={`text-career-name-${career.id}`}
                >
                  {career.name}
                </h3>
                <Badge
                  variant="secondary"
                  className={`mb-2 ${getCategoryColor(career.category)}`}
                  data-testid={`badge-category-${career.id}`}
                >
                  {career.category}
                </Badge>
                <p
                  className="text-xs text-muted-foreground line-clamp-3 mb-3"
                  data-testid={`text-career-desc-${career.id}`}
                >
                  {career.description}
                </p>
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate" data-testid={`text-education-${career.id}`}>
                      {career.educationPath}
                    </span>
                  </div>
                  {career.salaryRange && (
                    <p className="text-xs text-muted-foreground" data-testid={`text-salary-${career.id}`}>
                      {career.salaryRange}
                    </p>
                  )}
                </div>
                {career.requiredSkills && career.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1" data-testid={`section-skills-${career.id}`}>
                    {career.requiredSkills.slice(0, 3).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="text-[10px] px-1.5"
                        data-testid={`badge-skill-${career.id}-${skill}`}
                      >
                        {skill}
                      </Badge>
                    ))}
                    {career.requiredSkills.length > 3 && (
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        +{career.requiredSkills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center mb-8" data-testid="card-no-careers">
          <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No careers found matching your criteria.</p>
        </Card>
      )}

      {bookmarkedCareers.length > 0 && (
        <div className="mb-8" data-testid="section-my-interests">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" /> My Interests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bookmarkedCareers.map((career) => {
              const IconComp = getCategoryIcon(career.category);
              return (
                <Card
                  key={career.id}
                  className="p-4 hover-elevate cursor-pointer"
                  onClick={() => setSelectedCareer(career)}
                  data-testid={`card-bookmarked-${career.id}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30 shrink-0">
                      <IconComp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold text-sm truncate" data-testid={`text-bookmarked-name-${career.id}`}>
                      {career.name}
                    </h3>
                  </div>
                  <Badge
                    variant="secondary"
                    className={getCategoryColor(career.category)}
                    data-testid={`badge-bookmarked-category-${career.id}`}
                  >
                    {career.category}
                  </Badge>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div data-testid="section-milestones">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-muted-foreground" /> Grade-Level Milestones
        </h2>
        {milestonesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : allMilestones.length > 0 ? (
          <div className="space-y-3">
            {allMilestones.map((milestone) => (
              <Card key={milestone.id} className="p-4" data-testid={`card-milestone-${milestone.id}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-md p-2 bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                    <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm" data-testid={`text-milestone-title-${milestone.id}`}>
                        {milestone.title}
                      </h3>
                      <Badge variant="secondary" data-testid={`badge-milestone-grade-${milestone.id}`}>
                        Grade {milestone.gradeLevel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2" data-testid={`text-milestone-desc-${milestone.id}`}>
                      {milestone.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]" data-testid={`badge-milestone-category-${milestone.id}`}>
                        {milestone.category}
                      </Badge>
                      {milestone.awardName && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" />
                          {milestone.awardName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center" data-testid="card-no-milestones">
            <Award className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No milestones available yet.</p>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedCareer} onOpenChange={() => setSelectedCareer(null)}>
        <DialogContent data-testid="dialog-career-details">
          {selectedCareer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2" data-testid="text-dialog-career-name">
                  {(() => {
                    const IconComp = getCategoryIcon(selectedCareer.category);
                    return <IconComp className="h-5 w-5" />;
                  })()}
                  {selectedCareer.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Badge
                  variant="secondary"
                  className={getCategoryColor(selectedCareer.category)}
                  data-testid="badge-dialog-category"
                >
                  {selectedCareer.category}
                </Badge>
                <p className="text-sm text-muted-foreground" data-testid="text-dialog-description">
                  {selectedCareer.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm" data-testid="text-dialog-education">
                      {selectedCareer.educationPath}
                    </span>
                  </div>
                  {selectedCareer.salaryRange && (
                    <p className="text-sm" data-testid="text-dialog-salary">
                      Salary: {selectedCareer.salaryRange}
                    </p>
                  )}
                  {selectedCareer.gradeLevel && (
                    <p className="text-sm text-muted-foreground" data-testid="text-dialog-grade">
                      Grade Level: {selectedCareer.gradeLevel}
                    </p>
                  )}
                </div>
                {selectedCareer.requiredSkills && selectedCareer.requiredSkills.length > 0 && (
                  <div data-testid="section-dialog-skills">
                    <p className="text-sm font-medium mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedCareer.requiredSkills.map((skill) => (
                        <Badge key={skill} variant="outline" data-testid={`badge-dialog-skill-${skill}`}>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedCareer.relatedSubjects && selectedCareer.relatedSubjects.length > 0 && (
                  <div data-testid="section-dialog-subjects">
                    <p className="text-sm font-medium mb-2">Related Subjects</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedCareer.relatedSubjects.map((subj) => (
                        <Badge key={subj} variant="secondary" data-testid={`badge-dialog-subject-${subj}`}>
                          {subj}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => {
                      toggleBookmark(selectedCareer.id);
                    }}
                    data-testid="button-dialog-bookmark"
                  >
                    {bookmarked.includes(selectedCareer.id) ? (
                      <>
                        <Bookmark className="h-4 w-4 mr-1 text-amber-500" />
                        Bookmarked
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="h-4 w-4 mr-1" />
                        Add to Interests
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCareer(null)}
                    data-testid="button-dialog-close"
                  >
                    Close
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
