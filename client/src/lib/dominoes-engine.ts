export type DominoTile = [number, number];

export interface DominoMove {
  tile: DominoTile;
  end: 'left' | 'right';
  flipped: boolean;
}

export type GamePhase = 'waiting' | 'playing' | 'drawing' | 'game_over';
export type GameEndReason = 'empty_hand' | 'blocked' | 'timer_expired' | 'forfeit';
export type Difficulty = 'beginner' | 'intermediate' | 'pro' | 'expert';

export interface TimerState {
  turnTimeMs: number;
  bonusApplied: boolean;
  drawDeadlineMs: number | null;
  isDrawPhase: boolean;
}

export interface DominoGameState {
  phase: GamePhase;
  playerHand: DominoTile[];
  cpuHandCount: number;
  board: DominoTile[];
  leftEnd: number;
  rightEnd: number;
  boneyardCount: number;
  currentPlayer: 'player' | 'cpu';
  timer: TimerState | null;
  winner: 'player' | 'cpu' | null;
  endReason: GameEndReason | null;
  playerScore: number;
  cpuScore: number;
  moveHistory: Array<{ player: string; move: DominoMove | 'draw' | 'pass' }>;
  lastDrawnTile: DominoTile | null;
}

export interface GameCallbacks {
  onStateChange: (state: DominoGameState) => void;
  onTimerTick: (remainingMs: number) => void;
  onDrawRequired: () => void;
  onBonusTime: () => void;
  onGameOver: (winner: 'player' | 'cpu', reason: GameEndReason) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pipCount(hand: DominoTile[]): number {
  return hand.reduce((sum, [a, b]) => sum + a + b, 0);
}

function tilesEqual(a: DominoTile, b: DominoTile): boolean {
  return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
}

function canPlayOnEnd(tile: DominoTile, endValue: number): boolean {
  return tile[0] === endValue || tile[1] === endValue;
}

function generateAllTiles(): DominoTile[] {
  const tiles: DominoTile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      tiles.push([i, j]);
    }
  }
  return tiles;
}

export class DominoesEngine {
  private tiles: DominoTile[] = [];
  private playerHand: DominoTile[] = [];
  private cpuHand: DominoTile[] = [];
  private boneyard: DominoTile[] = [];
  private board: DominoTile[] = [];
  private leftEnd: number = -1;
  private rightEnd: number = -1;
  private currentPlayer: 'player' | 'cpu' = 'player';
  private phase: GamePhase = 'waiting';
  private difficulty: Difficulty;
  private timeLimitMs: number | null;
  private timerState: TimerState | null = null;
  private timerInterval: number | null = null;
  private callbacks: GameCallbacks;
  private moveHistory: Array<{ player: string; move: DominoMove | 'draw' | 'pass' }> = [];
  private winner: 'player' | 'cpu' | null = null;
  private endReason: GameEndReason | null = null;
  private lastDrawnTile: DominoTile | null = null;
  private opponentDrawEnds: number[] = [];
  private destroyed = false;

  constructor(difficulty: Difficulty, timeLimitMs: number | null, callbacks: GameCallbacks) {
    this.difficulty = difficulty;
    this.timeLimitMs = timeLimitMs;
    this.callbacks = callbacks;
  }

  startGame(): void {
    this.tiles = generateAllTiles();
    const shuffled = shuffleArray(this.tiles);
    this.playerHand = shuffled.slice(0, 7);
    this.cpuHand = shuffled.slice(7, 14);
    this.boneyard = shuffled.slice(14);
    this.board = [];
    this.leftEnd = -1;
    this.rightEnd = -1;
    this.moveHistory = [];
    this.winner = null;
    this.endReason = null;
    this.lastDrawnTile = null;
    this.opponentDrawEnds = [];
    this.destroyed = false;

    this.currentPlayer = this.determineFirstPlayer();
    this.phase = 'playing';

    if (this.timeLimitMs !== null) {
      this.timerState = {
        turnTimeMs: this.timeLimitMs,
        bonusApplied: false,
        drawDeadlineMs: null,
        isDrawPhase: false,
      };
    } else {
      this.timerState = null;
    }

    this.emitState();

    if (this.timeLimitMs !== null) {
      this.startTurnTimer();
    }

    if (this.currentPlayer === 'cpu') {
      this.cpuTurn();
    }
  }

