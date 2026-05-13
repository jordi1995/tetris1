// Tipos de piezas
export type PieceType =
  | 'I'
  | 'O'
  | 'T'
  | 'S'
  | 'Z'
  | 'J'
  | 'L'
  | 'CAT_BOMB'
  | 'SCRATCH'
  | 'SLEEP_CAT'
  | 'LUCKY_CAT'
  | 'CHAOS_GIANT'
  | 'CHAOS_MINI'
  | 'CHAOS_CAT'
  | 'CHAOS_LONG'
  | 'CHAOS_HOLLOW';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  type: PieceType;
  shape: number[][];
  color: string;
  position: Position;
  rotation: number;
}

export interface Cell {
  filled: boolean;
  color: string;
  type?: PieceType;
  isGarbage?: boolean;
}

export type GameMode = 'normal' | 'vs-cpu' | 'vs-player' | 'ranked' | 'chaos' | 'coop' | 'puzzle';

export interface Character {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export interface PowerType {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
}

export interface PlayerState {
  board: Cell[][];
  currentPiece: Piece | null;
  nextPieces: Piece[];
  holdPiece: Piece | null;
  canHold: boolean;
  score: number;
  level: number;
  linesCleared: number;
  combo: number;
  attackQueue: number;
  powerMeter: number;
  activePower: PowerType | null;
  effects: Effect[];
  character: Character;
  isGameOver: boolean;
}

export interface Effect {
  type: 'frozen' | 'speed_up' | 'mirror' | 'shake' | 'block_attack';
  duration: number;
  startTime: number;
}

export interface AttackData {
  lines: number;
  isCombo: boolean;
  sender: 'player1' | 'player2';
}

export interface GameState {
  player1: PlayerState;
  player2: PlayerState;
  mode: GameMode;
  isPaused: boolean;
  winner: 'player1' | 'player2' | null;
  matchTime: number;
}
