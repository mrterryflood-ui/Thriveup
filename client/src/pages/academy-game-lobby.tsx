import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Gamepad2,
  Dices,
  Grid3X3,
  Crown,
  Brain,
  Heart,
  LayoutGrid,
  Trophy,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";

interface GameDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  playable: boolean;
  gameType: string;
}

const GAMES: GameDef[] = [
  { id: "dominoes", name: "Dominoes", description: "Block Dominoes with special draw rules", icon: Dices, playable: true, gameType: "dominoes" },
  { id: "checkers", name: "Checkers", description: "Classic 8x8 board game", icon: Grid3X3, playable: true, gameType: "checkers" },
  { id: "chess", name: "Chess", description: "The ultimate strategy game", icon: Crown, playable: true, gameType: "chess" },
  { id: "memory", name: "Memory Match", description: "Test your concentration", icon: Brain, playable: true, gameType: "memory" },
  { id: "spades", name: "Spades", description: "Classic team card game", icon: Heart, playable: true, gameType: "spades" },
  { id: "strategy", name: "Strategy Tiles", description: "Dominate the board", icon: LayoutGrid, playable: true, gameType: "strategy" },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner", desc: "Learning the ropes - random moves, no pressure" },
  { value: "intermediate", label: "Intermediate", desc: "Getting strategic - smarter plays, good challenge" },
  { value: "pro", label: "Pro", desc: "Serious competition - tile counting, blocking" },
  { value: "expert", label: "Expert", desc: "Ultimate challenge - full strategy, pressure play" },
];

interface RatingData {
  dominoes?: { rating: number; gamesPlayed: number; wins: number; losses: number };
  checkers?: { rating: number; gamesPlayed: number; wins: number; losses: number };
  chess?: { rating: number; gamesPlayed: number; wins: number; losses: number };
  [key: string]: { rating: number; gamesPlayed: number; wins: number; losses: number } | undefined;
}

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
}

