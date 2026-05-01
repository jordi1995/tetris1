import { Cell, Piece, PlayerState } from "../types/game";
import { BOARD_HEIGHT, BOARD_WIDTH, clearLines, isValidPosition, lockPiece } from "./gameLogic";
import { movePiece, rotatePiece } from "./pieces";

export type CpuAction = "left" | "right" | "rotate" | "drop";

export interface CpuMovePlan {
  targetX: number;
  targetRotation: number;
  landingY: number;
  linesCleared: number;
  score: number;
}

interface Candidate {
  piece: Piece;
  board: Cell[][];
  linesCleared: number;
}

export function getCpuMovePlan(state: PlayerState): CpuMovePlan | null {
  if (!state.currentPiece) return null;

  let bestPlan: CpuMovePlan | null = null;
  const seenRotations = new Set<string>();
  let rotatedPiece = state.currentPiece;

  for (let rotationStep = 0; rotationStep < 4; rotationStep++) {
    const rotationKey = shapeKey(rotatedPiece.shape);
    if (!seenRotations.has(rotationKey)) {
      seenRotations.add(rotationKey);

      for (let x = -rotatedPiece.shape[0].length; x < BOARD_WIDTH; x++) {
        const candidate = getLandingCandidate(state.board, {
          ...rotatedPiece,
          position: { x, y: state.currentPiece.position.y },
        });

        if (!candidate) continue;

        const score = evaluateCandidate(candidate);
        if (!bestPlan || score > bestPlan.score) {
          bestPlan = {
            targetX: candidate.piece.position.x,
            targetRotation: candidate.piece.rotation,
            landingY: candidate.piece.position.y,
            linesCleared: candidate.linesCleared,
            score,
          };
        }
      }
    }

    rotatedPiece = rotatePiece(rotatedPiece);
  }

  return bestPlan;
}

export function getCpuAction(state: PlayerState): CpuAction {
  const plan = getCpuMovePlan(state);
  const piece = state.currentPiece;

  if (!plan || !piece) return "drop";
  if (piece.rotation !== plan.targetRotation) return "rotate";
  if (piece.position.x < plan.targetX) return "right";
  if (piece.position.x > plan.targetX) return "left";

  return "drop";
}

function getLandingCandidate(board: Cell[][], piece: Piece): Candidate | null {
  if (!isValidPosition(board, piece)) return null;

  let landingPiece = piece;
  while (isValidPosition(board, movePiece(landingPiece, 0, 1))) {
    landingPiece = movePiece(landingPiece, 0, 1);
  }

  const lockedBoard = lockPiece(board, landingPiece);
  const { board: clearedBoard, linesCleared } = clearLines(lockedBoard);

  return {
    piece: landingPiece,
    board: clearedBoard,
    linesCleared,
  };
}

function evaluateCandidate(candidate: Candidate): number {
  const heights = getColumnHeights(candidate.board);
  const aggregateHeight = heights.reduce((sum, height) => sum + height, 0);
  const maxHeight = Math.max(...heights);
  const bumpiness = heights.slice(1).reduce((sum, height, index) => sum + Math.abs(height - heights[index]), 0);
  const holes = countHoles(candidate.board);
  const dangerPenalty = maxHeight > 15 ? (maxHeight - 15) * 240 : 0;
  const imperfectPlayBias =
    Math.abs(candidate.piece.position.x * 31 + candidate.piece.rotation * 17 + candidate.piece.position.y * 13) % 12;

  return (
    candidate.linesCleared * 1200 -
    holes * 460 -
    aggregateHeight * 24 -
    bumpiness * 38 -
    maxHeight * 18 -
    dangerPenalty +
    candidate.piece.position.y * 3 +
    imperfectPlayBias
  );
}

function getColumnHeights(board: Cell[][]): number[] {
  return Array.from({ length: BOARD_WIDTH }, (_, x) => {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (board[y][x].filled) {
        return BOARD_HEIGHT - y;
      }
    }

    return 0;
  });
}

function countHoles(board: Cell[][]): number {
  let holes = 0;

  for (let x = 0; x < BOARD_WIDTH; x++) {
    let foundBlock = false;

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (board[y][x].filled) {
        foundBlock = true;
      } else if (foundBlock) {
        holes++;
      }
    }
  }

  return holes;
}

function shapeKey(shape: number[][]): string {
  return shape.map((row) => row.join("")).join("|");
}
