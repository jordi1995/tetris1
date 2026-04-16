import { Piece, PieceType } from "../types/game";

// Definición de formas de piezas (rotación 0)
const PIECE_SHAPES: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  CAT_BOMB: [
    [1, 1],
    [1, 1],
  ],
  SCRATCH: [
    [1],
    [1],
    [1],
  ],
  SLEEP_CAT: [
    [1, 1, 1],
  ],
  LUCKY_CAT: [
    [0, 1, 0],
    [1, 1, 1],
  ],
};

const PIECE_COLORS: Record<PieceType, string> = {
  I: '#00F0F0',
  O: '#F0F000',
  T: '#A000F0',
  S: '#00F000',
  Z: '#F00000',
  J: '#0000F0',
  L: '#F0A000',
  CAT_BOMB: '#FF1744',
  SCRATCH: '#E040FB',
  SLEEP_CAT: '#7C4DFF',
  LUCKY_CAT: '#FFD700',
};

export function createPiece(type: PieceType): Piece {
  return {
    type,
    shape: PIECE_SHAPES[type],
    color: PIECE_COLORS[type],
    position: { x: 3, y: 0 },
    rotation: 0,
  };
}

export function getRandomPieceType(includeSpecial: boolean = false): PieceType {
  const basicTypes: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const specialTypes: PieceType[] = ['CAT_BOMB', 'SCRATCH', 'SLEEP_CAT', 'LUCKY_CAT'];
  
  if (includeSpecial && Math.random() < 0.15) {
    return specialTypes[Math.floor(Math.random() * specialTypes.length)];
  }
  
  return basicTypes[Math.floor(Math.random() * basicTypes.length)];
}

export function rotatePiece(piece: Piece, clockwise: boolean = true): Piece {
  if (piece.type === 'O') return piece; // O no rota
  
  const newShape = piece.shape.map((row, i) =>
    row.map((_, j) => {
      if (clockwise) {
        return piece.shape[piece.shape.length - 1 - j][i];
      } else {
        return piece.shape[j][piece.shape[0].length - 1 - i];
      }
    })
  );
  
  return {
    ...piece,
    shape: newShape,
    rotation: (piece.rotation + (clockwise ? 1 : -1) + 4) % 4,
  };
}

export function movePiece(piece: Piece, dx: number, dy: number): Piece {
  return {
    ...piece,
    position: {
      x: piece.position.x + dx,
      y: piece.position.y + dy,
    },
  };
}

export function getPieceIcon(type: PieceType): string {
  const icons: Record<PieceType, string> = {
    I: '🟦',
    O: '🟨',
    T: '🟪',
    S: '🟩',
    Z: '🟥',
    J: '🟦',
    L: '🟧',
    CAT_BOMB: '💣',
    SCRATCH: '🔪',
    SLEEP_CAT: '😴',
    LUCKY_CAT: '🍀',
  };
  return icons[type];
}