export default function AcademyGameLobbyPage() {
  useEffect(() => { document.title = 'Game Room | AI Mastery Academy'; }, []);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [setupOpen, setSetupOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameDef | null>(null);
  const [difficulty, setDifficulty] = useState("beginner");
  const [tournamentTimer, setTournamentTimer] = useState(false);

  const { data: ratings, isLoading: ratingsLoading, error, refetch } = useQuery<RatingData>({
    queryKey: ["/api/ratings"],
    retry: false,
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard/dominoes"],
    retry: false,
  });

  const { data: onlineData } = useQuery<{ count: number }>({
    queryKey: ["/api/games/online-count"],
    refetchInterval: 30000,
  });

  const createGame = useMutation({
    mutationFn: async (params: {
      gameType: string;
      mode: string;
      difficulty: string;
      timeLimitSeconds: number | null;
    }) => {
      const res = await apiRequest("POST", "/api/games", params);
      return res.json();
    },
    onSuccess: (data: { session: { id: string }; playSessionId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard/dominoes"] });
      setSetupOpen(false);
      navigate(`/academy/games/dominoes/${data.session.id}?ps=${data.playSessionId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function handleGameClick(game: GameDef) {
    setSelectedGame(game);
    setDifficulty("beginner");
    setTournamentTimer(false);
    setSetupOpen(true);
  }

  function handleStartGame() {
    if (!selectedGame) return;
    createGame.mutate({
      gameType: selectedGame.gameType,
      mode: "single_vs_cpu",
      difficulty,
      timeLimitSeconds: tournamentTimer ? 25 : null,
    });
  }

  if (error) return <div className="p-6"><ErrorRetry message="Failed to load games. Please try again." onRetry={refetch} /></div>;

  const totalGames = ratings
    ? Object.values(ratings).reduce((sum, r) => sum + (r?.gamesPlayed ?? 0), 0)
    : 0;
  const totalWins = ratings
    ? Object.values(ratings).reduce((sum, r) => sum + (r?.wins ?? 0), 0)
    : 0;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto" data-testid="game-lobby-page">
      <div
        className="rounded-md p-4 sm:p-6 lg:p-8 mb-6"
        style={{ background: "linear-gradient(135deg, #7A1F3E 0%, #5a1730 100%)" }}
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <Gamepad2 className="h-7 w-7 text-white" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" data-testid="text-lobby-title">
            Panther Game Room
          </h1>
        </div>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <p className="text-white/80 text-sm sm:text-base" data-testid="text-lobby-subtitle">
            Challenge yourself or compete with classmates
          </p>
          <div
            className="flex items-center gap-2 rounded-md px-3 py-1.5 bg-white/15 text-white text-sm"
            data-testid="badge-online-players"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
            </span>
            <Users className="h-4 w-4" />
            <span data-testid="text-online-count">{onlineData?.count ?? 0} playing now</span>
          </div>
        </div>
        {ratingsLoading ? (
          <div className="flex gap-4 flex-wrap">
            <Skeleton className="h-8 w-32 bg-white/20" />
            <Skeleton className="h-8 w-32 bg-white/20" />
          </div>
        ) : ratings && Object.keys(ratings).length > 0 ? (
          <div className="flex gap-4 flex-wrap">
            {Object.entries(ratings).map(([game, data]) =>
              data ? (
                <div
                  key={game}
                  className="rounded-md px-3 py-1.5 bg-white/10 text-white text-sm"
                  data-testid={`rating-${game}`}
                >
                  <span className="capitalize font-medium">{game}</span>
                  <span className="ml-2 opacity-80">{data.rating} rating</span>
                </div>
              ) : null,
            )}
          </div>
        ) : null}
      </div>

      <div data-testid="section-games">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" /> Choose Your Game
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {GAMES.map((game) => (
            <Card
              key={game.id}
              className="hover-elevate cursor-pointer"
              onClick={() => handleGameClick(game)}
              data-testid={`card-game-${game.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="rounded-md p-2.5 shrink-0"
                    style={{ backgroundColor: "rgba(122,31,62,0.1)" }}
                  >
                    <game.icon
                      className="h-6 w-6"
                      style={{ color: "#7A1F3E" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold" data-testid={`text-game-name-${game.id}`}>
                        {game.name}
                      </p>
                      <Badge
                        variant="default"
                        data-testid={`badge-game-${game.id}`}
                      >
                        Play Now
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-game-desc-${game.id}`}>
                      {game.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div data-testid="section-leaderboard">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" /> Dominoes Leaderboard
          </h2>
          <Card>
            <CardContent className="p-0">
              {leaderboardLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-muted-foreground">#</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Player</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Rating</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Played</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Wins</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, idx) => (
                        <tr
                          key={idx}
                          className="border-b last:border-b-0"
                          data-testid={`leaderboard-row-${idx}`}
                        >
                          <td className="p-3 font-medium" data-testid={`leaderboard-rank-${idx}`}>
                            {entry.rank}
                          </td>
                          <td className="p-3" data-testid={`leaderboard-name-${idx}`}>
                            {entry.playerName}
                          </td>
                          <td className="p-3 text-right" data-testid={`leaderboard-rating-${idx}`}>
                            {entry.rating}
                          </td>
                          <td className="p-3 text-right" data-testid={`leaderboard-played-${idx}`}>
                            {entry.gamesPlayed}
                          </td>
                          <td className="p-3 text-right" data-testid={`leaderboard-wins-${idx}`}>
                            {entry.wins}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Trophy className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No leaderboard data yet. Be the first to play!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div data-testid="section-player-stats">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" /> Your Stats
          </h2>
          <Card>
            <CardContent className="p-5">
              {ratingsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : ratings && Object.keys(ratings).length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-total-games">{totalGames}</p>
                      <p className="text-xs text-muted-foreground">Games Played</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-total-wins">{totalWins}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-win-rate">{winRate}%</p>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                  </div>
                  <div className="border-t pt-4 space-y-3">
                    {Object.entries(ratings).map(([game, data]) =>
                      data ? (
                        <div
                          key={game}
                          className="flex items-center justify-between gap-2"
                          data-testid={`player-stat-${game}`}
                        >
                          <span className="capitalize font-medium text-sm">{game}</span>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{data.rating} rating</span>
                            <span>{data.gamesPlayed} played</span>
                            <span>{data.wins}W / {data.losses}L</span>
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No stats yet. Play a game to get started!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-game-setup">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-setup-title">
              {selectedGame && <selectedGame.icon className="h-5 w-5" />}
              {selectedGame?.name} Setup
            </DialogTitle>
            <DialogDescription data-testid="text-setup-desc">
              Configure your game settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div>
              <Label className="text-sm font-medium mb-2 block">Mode</Label>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Play vs Computer</span>
                  <Badge variant="secondary">Only Option</Badge>
                </div>
              </Card>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Difficulty</Label>
              <RadioGroup value={difficulty} onValueChange={setDifficulty} className="space-y-2">
                {DIFFICULTIES.map((d) => (
                  <Label
                    key={d.value}
                    htmlFor={`diff-${d.value}`}
                    className="flex items-start gap-3 cursor-pointer rounded-md border p-3 hover-elevate"
                    data-testid={`radio-difficulty-${d.value}`}
                  >
                    <RadioGroupItem value={d.value} id={`diff-${d.value}`} className="mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{d.label}</p>
                      <p className="text-xs text-muted-foreground">{d.desc}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Timer Mode</Label>
              <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium" data-testid="text-timer-label">
                    {tournamentTimer ? "Tournament (25s per turn)" : "Casual (no timer)"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tournamentTimer
                      ? "Each turn has a 25 second time limit"
                      : "Take your time, no pressure"}
                  </p>
                </div>
                <Switch
                  checked={tournamentTimer}
                  onCheckedChange={setTournamentTimer}
                  data-testid="switch-timer-mode"
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleStartGame}
              disabled={createGame.isPending}
              data-testid="button-start-game"
            >
              {createGame.isPending ? "Creating Game..." : "Start Game"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
