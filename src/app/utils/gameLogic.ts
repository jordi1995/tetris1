import { Cell, Piece, PlayerState } from "../types/game";
import { createPiece, getRandomPieceType, movePiece, rotatePiece } from "./pieces";

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export function createEmptyBoard(): Cell[][] {
  return Array(BOARD_HEIGHT).fill(null).map(() =>
    Array(BOARD_WIDTH).fill(null).map(() => ({
      filled: false,
      color: '',
    }))
  );
}

export function createInitialPlayerState(character: any, includeChaosPieces: boolean = false): PlayerState {
  const nextPieces = Array(5).fill(null).map(() => createPiece(getRandomPieceType(includeChaosPieces)));
  const currentPiece = nextPieces.shift()!;
  nextPieces.push(createPiece(getRandomPieceType(includeChaosPieces)));
  
  return {
    board: createEmptyBoard(),
    currentPiece,
    nextPieces,
    holdPiece: null,
    canHold: true,
    score: 0,
    level: 1,
    linesCleared: 0,
    combo: 0,
    attackQueue: 0,
    powerMeter: 0,
    activePower: null,
    effects: [],
    character,
    isGameOver: false,
  };
}

export function isValidPosition(board: Cell[][], piece: Piece): boolean {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardX = piece.position.x + x;
        const boardY = piece.position.y + y;
        
        if (
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          boardY >= BOARD_HEIGHT ||
          (boardY >= 0 && board[boardY][boardX].filled)
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

export function lockPiece(board: Cell[][], piece: Piece): Cell[][] {
  const newBoard = board.map(row => [...row]);
  
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.position.y + y;
        const boardX = piece.position.x + x;
        
        if (boardY >= 0) {
          newBoard[boardY][boardX] = {
            filled: true,
            color: piece.color,
            type: piece.type,
          };
        }
      }
    }
  }
  
  return newBoard;
}

export function clearLines(board: Cell[][]): { board: Cell[][], linesCleared: number } {
  const fullLines: number[] = [];
  
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    if (board[y].every(cell => cell.filled)) {
      fullLines.push(y);
    }
  }
  
  if (fullLines.length === 0) {
    return { board, linesCleared: 0 };
  }
  
  let newBoard = board.filter((_, index) => !fullLines.includes(index));
  
  const emptyLines = Array(fullLines.length).fill(null).map(() =>
    Array(BOARD_WIDTH).fill(null).map(() => ({
      filled: false,
      color: '',
    }))
  );
  
  newBoard = [...emptyLines, ...newBoard];
  
  return { board: newBoard, linesCleared: fullLines.length };
}

export function addGarbageLines(board: Cell[][], lines: number): Cell[][] {
  if (lines <= 0) return board;
  
  // Eliminar líneas de arriba
  const newBoard = board.slice(lines);
  
  // Añadir líneas de basura abajo
  const garbageLines = Array(lines).fill(null).map(() => {
    const gapIndex = Math.floor(Math.random() * BOARD_WIDTH);
    return Array(BOARD_WIDTH).fill(null).map((_, i) => ({
      filled: i !== gapIndex,
      color: '#666666',
      isGarbage: true,
    }));
  });
  
  return [...newBoard, ...garbageLines];
}

export function calculateScore(linesCleared: number, combo: number, level: number): number {
  const baseScores = [0, 100, 300, 500, 800];
  const baseScore = baseScores[linesCleared] || 0;
  const comboBonus = combo * 50;
  const levelMultiplier = level;
  
  return (baseScore + comboBonus) * levelMultiplier;
}

export function calculateAttack(linesCleared: number, combo: number): number {
  if (linesCleared === 0) return 0;
  
  let attack = 0;
  if (linesCleared === 1) attack = 0;
  else if (linesCleared === 2) attack = 1;
  else if (linesCleared === 3) attack = 2;
  else if (linesCleared === 4) attack = 4;
  
  // Bonus por combo
  if (combo > 1) {
    attack += Math.floor(combo / 2);
  }
  
  return attack;
}

export function tryMove(state: PlayerState, dx: number, dy: number): PlayerState {
  if (!state.currentPiece) return state;
  
  const newPiece = movePiece(state.currentPiece, dx, dy);
  
  if (isValidPosition(state.board, newPiece)) {
    return {
      ...state,
      currentPiece: newPiece,
    };
  }
  
  return state;
}

export function tryRotate(state: PlayerState, clockwise: boolean = true): PlayerState {
  if (!state.currentPiece) return state;
  
  const rotatedPiece = rotatePiece(state.currentPiece, clockwise);
  
  // Intentar rotación con wall kicks
  const kicks = [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
  ];
  
  for (const kick of kicks) {
    const kickedPiece = movePiece(rotatedPiece, kick.x, kick.y);
    if (isValidPosition(state.board, kickedPiece)) {
      return {
        ...state,
        currentPiece: kickedPiece,
      };
    }
  }
  
  return state;
}

export function hardDrop(state: PlayerState): PlayerState {
  if (!state.currentPiece) return state;
  
  let newPiece = state.currentPiece;
  let dropDistance = 0;
  
  while (isValidPosition(state.board, movePiece(newPiece, 0, 1))) {
    newPiece = movePiece(newPiece, 0, 1);
    dropDistance++;
  }
  
  return {
    ...state,
    currentPiece: newPiece,
    score: state.score + dropDistance * 2,
  };
}

export function holdPieceAction(state: PlayerState, includeChaosPieces: boolean = false): PlayerState {
  if (!state.canHold || !state.currentPiece) return state;
  
  let newCurrentPiece: Piece;
  let newHoldPiece: Piece;
  
  if (state.holdPiece) {
    newCurrentPiece = { ...state.holdPiece, position: { x: 3, y: 0 }, rotation: 0 };
    newHoldPiece = { ...state.currentPiece, position: { x: 3, y: 0 }, rotation: 0 };
    if (!isValidPosition(state.board, newCurrentPiece)) return state;
  } else {
    newHoldPiece = { ...state.currentPiece, position: { x: 3, y: 0 }, rotation: 0 };
    const nextPieces = [...state.nextPieces];
    newCurrentPiece = { ...nextPieces.shift()!, position: { x: 3, y: 0 }, rotation: 0 };
    if (!isValidPosition(state.board, newCurrentPiece)) return state;
    nextPieces.push(createPiece(getRandomPieceType(includeChaosPieces)));
    
    return {
      ...state,
      currentPiece: newCurrentPiece,
      holdPiece: newHoldPiece,
      nextPieces,
      canHold: false,
    };
  }
  
  return {
    ...state,
    currentPiece: newCurrentPiece,
    holdPiece: newHoldPiece,
    canHold: false,
  };
}