  private determineFirstPlayer(): 'player' | 'cpu' {
    let bestPlayerDouble = -1;
    let bestCpuDouble = -1;
    for (const [a, b] of this.playerHand) {
      if (a === b && a > bestPlayerDouble) bestPlayerDouble = a;
    }
    for (const [a, b] of this.cpuHand) {
      if (a === b && a > bestCpuDouble) bestCpuDouble = a;
    }

    if (bestPlayerDouble >= 0 || bestCpuDouble >= 0) {
      if (bestPlayerDouble >= bestCpuDouble) return 'player';
      return 'cpu';
    }

    let bestPlayerPips = -1;
    let bestPlayerTile: DominoTile | null = null;
    for (const t of this.playerHand) {
      const p = t[0] + t[1];
      if (p > bestPlayerPips) { bestPlayerPips = p; bestPlayerTile = t; }
    }
    let bestCpuPips = -1;
    for (const t of this.cpuHand) {
      const p = t[0] + t[1];
      if (p > bestCpuPips) { bestCpuPips = p; }
    }

    if (bestPlayerPips >= bestCpuPips) return 'player';
    return 'cpu';
  }

  getState(): DominoGameState {
    return {
      phase: this.phase,
      playerHand: [...this.playerHand.map(t => [...t] as DominoTile)],
      cpuHandCount: this.cpuHand.length,
      board: [...this.board.map(t => [...t] as DominoTile)],
      leftEnd: this.leftEnd,
      rightEnd: this.rightEnd,
      boneyardCount: this.boneyard.length,
      currentPlayer: this.currentPlayer,
      timer: this.timerState ? { ...this.timerState } : null,
      winner: this.winner,
      endReason: this.endReason,
      playerScore: pipCount(this.playerHand),
      cpuScore: pipCount(this.cpuHand),
      moveHistory: [...this.moveHistory],
      lastDrawnTile: this.lastDrawnTile ? ([...this.lastDrawnTile] as DominoTile) : null,
    };
  }

  getLegalMoves(): DominoMove[] {
    const hand = this.currentPlayer === 'player' ? this.playerHand : this.cpuHand;
    return this.getLegalMovesForHand(hand);
  }

  private getLegalMovesForHand(hand: DominoTile[]): DominoMove[] {
    const moves: DominoMove[] = [];

    if (this.board.length === 0) {
      for (const tile of hand) {
        moves.push({ tile: [...tile] as DominoTile, end: 'left', flipped: false });
      }
      return moves;
    }

    for (const tile of hand) {
      if (canPlayOnEnd(tile, this.leftEnd)) {
        const flipped = tile[1] !== this.leftEnd;
        moves.push({ tile: [...tile] as DominoTile, end: 'left', flipped });
      }
      if (canPlayOnEnd(tile, this.rightEnd)) {
        if (this.leftEnd === this.rightEnd && canPlayOnEnd(tile, this.leftEnd)) {
          continue;
        }
        const flipped = tile[0] !== this.rightEnd;
        moves.push({ tile: [...tile] as DominoTile, end: 'right', flipped });
      }
    }

    return moves;
  }

  playTile(move: DominoMove): boolean {
    if (this.phase !== 'playing' || this.currentPlayer !== 'player') return false;

    const idx = this.playerHand.findIndex(t => tilesEqual(t, move.tile));
    if (idx === -1) return false;

    const legalMoves = this.getLegalMovesForHand(this.playerHand);
    const isLegal = legalMoves.some(
      m => tilesEqual(m.tile, move.tile) && m.end === move.end
    );
    if (!isLegal) return false;

    const tile = this.playerHand.splice(idx, 1)[0];
    this.placeTile(tile, move.end);

    this.moveHistory.push({ player: 'player', move: { ...move } });
    this.lastDrawnTile = null;

    if (this.checkGameOver()) return true;

    this.switchTurn();
    return true;
  }

  private placeTile(tile: DominoTile, end: 'left' | 'right'): void {
    if (this.board.length === 0) {
      this.board.push(tile);
      this.leftEnd = tile[0];
      this.rightEnd = tile[1];
      return;
    }

    if (end === 'left') {
      if (tile[1] === this.leftEnd) {
        this.board.unshift(tile);
        this.leftEnd = tile[0];
      } else if (tile[0] === this.leftEnd) {
        this.board.unshift([tile[1], tile[0]]);
        this.leftEnd = tile[1];
      }
    } else {
      if (tile[0] === this.rightEnd) {
        this.board.push(tile);
        this.rightEnd = tile[1];
      } else if (tile[1] === this.rightEnd) {
        this.board.push([tile[1], tile[0]]);
        this.rightEnd = tile[0];
      }
    }
  }

