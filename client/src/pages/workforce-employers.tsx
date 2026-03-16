import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { EmployerPartner, JobPosting } from "@shared/schema";
import { PageHeader } from "@/components/page-header";
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
  Building2,
  Search,
  Shield,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  Handshake,
  CheckCircle2,
  Briefcase,
  DollarSign,
  Clock,
  Users,
  Star,
} from "lucide-react";

export default function WorkforceEmployersPage() {
  const [search, setSearch] = useState("");
  const [fairChanceOnly, setFairChanceOnly] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerPartner | null>(null);
  const [selectedPosting, setSelectedPosting] = useState<JobPosting | null>(null);

  const { data: employers, isLoading: loadingEmployers } = useQuery<EmployerPartner[]>({
    queryKey: ["/api/workforce/employers"],
  });

  const { data: jobPostings, isLoading: loadingPostings } = useQuery<JobPosting[]>({
    queryKey: ["/api/workforce/job-postings"],
  });

  const filteredEmployers = (employers || []).filter(emp => {
    if (search && !emp.companyName.toLowerCase().includes(search.toLowerCase()) && !emp.industry?.toLowerCase().includes(search.toLowerCase())) return false;
    if (fairChanceOnly && !emp.fairChanceHiring) return false;
    return true;
  });

  const filteredPostings = (jobPostings || []).filter(posting => {
    if (search && !posting.title.toLowerCase().includes(search.toLowerCase()) && !posting.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loadingEmployers) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" data-testid="section-workforce-employers">
      <PageHeader
        title="Employer Partners & Job Board"
        description="Connect with barrier-friendly employers and find job opportunities"
        icon={<Building2 className="h-7 w-7" />}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employers or job postings..."
            className="pl-9"
            data-testid="input-search-employers"
          />
        </div>
        <Badge
          variant={fairChanceOnly ? "default" : "outline"}
          className={`cursor-pointer shrink-0 ${fairChanceOnly ? "bg-emerald-600 text-white" : ""}`}
          onClick={() => setFairChanceOnly(!fairChanceOnly)}
          data-testid="filter-fair-chance"
        >
          <Shield className="h-3 w-3 mr-1" /> Fair Chance Employers
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" data-testid="section-employer-stats">
        <Card className="p-4" data-testid="card-stat-employers">
          <p className="text-xs text-muted-foreground">Employer Partners</p>
          <p className="text-2xl font-bold">{(employers || []).length}</p>
        </Card>
        <Card className="p-4" data-testid="card-stat-fair-chance">
          <p className="text-xs text-muted-foreground">Fair Chance Employers</p>
          <p className="text-2xl font-bold">{(employers || []).filter((e) => e.fairChanceHiring).length}</p>
        </Card>
        <Card className="p-4" data-testid="card-stat-openings">
          <p className="text-xs text-muted-foreground">Open Positions</p>
          <p className="text-2xl font-bold">{(jobPostings || []).length}</p>
        </Card>
      </div>

      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2" data-testid="text-employer-heading">
        <Handshake className="h-5 w-5" /> Employer Partners
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" data-testid="section-employer-grid">
        {filteredEmployers.map((employer) => (
          <Card
            key={employer.id}
            className="p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedEmployer(employer)}
            data-testid={`card-employer-${employer.id}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-sm" data-testid={`text-employer-name-${employer.id}`}>{employer.companyName}</h3>
                <p className="text-xs text-muted-foreground">{employer.industry}</p>
              </div>
              {employer.fairChanceHiring && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shrink-0 text-xs">
                  <Shield className="h-3 w-3 mr-1" /> Fair Chance
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{employer.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {employer.banTheBox && <Badge variant="outline" className="text-xs">Ban the Box</Badge>}
              {employer.barrierFriendly && <Badge variant="outline" className="text-xs">Barrier-Friendly</Badge>}
              {employer.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {employer.location}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredEmployers.length === 0 && (
        <Card className="p-8 text-center mb-8" data-testid="card-no-employers">
          <Building2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No employer partners found matching your search.</p>
        </Card>
      )}

      {(filteredPostings || []).length > 0 && (
        <>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2" data-testid="text-postings-heading">
            <Briefcase className="h-5 w-5" /> Open Positions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="section-postings-grid">
            {filteredPostings.map((posting) => {
              const employer = (employers || []).find((e) => e.id === posting.employerId);
              return (
                <Card
                  key={posting.id}
                  className="p-5 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPosting(posting)}
                  data-testid={`card-posting-${posting.id}`}
                >
                  <h3 className="font-semibold text-sm mb-1" data-testid={`text-posting-title-${posting.id}`}>{posting.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{employer?.companyName || "Employer"}</p>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{posting.description}</p>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    {posting.wageRange && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{posting.wageRange}</span>}
                    {posting.hoursPerWeek && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{posting.hoursPerWeek}</span>}
                    {posting.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{posting.location}</span>}
                  </div>
                  {posting.barrierFriendly && (
                    <Badge variant="secondary" className="mt-2 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      <Shield className="h-3 w-3 mr-1" /> Barrier-Friendly Position
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={!!selectedEmployer} onOpenChange={() => setSelectedEmployer(null)}>
        <DialogContent className="max-w-lg" data-testid="dialog-employer-detail">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-employer-name">{selectedEmployer?.companyName}</DialogTitle>
          </DialogHeader>
          {selectedEmployer && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedEmployer.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Industry</p>
                  <p className="text-sm font-medium">{selectedEmployer.industry}</p>
                </div>
                {selectedEmployer.location && (
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{selectedEmployer.location}</p>
                  </div>
                )}
                {selectedEmployer.contactName && (
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="text-sm font-medium">{selectedEmployer.contactName}</p>
                  </div>
                )}
              </div>
              {selectedEmployer.hiringCommitments && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Hiring Commitments</p>
                  <p className="text-sm">{selectedEmployer.hiringCommitments}</p>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedEmployer.banTheBox && <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Ban the Box</Badge>}
                {selectedEmployer.fairChanceHiring && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><Shield className="h-3 w-3 mr-1" />Fair Chance Hiring</Badge>}
                {selectedEmployer.barrierFriendly && <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Barrier-Friendly</Badge>}
              </div>
              {selectedEmployer.website && (
                <a href={selectedEmployer.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" data-testid="button-visit-employer-website">
                    <ExternalLink className="h-3 w-3 mr-1" /> Visit Website
                  </Button>
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPosting} onOpenChange={() => setSelectedPosting(null)}>
        <DialogContent className="max-w-lg" data-testid="dialog-posting-detail">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-posting-title">{selectedPosting?.title}</DialogTitle>
          </DialogHeader>
          {selectedPosting && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedPosting.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {selectedPosting.wageRange && (
                  <div>
                    <p className="text-xs text-muted-foreground">Wage Range</p>
                    <p className="text-sm font-medium">{selectedPosting.wageRange}</p>
                  </div>
                )}
                {selectedPosting.hoursPerWeek && (
                  <div>
                    <p className="text-xs text-muted-foreground">Hours</p>
                    <p className="text-sm font-medium">{selectedPosting.hoursPerWeek}</p>
                  </div>
                )}
                {selectedPosting.location && (
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{selectedPosting.location}</p>
                  </div>
                )}
                {selectedPosting.benefits && (
                  <div>
                    <p className="text-xs text-muted-foreground">Benefits</p>
                    <p className="text-sm font-medium">{selectedPosting.benefits}</p>
                  </div>
                )}
              </div>
              {selectedPosting.requirements && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Requirements</p>
                  <p className="text-sm">{selectedPosting.requirements}</p>
                </div>
              )}
              {selectedPosting.barrierFriendly && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  <Shield className="h-3 w-3 mr-1" /> Barrier-Friendly Position
                </Badge>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
