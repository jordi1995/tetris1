import { PlayerState } from "../types/game";
import { addGarbageLines, isValidPosition } from "./gameLogic";
import { createPiece, getRandomPieceType, movePiece } from "./pieces";

export type ChaosEventId =
  | "speed_boost"
  | "slow_motion"
  | "hidden_next"
  | "garbage_row"
  | "board_shake"
  | "piece_swap"
  | "cat_sit"
  | "cat_push"
  | "cat_steals_next"
  | "cat_color_chaos"
  | "cat_meow_random";

export interface ChaosState {
  message: string | null;
  messageUntil: number;
  speedMultiplier: number;
  speedUntil: number;
  hiddenNextUntil: number;
  boardShakeUntil: number;
  catSitUntil: number;
  catColorChaosUntil: number;
  catStealsNextUntil: number;
  lastEventId: ChaosEventId | null;
}

export const initialChaosState: ChaosState = {
  message: null,
  messageUntil: 0,
  speedMultiplier: 1,
  speedUntil: 0,
  hiddenNextUntil: 0,
  boardShakeUntil: 0,
  catSitUntil: 0,
  catColorChaosUntil: 0,
  catStealsNextUntil: 0,
  lastEventId: null,
};

const CHAOS_EVENTS: ChaosEventId[] = [
  "speed_boost",
  "slow_motion",
  "hidden_next",
  "garbage_row",
  "board_shake",
  "piece_swap",
  "cat_sit",
  "cat_push",
  "cat_steals_next",
  "cat_color_chaos",
  "cat_meow_random",
];

const MEOW_EVENTS: ChaosEventId[] = [
  "speed_boost",
  "slow_motion",
  "hidden_next",
  "garbage_row",
  "board_shake",
  "piece_swap",
  "cat_push",
  "cat_steals_next",
  "cat_color_chaos",
];

// La cadencia baja con el tiempo para que Caos escale sin tocar el modo normal.
export function getChaosEventInterval(matchTime: number): number {
  if (matchTime >= 120) return 15_000;
  if (matchTime >= 60) return 20_000;
  return 25_000;
}