  drawTile(): { tile: DominoTile; canPlay: boolean; timerExpired: boolean } | null {
    if (this.phase !== 'drawing' && this.phase !== 'playing') return null;
    if (this.currentPlayer !== 'player') return null;
    if (this.boneyard.length === 0) return null;

    if (this.timerState && this.timerState.turnTimeMs <= 0) {
      this.endGame(this.currentPlayer === 'player' ? 'cpu' : 'player', 'timer_expired');
      return { tile: [0, 0], canPlay: false, timerExpired: true };
    }

    if (this.phase === 'playing') {
      this.enterDrawPhase();
    }

    const tile = this.boneyard.pop()!;
    this.playerHand.push(tile);
    this.lastDrawnTile = [...tile] as DominoTile;
    this.moveHistory.push({ player: 'player', move: 'draw' });

    if (this.timerState && !this.timerState.bonusApplied && this.timerState.turnTimeMs <= 1000) {
      this.timerState.bonusApplied = true;
      this.timerState.turnTimeMs += 15000;
      this.callbacks.onBonusTime();
    }

    const canPlay = this.getLegalMovesForHand(this.playerHand).length > 0;

    if (canPlay) {
      this.phase = 'playing';
      if (this.timerState) {
        this.timerState.isDrawPhase = false;
      }
    } else if (this.boneyard.length === 0) {
      this.phase = 'playing';
      if (this.timerState) {
        this.timerState.isDrawPhase = false;
      }
    }

    this.emitState();

    return { tile: [...tile] as DominoTile, canPlay, timerExpired: false };
  }

  pass(): boolean {
    if (this.phase === 'game_over') return false;
    if (this.currentPlayer !== 'player') return false;

    const legalMoves = this.getLegalMovesForHand(this.playerHand);
    if (legalMoves.length > 0) return false;
    if (this.boneyard.length > 0) return false;

    this.moveHistory.push({ player: 'player', move: 'pass' });
    this.lastDrawnTile = null;

    if (this.checkGameOver()) return true;

    this.switchTurn();
    return true;
  }

  async cpuTurn(): Promise<void> {
    if ((this.phase as GamePhase) === 'game_over' || this.destroyed) return;
    if (this.currentPlayer !== 'cpu') return;

    const delay = this.getCpuDelay();
    await this.wait(delay);
    if (this.destroyed || (this.phase as GamePhase) === 'game_over') return;

    let legalMoves = this.getLegalMovesForHand(this.cpuHand);

    if (legalMoves.length === 0) {
      await this.cpuDraw();
      if (this.destroyed || (this.phase as GamePhase) === 'game_over') return;

      legalMoves = this.getLegalMovesForHand(this.cpuHand);
      if (legalMoves.length === 0) {
        this.moveHistory.push({ player: 'cpu', move: 'pass' });
        if (this.checkGameOver()) return;
        this.switchTurn();
        return;
      }
    }

    const move = this.getCpuMove(legalMoves);
    if (!move) {
      this.moveHistory.push({ player: 'cpu', move: 'pass' });
      if (this.checkGameOver()) return;
      this.switchTurn();
      return;
    }

    const idx = this.cpuHand.findIndex(t => tilesEqual(t, move.tile));
    if (idx !== -1) {
      const tile = this.cpuHand.splice(idx, 1)[0];
      this.placeTile(tile, move.end);
      this.moveHistory.push({ player: 'cpu', move });
      this.lastDrawnTile = null;
    }

    if (this.checkGameOver()) return;
    this.switchTurn();
  }

  private async cpuDraw(): Promise<void> {
    while (this.boneyard.length > 0 && !this.destroyed && (this.phase as GamePhase) !== 'game_over') {
      const drawDelay = this.getCpuDrawDelay();
      await this.wait(drawDelay);
      if (this.destroyed || (this.phase as GamePhase) === 'game_over') return;

      if (this.timerState && this.timerState.turnTimeMs <= 0) {
        this.endGame('player', 'timer_expired');
        return;
      }

      const tile = this.boneyard.pop()!;
      this.cpuHand.push(tile);
      this.moveHistory.push({ player: 'cpu', move: 'draw' });

      this.opponentDrawEnds = [this.leftEnd, this.rightEnd];

      if (this.timerState && !this.timerState.bonusApplied && this.timerState.turnTimeMs <= 1000) {
        this.timerState.bonusApplied = true;
        this.timerState.turnTimeMs += 15000;
      }

      this.emitState();

      const canPlay = this.getLegalMovesForHand(this.cpuHand).length > 0;
      if (canPlay) return;
    }
  }

