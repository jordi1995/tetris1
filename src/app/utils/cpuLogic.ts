import { CpuProfile, PowerId } from "../data/characterPowers";
import { Cell, GameState, Piece, PlayerState } from "../types/game";
import { BOARD_HEIGHT, BOARD_WIDTH, clearLines, isValidPosition, lockPiece } from "./gameLogic";
import { movePiece, rotatePiece } from "./pieces";

export type CpuAction = "left" | "right" | "rotate" | "drop";

const SHIELD_POWERS = ["shield", "smoke_guard", "pillow_guard", "lunar_guard"];
const CLEAR_POWERS = ["clear_line", "tidy_sweep", "moonbeam_clear", "void_cleanse"];
const REPAIR_POWERS = ["pillow_patch"];
const TRANSFORM_POWERS = ["transform", "perfect_fit", "lucky_star", "phase_shift"];
const FREEZE_POWERS = ["freeze", "shadow_bind", "nightmare_pause"];
const SPEED_POWERS = ["speed_attack", "whisker_dash", "pounce_panic"];
const ATTACK_POWERS = ["claw_barrage", "battle_roar"];
const DRAIN_POWERS = ["power_theft"];
const TEMPO_POWERS = ["combo_spark"];

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

const DEFAULT_CPU_PROFILE: CpuProfile = {
  label: "Normal",
  moveInterval: 140,
  mistakeBias: 12,
  attackWeight: 1,
  survivalWeight: 1,
  powerCooldown: 2000,
};

export function getCpuMovePlan(state: PlayerState, profile: CpuProfile = DEFAULT_CPU_PROFILE): CpuMovePlan | null {
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

        const score = evaluateCandidate(candidate, profile);
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

export function getCpuAction(state: PlayerState, profile: CpuProfile = DEFAULT_CPU_PROFILE): CpuAction {
  const plan = getCpuMovePlan(state, profile);
  const piece = state.currentPiece;

  if (!plan || !piece) return "drop";
  if (piece.rotation !== plan.targetRotation) return "rotate";
  if (piece.position.x < plan.targetX) return "right";
  if (piece.position.x > plan.targetX) return "left";

  return "drop";
}

export function getCpuPowerAction(gameState: GameState, powerIds: PowerId[]): PowerId | null {
  const cpu = gameState.player2;
  const player = gameState.player1;
  if (cpu.powerMeter < 100 || cpu.isGameOver || powerIds.length === 0) return null;

  const cpuDanger = getBoardDanger(cpu.board);
  const playerDanger = getBoardDanger(player.board);
  const playerCanThreaten = player.powerMeter >= 80 || player.combo > 1 || player.attackQueue >= 2;
  const cpuHasShield = hasActiveEffect(cpu, "block_attack");
  const playerIsPressured = playerDanger.maxHeight >= 11 || player.combo === 0;

  const shieldPower = findKnownPower(powerIds, SHIELD_POWERS);
  if (shieldPower && !cpuHasShield && (cpuDanger.maxHeight >= 12 || playerCanThreaten)) {
    return shieldPower;
  }

  const clearPower = findKnownPower(powerIds, CLEAR_POWERS);
  if (clearPower && (cpuDanger.maxHeight >= 14 || cpuDanger.holes >= 5)) {
    return clearPower;
  }

  const repairPower = findKnownPower(powerIds, REPAIR_POWERS);
  if (repairPower && cpuDanger.holes >= 4) {
    return repairPower;
  }

  const transformPower = findKnownPower(powerIds, TRANSFORM_POWERS);
  if (transformPower && shouldTransformCurrentPiece(cpu)) {
    return transformPower;
  }

  const attackPower = findKnownPower(powerIds, ATTACK_POWERS);
  if (attackPower && playerDanger.maxHeight >= 7) {
    return attackPower;
  }

  const drainPower = findKnownPower(powerIds, DRAIN_POWERS);
  if (drainPower && player.powerMeter >= 55) {
    return drainPower;
  }

  const freezePower = findKnownPower(powerIds, FREEZE_POWERS);
  if (freezePower && playerIsPressured && !hasActiveEffect(player, "frozen")) {
    return freezePower;
  }

  const speedPower = findKnownPower(powerIds, SPEED_POWERS);
  if (speedPower && playerDanger.maxHeight >= 8 && !hasActiveEffect(player, "speed_up")) {
    return speedPower;
  }

  if (clearPower && cpuDanger.maxHeight >= 10 && cpuDanger.holes >= 3) {
    return clearPower;
  }

  const tempoPower = findKnownPower(powerIds, TEMPO_POWERS);
  if (tempoPower && !cpu.canHold) {
    return tempoPower;
  }

  return null;
}

function findKnownPower(powerIds: PowerId[], knownPowers: string[]): PowerId | null {
  return (knownPowers.find((powerId) => powerIds.includes(powerId)) as PowerId | undefined) ?? null;
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

function evaluateCandidate(candidate: Candidate, profile: CpuProfile): number {
  const heights = getColumnHeights(candidate.board);
  const aggregateHeight = heights.reduce((sum, height) => sum + height, 0);
  const maxHeight = Math.max(...heights);
  const bumpiness = heights.slice(1).reduce((sum, height, index) => sum + Math.abs(height - heights[index]), 0);
  const holes = countHoles(candidate.board);
  const dangerPenalty = maxHeight > 15 ? (maxHeight - 15) * 240 : 0;
  const imperfectPlayBias =
    Math.abs(candidate.piece.position.x * 31 + candidate.piece.rotation * 17 + candidate.piece.position.y * 13) %
    Math.max(1, profile.mistakeBias);

  return (
    candidate.linesCleared * 1200 * profile.attackWeight -
    holes * 460 * profile.survivalWeight -
    aggregateHeight * 24 * profile.survivalWeight -
    bumpiness * 38 -
    maxHeight * 18 * profile.survivalWeight -
    dangerPenalty * profile.survivalWeight +
    candidate.piece.position.y * 3 +
    imperfectPlayBias
  );
}

function getBoardDanger(board: Cell[][]): { maxHeight: number; holes: number } {
  const heights = getColumnHeights(board);
  return {
    maxHeight: Math.max(...heights),
    holes: countHoles(board),
  };
}

function shouldTransformCurrentPiece(state: PlayerState): boolean {
  const plan = getCpuMovePlan(state, DEFAULT_CPU_PROFILE);
  if (!plan) return false;

  const danger = getBoardDanger(state.board);
  return plan.score < -1250 || (danger.maxHeight >= 12 && plan.linesCleared === 0);
}

function hasActiveEffect(state: PlayerState, type: PlayerState["effects"][number]["type"]): boolean {
  return state.effects.some((effect) => effect.type === type && Date.now() - effect.startTime < effect.duration);
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
