import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Trophy, Star, Medal, Crown, Gamepad2, Brain, BookOpen,
  Users, Calendar, Award, Target, Zap, Hash, Sparkles, Plus,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AcademyCompetition, AcademyCompetitionEntry } from "@shared/schema";

const createCompetitionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["academic", "cultural"]),
  category: z.enum(["virtual", "in-person"]),
  description: z.string().min(1, "Description is required"),
  maxParticipants: z.coerce.number().min(1).default(60),
  prizePoints: z.coerce.number().min(1).default(100),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type CreateCompetitionForm = z.infer<typeof createCompetitionSchema>;

const statusColors: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const typeColors: Record<string, string> = {
  academic: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  cultural: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const categoryColors: Record<string, string> = {
  virtual: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "in-person": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

const featuredGames = [
  { name: "Number Challenge", description: "Quick mental math", icon: Hash, color: "from-blue-500 to-indigo-600" },
  { name: "Word Builder", description: "Vocabulary and spelling", icon: BookOpen, color: "from-emerald-500 to-teal-600" },
  { name: "Trivia Quest", description: "General knowledge", icon: Brain, color: "from-purple-500 to-violet-600" },
  { name: "Pattern Master", description: "Logic and patterns", icon: Target, color: "from-orange-500 to-red-600" },
];

function placementLabel(placement: number): string {
  if (placement === 1) return "1st";
  if (placement === 2) return "2nd";
  if (placement === 3) return "3rd";
  return `${placement}th`;
}

function PlacementIcon({ placement }: { placement: number }) {
  if (placement === 1) return <Crown className="h-4 w-4 text-amber-500" />;
  if (placement === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (placement === 3) return <Medal className="h-4 w-4 text-amber-700" />;
  return null;
}

function CompetitionCard({
  competition,
  onEnter,
  isEntering,
  onViewResults,
}: {
  competition: AcademyCompetition;
  onEnter: (id: string) => void;
  isEntering: boolean;
  onViewResults: (id: string) => void;
}) {
  const entryCount = (competition as any)._entryCount ?? 0;
  return (
    <Card className="p-5" data-testid={`card-competition-${competition.id}`}>
      <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
        <h3 className="font-semibold text-base" data-testid={`text-competition-name-${competition.id}`}>
          {competition.name}
        </h3>
        <Badge
          variant="secondary"
          className={`text-xs no-default-hover-elevate no-default-active-elevate ${statusColors[competition.status] || ""}`}
          data-testid={`badge-status-${competition.id}`}
        >
          {competition.status}
        </Badge>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Badge
          variant="secondary"
          className={`text-xs no-default-hover-elevate no-default-active-elevate ${typeColors[competition.type] || ""}`}
          data-testid={`badge-type-${competition.id}`}
        >
          {competition.type}
        </Badge>
        <Badge
          variant="secondary"
          className={`text-xs no-default-hover-elevate no-default-active-elevate ${categoryColors[competition.category] || ""}`}
          data-testid={`badge-category-${competition.id}`}
        >
          {competition.category}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-4" data-testid={`text-description-${competition.id}`}>
        {competition.description}
      </p>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span data-testid={`text-participants-${competition.id}`}>
            {entryCount} / {competition.maxParticipants} participants
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Star className="h-3.5 w-3.5 shrink-0" />
          <span data-testid={`text-prize-${competition.id}`}>
            {competition.prizePoints} prize points
          </span>
        </div>
        {competition.startDate && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span data-testid={`text-dates-${competition.id}`}>
              {new Date(competition.startDate).toLocaleDateString()}
              {competition.endDate && ` - ${new Date(competition.endDate).toLocaleDateString()}`}
            </span>
          </div>
        )}
      </div>

      {competition.status === "completed" ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onViewResults(competition.id)}
          data-testid={`button-view-results-${competition.id}`}
        >
          <Trophy className="h-3.5 w-3.5 mr-1.5" />
          View Results
        </Button>
      ) : (
        <Button
          size="sm"
          className="w-full"
          onClick={() => onEnter(competition.id)}
          disabled={isEntering}
          data-testid={`button-enter-${competition.id}`}
        >
          <Zap className="h-3.5 w-3.5 mr-1.5" />
          Enter
        </Button>
      )}
    </Card>
  );
}