  private startTurnTimer(): void {
    this.stopTimer();
    if (!this.timerState || this.timeLimitMs === null) return;

    this.timerInterval = window.setInterval(() => {
      if (!this.timerState || this.phase === 'game_over' || this.destroyed) {
        this.stopTimer();
        return;
      }

      this.timerState.turnTimeMs -= 100;
      this.callbacks.onTimerTick(this.timerState.turnTimeMs);

      if (this.timerState.turnTimeMs <= 0) {
        this.timerState.turnTimeMs = 0;

        if (this.timerState.isDrawPhase) {
          const loser = this.currentPlayer;
          const winner = loser === 'player' ? 'cpu' : 'player';
          this.endGame(winner, 'timer_expired');
        } else {
          if (this.currentPlayer === 'player') {
            const legalMoves = this.getLegalMovesForHand(this.playerHand);
            if (legalMoves.length === 0 && this.boneyard.length > 0) {
              this.endGame('cpu', 'timer_expired');
            } else if (legalMoves.length === 0) {
              this.moveHistory.push({ player: 'player', move: 'pass' });
              if (!this.checkGameOver()) {
                this.switchTurn();
              }
            } else {
              const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
              const idx = this.playerHand.findIndex(t => tilesEqual(t, randomMove.tile));
              if (idx !== -1) {
                const tile = this.playerHand.splice(idx, 1)[0];
                this.placeTile(tile, randomMove.end);
                this.moveHistory.push({ player: 'player', move: randomMove });
              }
              if (!this.checkGameOver()) {
                this.switchTurn();
              }
            }
          }
        }
      }
    }, 100);
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) {
      window.clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private enterDrawPhase(): void {
    this.phase = 'drawing';
    if (this.timerState) {
      this.timerState.isDrawPhase = true;
      this.timerState.drawDeadlineMs = this.timerState.turnTimeMs;
    }
    this.callbacks.onDrawRequired();
    this.emitState();
  }

  private checkGameOver(): boolean {
    if (this.playerHand.length === 0) {
      this.endGame('player', 'empty_hand');
      return true;
    }
    if (this.cpuHand.length === 0) {
      this.endGame('cpu', 'empty_hand');
      return true;
    }

    if (this.boneyard.length === 0 && this.board.length > 0) {
      const playerCanPlay = this.getLegalMovesForHand(this.playerHand).length > 0;
      const cpuCanPlay = this.getLegalMovesForHand(this.cpuHand).length > 0;

      if (!playerCanPlay && !cpuCanPlay) {
        const playerPips = pipCount(this.playerHand);
        const cpuPips = pipCount(this.cpuHand);
        const winner = playerPips <= cpuPips ? 'player' : 'cpu';
        this.endGame(winner, 'blocked');
        return true;
      }
    }

    return false;
  }

  private endGame(winner: 'player' | 'cpu', reason: GameEndReason): void {
    this.stopTimer();
    this.phase = 'game_over';
    this.winner = winner;
    this.endReason = reason;
    this.emitState();
    this.callbacks.onGameOver(winner, reason);
  }

  private switchTurn(): void {
    this.currentPlayer = this.currentPlayer === 'player' ? 'cpu' : 'player';
    this.lastDrawnTile = null;

    if (this.timerState && this.timeLimitMs !== null) {
      this.timerState.turnTimeMs = this.timeLimitMs;
      this.timerState.bonusApplied = false;
      this.timerState.isDrawPhase = false;
      this.timerState.drawDeadlineMs = null;
      this.startTurnTimer();
    }

    this.emitState();

    if (this.currentPlayer === 'cpu') {
      this.cpuTurn();
    }
  }

  private getCpuMove(legalMoves: DominoMove[]): DominoMove | null {
    if (legalMoves.length === 0) return null;

    switch (this.difficulty) {
      case 'beginner':
        return this.cpuMoveBeginner(legalMoves);
      case 'intermediate':
        return this.cpuMoveIntermediate(legalMoves);
      case 'pro':
        return this.cpuMovePro(legalMoves);
      case 'expert':
        return this.cpuMoveExpert(legalMoves);
      default:
        return legalMoves[0];
    }
  }

  private cpuMoveBeginner(moves: DominoMove[]): DominoMove {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  private cpuMoveIntermediate(moves: DominoMove[]): DominoMove {
    const bothEnds = moves.filter(m => {
      const [a, b] = m.tile;
      return (canPlayOnEnd([a, b], this.leftEnd) && canPlayOnEnd([a, b], this.rightEnd));
    });

    const candidates = bothEnds.length > 0 ? bothEnds : moves;

    candidates.sort((a, b) => {
      const pipsA = a.tile[0] + a.tile[1];
      const pipsB = b.tile[0] + b.tile[1];
      return pipsB - pipsA;
    });

    return candidates[0];
  }

  private cpuMovePro(moves: DominoMove[]): DominoMove {
    const scored = moves.map(move => {
      let score = 0;
      const [a, b] = move.tile;

      score += (a + b) * 2;

      if (this.opponentDrawEnds.length > 0) {
        const newEnd = move.end === 'left'
          ? (move.flipped ? b : a)
          : (move.flipped ? a : b);
        if (this.opponentDrawEnds.includes(newEnd)) {
          score += 20;
        }
      }

      const pipCounts = new Map<number, number>();
      for (const t of this.cpuHand) {
        if (!tilesEqual(t, move.tile)) {
          pipCounts.set(t[0], (pipCounts.get(t[0]) || 0) + 1);
          pipCounts.set(t[1], (pipCounts.get(t[1]) || 0) + 1);
        }
      }
      const remainingEnd = move.end === 'left' ? this.rightEnd : this.leftEnd;
      const newEnd = move.end === 'left'
        ? (move.flipped ? b : a)
        : (move.flipped ? a : b);
      if (pipCounts.has(remainingEnd)) score += 5;
      if (pipCounts.has(newEnd)) score += 5;

      return { move, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }

  private cpuMoveExpert(moves: DominoMove[]): DominoMove {
    const playedPips = new Map<number, number>();
    for (const t of this.board) {
      playedPips.set(t[0], (playedPips.get(t[0]) || 0) + 1);
      playedPips.set(t[1], (playedPips.get(t[1]) || 0) + 1);
    }
    for (const t of this.cpuHand) {
      playedPips.set(t[0], (playedPips.get(t[0]) || 0) + 1);
      playedPips.set(t[1], (playedPips.get(t[1]) || 0) + 1);
    }

    const scored = moves.map(move => {
      let score = 0;
      const [a, b] = move.tile;

      score += (a + b) * 1.5;

      if (this.opponentDrawEnds.length > 0) {
        const newEnd = move.end === 'left'
          ? (move.flipped ? b : a)
          : (move.flipped ? a : b);
        if (this.opponentDrawEnds.includes(newEnd)) {
          score += 30;
        }
      }

      const newEnd = move.end === 'left'
        ? (move.flipped ? b : a)
        : (move.flipped ? a : b);
      const knownCount = playedPips.get(newEnd) || 0;
      if (knownCount >= 6) {
        score += 15;
      }

      const remainingHand = this.cpuHand.filter(t => !tilesEqual(t, move.tile));
      const futureMovesLeft = remainingHand.filter(t => {
        const remainingEnd = move.end === 'left' ? this.rightEnd : this.leftEnd;
        return canPlayOnEnd(t, remainingEnd) || canPlayOnEnd(t, newEnd);
      });
      score += futureMovesLeft.length * 3;

      if (remainingHand.length <= 3) {
        score += (a + b) * 3;
      }

      if (a === b) {
        score += 3;
      }

      return { move, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }

  private getCpuDelay(): number {
    switch (this.difficulty) {
      case 'beginner': return 1000 + Math.random() * 1000;
      case 'intermediate': return 800 + Math.random() * 700;
      case 'pro': return 600 + Math.random() * 800;
      case 'expert': return 500 + Math.random() * 1500;
      default: return 1000;
    }
  }

  private getCpuDrawDelay(): number {
    switch (this.difficulty) {
      case 'beginner': return 1500 + Math.random() * 1000;
      case 'intermediate': return 800 + Math.random() * 500;
      case 'pro': return 500 + Math.random() * 500;
      case 'expert': return 300 + Math.random() * 700;
      default: return 1000;
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => {
      const id = window.setTimeout(resolve, ms);
      if (this.destroyed) {
        window.clearTimeout(id);
        resolve();
      }
    });
  }

  private emitState(): void {
    if (!this.destroyed) {
      this.callbacks.onStateChange(this.getState());
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.stopTimer();
  }
}
