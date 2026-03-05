import { useState, useEffect, useCallback, useRef } from "react";
import {
  DominoesEngine,
  type DominoGameState,
  type DominoMove,
  type DominoTile as DominoTileType,
  type Difficulty,
  type GameEndReason,
} from "@/lib/dominoes-engine";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";

const PIP_POSITIONS: Record<number, Array<[number, number]>> = {
  0: [],
  1: [[50, 50]],
  2: [
    [72, 28],
    [28, 72],
  ],
  3: [
    [72, 28],
    [50, 50],
    [28, 72],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 22],
    [28, 50],
    [28, 78],
    [72, 22],
    [72, 50],
    [72, 78],
  ],
};

function PipHalf({
  value,
  size,
  dotColor,
}: {
  value: number;
  size: number;
  dotColor: string;
}) {
  const positions = PIP_POSITIONS[value] || [];
  const dotR = size * 0.09;

  useEffect(() => { document.title = "Dominoes | AI Mastery Academy"; }, []);
  return (
    <g>
      {positions.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={(cx / 100) * size}
          cy={(cy / 100) * size}
          r={dotR}
          fill={dotColor}
        />
      ))}
    </g>
  );
}

function DominoTile({
  tile,
  orientation = "vertical",
  size = 60,
  highlighted = false,
  dimmed = false,
  faceDown = false,
  isNew = false,
  onClick,
  testId,
}: {
  tile: DominoTileType;
  orientation?: "horizontal" | "vertical";
  size?: number;
  highlighted?: boolean;
  dimmed?: boolean;
  faceDown?: boolean;
  isNew?: boolean;
  onClick?: () => void;
  testId?: string;
}) {
  const halfSize = size;
  const w = orientation === "horizontal" ? halfSize * 2 + 2 : halfSize;
  const h = orientation === "horizontal" ? halfSize : halfSize * 2 + 2;
  const borderColor = highlighted ? "#7A1F3E" : "#888";
  const borderWidth = highlighted ? 2 : 1;

  if (faceDown) {
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className={`shrink-0 ${onClick ? "cursor-pointer" : ""}`}
        onClick={onClick}
        data-testid={testId}
      >
        <rect
          x={1}
          y={1}
          width={w - 2}
          height={h - 2}
          rx={4}
          fill="#7A1F3E"
          stroke="#5a1730"
          strokeWidth={1.5}
        />
        <line
          x1={w / 2 - 6}
          y1={h / 2}
          x2={w / 2 + 6}
          y2={h / 2}
          stroke="#fff"
          strokeWidth={1.5}
          opacity={0.4}
        />
        <line
          x1={w / 2}
          y1={h / 2 - 6}
          x2={w / 2}
          y2={h / 2 + 6}
          stroke="#fff"
          strokeWidth={1.5}
          opacity={0.4}
        />
      </svg>
    );
  }

  const [a, b] = tile;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={`shrink-0 transition-all duration-200 ${
        onClick ? "cursor-pointer" : ""
      } ${dimmed ? "opacity-50" : ""} ${
        isNew ? "animate-pulse" : ""
      }`}
      style={
        highlighted
          ? { filter: "drop-shadow(0 0 4px rgba(122,31,62,0.5))" }
          : undefined
      }
      onClick={onClick}
      data-testid={testId}
    >
      <rect
        x={borderWidth / 2}
        y={borderWidth / 2}
        width={w - borderWidth}
        height={h - borderWidth}
        rx={4}
        fill="white"
        stroke={borderColor}
        strokeWidth={borderWidth}
      />
      {orientation === "horizontal" ? (
        <>
          <g transform={`translate(1, 1)`}>
            <PipHalf value={a} size={halfSize} dotColor="#1a1a1a" />
          </g>
          <line
            x1={halfSize + 1}
            y1={4}
            x2={halfSize + 1}
            y2={h - 4}
            stroke="#aaa"
            strokeWidth={1}
          />
          <g transform={`translate(${halfSize + 2}, 1)`}>
            <PipHalf value={b} size={halfSize} dotColor="#1a1a1a" />
          </g>
        </>
      ) : (
        <>
          <g transform={`translate(1, 1)`}>
            <PipHalf value={a} size={halfSize} dotColor="#1a1a1a" />
          </g>
          <line
            x1={4}
            y1={halfSize + 1}
            x2={w - 4}
            y2={halfSize + 1}
            stroke="#aaa"
            strokeWidth={1}
          />
          <g transform={`translate(1, ${halfSize + 2})`}>
            <PipHalf value={b} size={halfSize} dotColor="#1a1a1a" />
          </g>
        </>
      )}
    </svg>
  );
}