export function chooseChaosEvent(exclude?: ChaosEventId | null): ChaosEventId {
  const candidates = CHAOS_EVENTS.filter((eventId) => eventId !== exclude);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Limpia solo los efectos temporales controlados por el reloj del modo Caos.
export function cleanChaosState(state: ChaosState, now: number): ChaosState {
  return {
    ...state,
    message: state.messageUntil > now ? state.message : null,
    speedMultiplier: state.speedUntil > now ? state.speedMultiplier : 1,
  };
}

export function getChaosDropSpeed(baseSpeed: number, state: ChaosState, now: number): number {
  return Math.max(70, baseSpeed * (state.speedUntil > now ? state.speedMultiplier : 1));
}

export function isNextPieceHidden(state: ChaosState, now: number): boolean {
  return state.hiddenNextUntil > now || state.catStealsNextUntil > now;
}

// Cada evento devuelve una copia del jugador y del estado visual/temporal de Caos.
export function applyChaosEvent(
  player: PlayerState,
  state: ChaosState,
  now: number,
  eventId: ChaosEventId = chooseChaosEvent(state.lastEventId),
): { player: PlayerState; chaos: ChaosState } {
  const withMessage = (message: string, patch: Partial<ChaosState> = {}) => ({
    player,
    chaos: {
      ...state,
      ...patch,
      message,
      messageUntil: now + 2800,
      lastEventId: eventId,
    },
  });

  switch (eventId) {
    case "speed_boost":
      return withMessage("Speed Boost!", { speedMultiplier: 0.45, speedUntil: now + 6500 });
    case "slow_motion":
      return withMessage("Slow Motion!", { speedMultiplier: 1.75, speedUntil: now + 6500 });
    case "hidden_next":
      return withMessage("Next piece hidden!", { hiddenNextUntil: now + 6500 });
    case "garbage_row":
      return {
        player: liftPieceUntilValid({
          ...player,
          board: addGarbageLines(player.board, 1),
        }),
        chaos: {
          ...state,
          message: "Garbage row!",
          messageUntil: now + 2800,
          lastEventId: eventId,
        },
      };
    case "board_shake":
      return withMessage("Board shake!", { boardShakeUntil: now + 4200 });
    case "piece_swap":
      return swapCurrentPiece(player, state, now, eventId, "Piece swapped!");
    case "cat_sit":
      return withMessage("The cat is blocking your view!", { catSitUntil: now + 5200 });
    case "cat_push":
      return pushCurrentPiece(player, state, now, eventId);
    case "cat_steals_next":
      return stealNextPiece(player, state, now, eventId);
    case "cat_color_chaos":
      return withMessage("Cat color chaos!", { catColorChaosUntil: now + 6500 });
    case "cat_meow_random":
      return applyMeowChaos(player, state, now);
  }
}

function liftPieceUntilValid(player: PlayerState): PlayerState {
  if (!player.currentPiece || isValidPosition(player.board, player.currentPiece)) return player;

  let liftedPiece = player.currentPiece;
  const maxLift = liftedPiece.shape.length + 3;

  for (let lift = 0; lift < maxLift; lift++) {
    liftedPiece = movePiece(liftedPiece, 0, -1);
    if (isValidPosition(player.board, liftedPiece)) {
      return {
        ...player,
        currentPiece: liftedPiece,
      };
    }
  }

  return player;
}

function swapCurrentPiece(
  player: PlayerState,
  state: ChaosState,
  now: number,
  eventId: ChaosEventId,
  message: string,
): { player: PlayerState; chaos: ChaosState } {
  if (!player.currentPiece) {
    return { player, chaos: { ...state, message, messageUntil: now + 2800, lastEventId: eventId } };
  }

  const replacement = createPiece(getRandomPieceType(true));
  const centeredReplacement = {
    ...replacement,
    position: player.currentPiece.position,
  };

  return {
    player: isValidPosition(player.board, centeredReplacement)
      ? { ...player, currentPiece: centeredReplacement }
      : player,
    chaos: {
      ...state,
      message,
      messageUntil: now + 2800,
      lastEventId: eventId,
    },
  };
}

function pushCurrentPiece(
  player: PlayerState,
  state: ChaosState,
  now: number,
  eventId: ChaosEventId,
): { player: PlayerState; chaos: ChaosState } {
  if (!player.currentPiece) {
    return { player, chaos: { ...state, message: "The cat pushed your piece!", messageUntil: now + 2800, lastEventId: eventId } };
  }

  const direction = Math.random() < 0.5 ? -1 : 1;
  const pushedPiece = movePiece(player.currentPiece, direction, 0);

  return {
    player: isValidPosition(player.board, pushedPiece) ? { ...player, currentPiece: pushedPiece } : player,
    chaos: {
      ...state,
      message: "The cat pushed your piece!",
      messageUntil: now + 2800,
      lastEventId: eventId,
    },
  };
}

function stealNextPiece(
  player: PlayerState,
  state: ChaosState,
  now: number,
  eventId: ChaosEventId,
): { player: PlayerState; chaos: ChaosState } {
  const nextPieces = [...player.nextPieces];
  if (nextPieces.length > 0) {
    nextPieces[0] = createPiece(getRandomPieceType(true));
  }

  return {
    player: { ...player, nextPieces },
    chaos: {
      ...state,
      message: "The cat stole the next piece!",
      messageUntil: now + 2800,
      catStealsNextUntil: now + 4200,
      lastEventId: eventId,
    },
  };
}

function applyMeowChaos(player: PlayerState, state: ChaosState, now: number): { player: PlayerState; chaos: ChaosState } {
  const meowEvent = MEOW_EVENTS[Math.floor(Math.random() * MEOW_EVENTS.length)];
  const result = applyChaosEvent(player, state, now, meowEvent);

  return {
    player: result.player,
    chaos: {
      ...result.chaos,
      message: "Meow chaos!",
      messageUntil: now + 2800,
      lastEventId: "cat_meow_random",
    },
  };
}