function LeaderboardSection({ competitionId }: { competitionId: string }) {
  const { data: entries, isLoading } = useQuery<AcademyCompetitionEntry[]>({
    queryKey: ["/api/academy/competitions", competitionId, "entries"],
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  const sorted = (entries || [])
    .filter((e) => e.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No results yet for this competition.
      </p>
    );
  }

  return (
    <div className="space-y-1.5" data-testid="leaderboard-list">
      <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-2 px-3 py-1.5 text-xs text-muted-foreground font-medium">
        <span>Rank</span>
        <span>Name</span>
        <span className="text-right">Score</span>
        <span className="text-right">Place</span>
      </div>
      {sorted.map((entry, idx) => (
        <div
          key={entry.id}
          className={`grid grid-cols-[2.5rem_1fr_4rem_4rem] gap-2 px-3 py-2 rounded-md items-center ${
            idx < 3 ? "bg-accent/50" : ""
          }`}
          data-testid={`leaderboard-row-${idx}`}
        >
          <div className="flex items-center gap-1">
            <PlacementIcon placement={idx + 1} />
            <span className="text-sm font-medium">{idx + 1}</span>
          </div>
          <span className="text-sm truncate">{entry.userName}</span>
          <span className="text-sm text-right font-medium">{entry.score ?? "-"}</span>
          <span className="text-sm text-right">
            {entry.placement ? placementLabel(entry.placement) : "-"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AcademyCompetitionsPage() {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: competitions, isLoading } = useQuery<AcademyCompetition[]>({
    queryKey: ["/api/academy/competitions"],
  });

  const enterMutation = useMutation({
    mutationFn: async (competitionId: string) => {
      await apiRequest("POST", `/api/academy/competitions/${competitionId}/enter`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/competitions"] });
      toast({ title: "Entered competition successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to enter competition", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateCompetitionForm) => {
      const body: any = { ...data };
      if (data.startDate) body.startDate = new Date(data.startDate).toISOString();
      if (data.endDate) body.endDate = new Date(data.endDate).toISOString();
      await apiRequest("POST", "/api/academy/competitions", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/competitions"] });
      toast({ title: "Competition created" });
      setShowCreateForm(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create competition", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm<CreateCompetitionForm>({
    resolver: zodResolver(createCompetitionSchema),
    defaultValues: {
      name: "",
      type: "academic",
      category: "virtual",
      description: "",
      maxParticipants: 60,
      prizePoints: 100,
      startDate: "",
      endDate: "",
    },
  });

  const filtered = (competitions || []).filter((c) => {
    if (typeFilter !== "all") {
      if (typeFilter === "academic" && c.type !== "academic") return false;
      if (typeFilter === "cultural" && c.type !== "cultural") return false;
      if (typeFilter === "virtual" && c.category !== "virtual") return false;
      if (typeFilter === "in-person" && c.category !== "in-person") return false;
    }
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const completedCompetitions = (competitions || []).filter((c) => c.status === "completed");

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" data-testid="page-competitions">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Trophy className="h-7 w-7 text-amber-500 shrink-0" />
              Competition Circuit
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-page-subtitle">
              Academic and cultural challenges - compete, learn, and earn
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} data-testid="button-toggle-create-form">
            <Plus className="h-4 w-4 mr-1.5" />
            Create Competition
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card className="p-6 mb-6" data-testid="card-create-competition">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            New Competition
          </h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Competition name" {...field} data-testid="input-comp-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-comp-type">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="cultural">Cultural</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-comp-category">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="virtual">Virtual</SelectItem>
                          <SelectItem value="in-person">In-Person</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Participants</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-comp-max-participants" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prizePoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prize Points</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-comp-prize-points" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-comp-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-comp-end-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the competition..." {...field} data-testid="textarea-comp-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-create-competition">
                {createMutation.isPending ? "Creating..." : "Create Competition"}
              </Button>
            </form>
          </Form>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-full sm:w-auto">
          <TabsList data-testid="tabs-type-filter">
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="academic" data-testid="tab-academic">Academic</TabsTrigger>
            <TabsTrigger value="cultural" data-testid="tab-cultural">Cultural</TabsTrigger>
            <TabsTrigger value="virtual" data-testid="tab-virtual">Virtual</TabsTrigger>
            <TabsTrigger value="in-person" data-testid="tab-in-person">In-Person</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center" data-testid="empty-competitions">
          <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No competitions found matching your filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8" data-testid="competitions-grid">
          {filtered.map((comp) => (
            <CompetitionCard
              key={comp.id}
              competition={comp}
              onEnter={(id) => enterMutation.mutate(id)}
              isEntering={enterMutation.isPending}
              onViewResults={(id) => setSelectedCompetitionId(id === selectedCompetitionId ? null : id)}
            />
          ))}
        </div>
      )}

      {selectedCompetitionId && (
        <Card className="p-6 mb-8" data-testid="card-leaderboard">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Leaderboard
          </h2>
          <LeaderboardSection competitionId={selectedCompetitionId} />
        </Card>
      )}

      {completedCompetitions.length > 0 && !selectedCompetitionId && (
        <Card className="p-6 mb-8" data-testid="card-completed-leaderboards">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Recent Leaderboards
          </h2>
          <p className="text-sm text-muted-foreground">
            Click "View Results" on a completed competition to see its leaderboard.
          </p>
        </Card>
      )}

      <Card className="p-6 mb-8" data-testid="card-featured-games">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Featured Games
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Virtual competition game modes - test your skills
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredGames.map((game) => {
            const GameIcon = game.icon;
            return (
              <Card key={game.name} className="p-4 hover-elevate cursor-pointer" data-testid={`card-game-${game.name.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`w-12 h-12 rounded-md bg-gradient-to-br ${game.color} flex items-center justify-center shrink-0`}>
                    <GameIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{game.name}</p>
                    <p className="text-xs text-muted-foreground">{game.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs no-default-hover-elevate no-default-active-elevate">
                    Coming Soon
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <Card className="p-6" data-testid="card-competition-history">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Your Competition History
        </h2>
        <CompetitionHistoryTable competitions={competitions || []} />
      </Card>
    </div>
  );
}

function CompetitionHistoryTable({ competitions }: { competitions: AcademyCompetition[] }) {
  const allIds = competitions.map((c) => c.id);
  const entryQueries = allIds.map((id) => ({
    queryKey: ["/api/academy/competitions", id, "entries"],
  }));

  const { data: allEntries, isLoading } = useQuery<AcademyCompetitionEntry[]>({
    queryKey: ["/api/academy/competitions", "all-entries"],
    queryFn: async () => {
      if (allIds.length === 0) return [];
      const results = await Promise.all(
        allIds.map(async (id) => {
          try {
            const res = await fetch(`/api/academy/competitions/${id}/entries`, { credentials: "include" });
            if (!res.ok) return [];
            return (await res.json()) as AcademyCompetitionEntry[];
          } catch {
            return [];
          }
        })
      );
      return results.flat();
    },
    enabled: allIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    );
  }

  const userEntries = allEntries || [];

  if (userEntries.length === 0) {
    return (
      <div className="text-center py-6">
        <Trophy className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">
          You haven't entered any competitions yet. Join one above to get started!
        </p>
      </div>
    );
  }

  const competitionMap = new Map(competitions.map((c) => [c.id, c]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Competition</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Score</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Placement</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Date</th>
          </tr>
        </thead>
        <tbody>
          {userEntries.map((entry, idx) => {
            const comp = competitionMap.get(entry.competitionId);
            return (
              <tr key={entry.id} className="border-b last:border-b-0" data-testid={`history-row-${idx}`}>
                <td className="py-2 px-3">{comp?.name || "Unknown"}</td>
                <td className="py-2 px-3">
                  <Badge
                    variant="secondary"
                    className={`text-xs no-default-hover-elevate no-default-active-elevate ${typeColors[comp?.type || ""] || ""}`}
                  >
                    {comp?.type || "-"}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-right font-medium">{entry.score ?? "-"}</td>
                <td className="py-2 px-3 text-right">
                  <span className="flex items-center justify-end gap-1">
                    {entry.placement && <PlacementIcon placement={entry.placement} />}
                    {entry.placement ? placementLabel(entry.placement) : "-"}
                  </span>
                </td>
                <td className="py-2 px-3 text-right text-muted-foreground">
                  {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