function canPlayOnEnd(tile: DominoTileType, endValue: number): boolean {
  return tile[0] === endValue || tile[1] === endValue;
}

function formatMoveText(entry: {
  player: string;
  move: DominoMove | "draw" | "pass";
}): string {
  const who = entry.player === "player" ? "You" : "CPU";
  if (entry.move === "draw") return `${who} drew a tile`;
  if (entry.move === "pass") return `${who} passed`;
  const m = entry.move;
  return `${who} played [${m.tile[0]}|${m.tile[1]}] on ${m.end}`;
}

function reasonText(reason: GameEndReason): string {
  switch (reason) {
    case "empty_hand":
      return "All tiles played";
    case "blocked":
      return "Game blocked - lowest pip count wins";
    case "timer_expired":
      return "Timer ran out";
    case "forfeit":
      return "Forfeit";
    default:
      return reason;
  }
}

interface SessionData {
  session: {
    id: string;
    gameType: string;
    mode: string;
    difficulty: string;
    timeLimitSeconds: number | null;
    status: string;
    createdBy: string | null;
  };
  players: Array<{ id: string; userId: string | null; seat: number; isCpu: boolean; cpuDifficulty: string | null }>;
}

export default function AcademyDominoesGame() {
  const [, navigate] = useLocation();
  const [matched, params] = useRoute("/academy/games/dominoes/:id");
  const sessionId = params?.id;
  const playSessionId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ps') : null;
  const { toast } = useToast();

  const [gameState, setGameState] = useState<DominoGameState | null>(null);
  const [timerMs, setTimerMs] = useState<number>(0);
  const [showBonusFlash, setShowBonusFlash] = useState(false);
  const [showEndChoice, setShowEndChoice] = useState<DominoMove[] | null>(null);
  const [gameOverData, setGameOverData] = useState<{
    winner: string;
    reason: string;
  } | null>(null);
  const [ratingChange, setRatingChange] = useState<number | null>(null);
  const [cpuThinking, setCpuThinking] = useState(false);
  const engineRef = useRef<DominoesEngine | null>(null);
  const sessionDataRef = useRef<SessionData | null>(null);

  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
    refetch: refetchSession,
  } = useQuery<SessionData>({
    queryKey: ["/api/games", sessionId],
    enabled: !!sessionId,
  });

  const finishGame = useMutation({
    mutationFn: async (body: {
      winner: string;
      reason: string;
      playerScore: number;
      cpuScore: number;
    }) => {
      const userId = sessionDataRef.current?.session.createdBy;
      const winnerId = body.winner === 'player' ? userId : null;
      const res = await apiRequest(
        "POST",
        `/api/games/${sessionId}/finish`,
        {
          winnerId,
          scores: { playerScore: body.playerScore, cpuScore: body.cpuScore, reason: body.reason },
          playSessionId: playSessionId || undefined,
        },
      );
      return res.json();
    },
    onSuccess: (data: { ratingChange?: number }) => {
      if (data.ratingChange !== undefined) {
        setRatingChange(data.ratingChange);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard/dominoes"] });
    },
    onError: () => {},
  });

  const rematchGame = useMutation({
    mutationFn: async () => {
      if (!sessionDataRef.current) return null;
      const s = sessionDataRef.current;
      const res = await apiRequest("POST", "/api/games", {
        gameType: s.session.gameType,
        mode: s.session.mode,
        difficulty: s.session.difficulty,
        timeLimitSeconds: s.session.timeLimitSeconds,
      });
      return res.json();
    },
    onSuccess: (data: { session: { id: string }; playSessionId: string } | null) => {
      if (data) {
        navigate(`/academy/games/dominoes/${data.session.id}?ps=${data.playSessionId}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create rematch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const initializeEngine = useCallback(
    (sess: SessionData) => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }

      sessionDataRef.current = sess;
      const difficulty = (sess.session.difficulty || "beginner") as Difficulty;
      const timeLimitMs = sess.session.timeLimitSeconds
        ? sess.session.timeLimitSeconds * 1000
        : null;

      const callbacks = {
        onStateChange: (state: DominoGameState) => {
          setGameState(state);
          setCpuThinking(
            state.currentPlayer === "cpu" && state.phase === "playing",
          );
        },
        onTimerTick: (ms: number) => setTimerMs(ms),
        onDrawRequired: () => {},
        onBonusTime: () => {
          setShowBonusFlash(true);
          setTimeout(() => setShowBonusFlash(false), 2000);
        },
        onGameOver: (winner: "player" | "cpu", reason: GameEndReason) => {
          setCpuThinking(false);
          setGameOverData({ winner, reason });
          const state = engineRef.current?.getState();
          finishGame.mutate({
            winner,
            reason,
            playerScore: state?.playerScore ?? 0,
            cpuScore: state?.cpuScore ?? 0,
          });
        },
      };

      const engine = new DominoesEngine(difficulty, timeLimitMs, callbacks);
      engineRef.current = engine;
      engine.startGame();
    },
    [finishGame],
  );

  useEffect(() => {
    if (session && !engineRef.current) {
      initializeEngine(session);
    }
  }, [session, initializeEngine]);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  const handleTileClick = useCallback(
    (tile: DominoTileType) => {
      if (!gameState || !engineRef.current) return;
      if (gameState.currentPlayer !== "player" || gameState.phase !== "playing")
        return;

      const canLeft =
        gameState.board.length === 0 ||
        canPlayOnEnd(tile, gameState.leftEnd);
      const canRight =
        gameState.board.length > 0 && canPlayOnEnd(tile, gameState.rightEnd);

      if (!canLeft && !canRight) return;

      if (
        gameState.board.length > 0 &&
        canLeft &&
        canRight &&
        gameState.leftEnd !== gameState.rightEnd
      ) {
        const leftMove: DominoMove = {
          tile: [...tile] as DominoTileType,
          end: "left",
          flipped: tile[1] !== gameState.leftEnd,
        };
        const rightMove: DominoMove = {
          tile: [...tile] as DominoTileType,
          end: "right",
          flipped: tile[0] !== gameState.rightEnd,
        };
        setShowEndChoice([leftMove, rightMove]);
        return;
      }

      const end: "left" | "right" =
        gameState.board.length === 0
          ? "left"
          : canLeft
            ? "left"
            : "right";
      const flipped =
        end === "left"
          ? gameState.board.length > 0 && tile[1] !== gameState.leftEnd
          : tile[0] !== gameState.rightEnd;

      engineRef.current.playTile({
        tile: [...tile] as DominoTileType,
        end,
        flipped,
      });
    },
    [gameState],
  );

  const handleEndChoice = useCallback((move: DominoMove) => {
    setShowEndChoice(null);
    engineRef.current?.playTile(move);
  }, []);

  const handleDraw = useCallback(() => {
    engineRef.current?.drawTile();
  }, []);

  const handlePass = useCallback(() => {
    engineRef.current?.pass();
  }, []);

  if (!matched) return null;

  if (sessionLoading) {
    return (
      <div
        className="flex flex-col h-full p-4"
        data-testid="dominoes-game-loading"
      >
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="flex-1 w-full mb-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="p-6">
        <ErrorRetry message="Could not load game session." onRetry={refetchSession} />
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full p-6"
        data-testid="dominoes-game-error"
      >
        <p className="text-lg font-medium mb-4">Could not load game session</p>
        <Button onClick={() => navigate("/academy/games")} data-testid="button-back-error">
          Back to Game Room
        </Button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full p-6"
        data-testid="dominoes-game-initializing"
      >
        <p className="text-sm text-muted-foreground">Setting up game...</p>
      </div>
    );
  }

  const difficulty = (session.session.difficulty || "beginner") as Difficulty;
  const hasTimer = session.session.timeLimitSeconds !== null;
  const timerSec = Math.max(0, Math.ceil(timerMs / 1000));
  const timerColor =
    timerSec > 10
      ? "text-green-600 dark:text-green-400"
      : timerSec > 5
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";
  const timerPulse = timerSec <= 5 && timerSec > 0 ? "animate-pulse" : "";

  const isPlayerTurn = gameState.currentPlayer === "player";
  const isPlaying = gameState.phase === "playing";
  const isDrawing = gameState.phase === "drawing";
  const hasBoard = gameState.board.length > 0;

  const playerCanPlay = gameState.playerHand.some(
    (tile) =>
      !hasBoard ||
      canPlayOnEnd(tile, gameState.leftEnd) ||
      canPlayOnEnd(tile, gameState.rightEnd),
  );
  const mustDraw =
    isPlayerTurn && !playerCanPlay && gameState.boneyardCount > 0;
  const canPass =
    isPlayerTurn && !playerCanPlay && gameState.boneyardCount === 0;

  const last3Moves = gameState.moveHistory.slice(-3);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      data-testid="dominoes-game-page"
    >
      <div
        className="flex items-center gap-3 px-3 py-2 border-b shrink-0"
        data-testid="section-topbar"
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={() => navigate("/academy/games")}
          data-testid="button-back"
          aria-label="Back to games"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm sm:text-base" data-testid="text-game-title">
          Dominoes
        </span>
        <div className="flex-1" />
        {showBonusFlash && (
          <span
            className="text-xs font-bold text-green-600 dark:text-green-400 animate-bounce"
            data-testid="text-bonus-flash"
          >
            Bonus +15s!
          </span>
        )}
        {hasTimer && (
          <span
            className={`font-mono text-sm font-bold ${timerColor} ${timerPulse}`}
            data-testid="text-timer"
          >
            {timerSec}s
          </span>
        )}
      </div>

      <div
        className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
        data-testid="section-cpu-hand"
      >
        <span className="text-xs font-medium text-muted-foreground">CPU</span>
        <Badge variant="secondary" className="text-xs capitalize" data-testid="badge-difficulty">
          {difficulty}
        </Badge>
        <div className="flex gap-0.5 ml-2 flex-wrap">
          {Array.from({ length: gameState.cpuHandCount }).map((_, i) => (
            <DominoTile
              key={i}
              tile={[0, 0]}
              faceDown
              size={20}
              orientation="vertical"
              testId={`cpu-tile-${i}`}
            />
          ))}
        </div>
        {cpuThinking && (
          <span
            className="text-xs text-muted-foreground ml-2 italic"
            data-testid="text-cpu-thinking"
          >
            Thinking
            <span className="inline-block animate-pulse">...</span>
          </span>
        )}
      </div>

      <div
        className="flex-1 min-h-0 overflow-auto px-3 py-4"
        data-testid="section-board"
      >
        {!hasBoard ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground" data-testid="text-empty-board">
              {isPlayerTurn
                ? "Play a tile to start!"
                : "Waiting for CPU..."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs" data-testid="badge-left-end">
                Left: {gameState.leftEnd}
              </Badge>
              <Badge variant="outline" className="text-xs" data-testid="badge-right-end">
                Right: {gameState.rightEnd}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1 py-2">
              {gameState.board.map((tile, i) => (
                <DominoTile
                  key={i}
                  tile={tile}
                  orientation="horizontal"
                  size={28}
                  testId={`board-tile-${i}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="flex items-center gap-2 px-3 py-1.5 border-t shrink-0 flex-wrap"
        data-testid="section-boneyard"
      >
        <span className="text-xs text-muted-foreground" data-testid="text-boneyard-count">
          Boneyard: {gameState.boneyardCount} tiles remaining
        </span>
        {(mustDraw || isDrawing) && isPlayerTurn && gameState.boneyardCount > 0 && (
          <Button
            size="sm"
            variant="default"
            onClick={handleDraw}
            className="animate-pulse text-xs"
            data-testid="button-draw"
          >
            Draw a tile!
          </Button>
        )}
        {canPass && (
          <Button
            size="sm"
            variant="outline"
            onClick={handlePass}
            className="text-xs"
            data-testid="button-pass"
          >
            Pass
          </Button>
        )}
      </div>

      <div
        className="flex items-center gap-3 px-3 py-1.5 border-t shrink-0 flex-wrap"
        data-testid="section-status"
      >
        <Badge
          variant={isPlayerTurn ? "default" : "secondary"}
          data-testid="badge-turn"
        >
          {isPlayerTurn ? "Your Turn" : "CPU's Turn"}
        </Badge>
        {gameState.phase === "game_over" && (
          <span className="text-xs text-muted-foreground" data-testid="text-scores">
            You: {gameState.playerScore} pips | CPU: {gameState.cpuScore} pips
          </span>
        )}
        <div className="flex-1" />
        <div className="flex gap-2 flex-wrap">
          {last3Moves.map((entry, i) => (
            <span
              key={i}
              className="text-xs text-muted-foreground"
              data-testid={`text-move-${i}`}
            >
              {formatMoveText(entry)}
            </span>
          ))}
        </div>
      </div>

      <div
        className="flex gap-1.5 px-3 py-3 border-t shrink-0 overflow-x-auto"
        data-testid="section-player-hand"
      >
        {gameState.playerHand.map((tile, i) => {
          const playable =
            isPlayerTurn &&
            isPlaying &&
            (!hasBoard ||
              canPlayOnEnd(tile, gameState.leftEnd) ||
              canPlayOnEnd(tile, gameState.rightEnd));
          const isLastDrawn =
            gameState.lastDrawnTile &&
            tile[0] === gameState.lastDrawnTile[0] &&
            tile[1] === gameState.lastDrawnTile[1];
          return (
            <DominoTile
              key={`${tile[0]}-${tile[1]}-${i}`}
              tile={tile}
              orientation="vertical"
              size={38}
              highlighted={playable}
              dimmed={isPlayerTurn && isPlaying && !playable}
              isNew={!!isLastDrawn}
              onClick={playable ? () => handleTileClick(tile) : undefined}
              testId={`player-tile-${i}`}
            />
          );
        })}
        {gameState.playerHand.length === 0 && (
          <span className="text-xs text-muted-foreground py-2">No tiles</span>
        )}
      </div>

      <Dialog
        open={showEndChoice !== null}
        onOpenChange={(open) => {
          if (!open) setShowEndChoice(null);
        }}
      >
        <DialogContent className="sm:max-w-xs" data-testid="dialog-end-choice">
          <DialogHeader>
            <DialogTitle>Choose which end</DialogTitle>
            <DialogDescription>
              This tile can be played on both ends. Where would you like to place
              it?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-center py-2">
            {showEndChoice?.map((move, i) => (
              <Button
                key={i}
                variant="outline"
                onClick={() => handleEndChoice(move)}
                data-testid={`button-end-${move.end}`}
              >
                {move.end === "left"
                  ? `Left (${gameState.leftEnd})`
                  : `Right (${gameState.rightEnd})`}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={gameOverData !== null}
        onOpenChange={() => {}}
      >
        <DialogContent
          className="sm:max-w-sm"
          data-testid="dialog-game-over"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle data-testid="text-game-over-title">
              {gameOverData?.winner === "player" ? "You Win!" : "CPU Wins"}
            </DialogTitle>
            <DialogDescription data-testid="text-game-over-reason">
              {gameOverData ? reasonText(gameOverData.reason as GameEndReason) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex justify-between gap-4 text-sm">
              <div>
                <p className="font-medium">Your Pips</p>
                <p className="text-lg font-bold" data-testid="text-player-final-score">
                  {gameState.playerScore}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">CPU Pips</p>
                <p className="text-lg font-bold" data-testid="text-cpu-final-score">
                  {gameState.cpuScore}
                </p>
              </div>
            </div>
            {ratingChange !== null && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  ratingChange >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
                data-testid="text-rating-change"
              >
                {ratingChange >= 0 ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                {ratingChange >= 0 ? "+" : ""}
                {ratingChange} rating
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/academy/games")}
                data-testid="button-play-again"
              >
                Play Again
              </Button>
              <Button
                className="flex-1"
                onClick={() => rematchGame.mutate()}
                disabled={rematchGame.isPending}
                data-testid="button-rematch"
              >
                {rematchGame.isPending ? "Creating..." : "Rematch"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
