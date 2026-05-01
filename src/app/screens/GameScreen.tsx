import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Pause, Play, Volume2, VolumeOff, Zap, Shield, Snowflake } from "lucide-react";
import { GameState, PlayerState, Effect, Piece, PowerType } from "../types/game";
import { characters } from "../data/characters";
import { powers } from "../data/powers";
import { GameBoard } from "../components/game/GameBoard";
import { HoldSlot } from "../components/game/HoldSlot";
import { NextPieces } from "../components/game/NextPieces";
import { getCpuAction } from "../utils/cpuLogic";
import {
  createInitialPlayerState,
  tryMove,
  tryRotate,
  hardDrop,
  holdPieceAction,
  isValidPosition,
  lockPiece,
  clearLines,
  addGarbageLines,
  calculateScore,
  calculateAttack,
} from "../utils/gameLogic";
import { createPiece, getRandomPieceType, movePiece } from "../utils/pieces";
import confetti from "canvas-confetti";

export function GameScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "vs-cpu";
  const p1Id = searchParams.get("p1") || "whiskers";
  const p2Id = searchParams.get("p2") || "shadow";
  const rankedOpponentName = searchParams.get("opponent") || "RIVAL ONLINE";
  const usesCpuOpponent = mode === "vs-cpu" || mode === "ranked" || mode === "puzzle" || mode === "chaos";
  const hasLocalSecondPlayer = mode === "vs-player" || mode === "coop";
  const playerTwoDisplayName = mode === "ranked" ? rankedOpponentName : usesCpuOpponent ? "CPU" : "JUGADOR 2";

  const p1Character = characters.find((character) => character.id === p1Id) || characters[0];
  const p2Character =
    p2Id === "cpu" ? characters[1] : characters.find((character) => character.id === p2Id) || characters[1];

  const [gameState, setGameState] = useState<GameState>({
    player1: createInitialPlayerState(p1Character),
    player2: createInitialPlayerState(p2Character),
    mode: mode as any,
    isPaused: false,
    winner: null,
    matchTime: 0,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [comboPopup, setComboPopup] = useState<{ player: 1 | 2; combo: number } | null>(null);
  const [attackPopup, setAttackPopup] = useState<{ player: 1 | 2; lines: number } | null>(null);
  const [shake, setShake] = useState<{ player1: boolean; player2: boolean }>({ player1: false, player2: false });

  const gameLoopRef = useRef<number>();
  const lastDropTimeRef = useRef<{ player1: number; player2: number }>({ player1: 0, player2: 0 });
  const lastCpuMoveTimeRef = useRef(0);
  const gameStartTimeRef = useRef<number>(Date.now());
  const cpuMoveInterval = 140;

  const getDropSpeed = (level: number, effects: Effect[]) => {
    const hasSpeedUp = effects.some((effect) => effect.type === "speed_up");
    const baseSpeed = Math.max(100, 1000 - (level - 1) * 50);
    return hasSpeedUp ? baseSpeed / 2 : baseSpeed;
  };

  const getGhostPiece = (state: PlayerState) => {
    if (!state.currentPiece) return null;

    let ghostPiece = state.currentPiece;
    while (isValidPosition(state.board, movePiece(ghostPiece, 0, 1))) {
      ghostPiece = movePiece(ghostPiece, 0, 1);
    }

    return ghostPiece;
  };

  const handleAutoDrop = useCallback(
    (playerKey: "player1" | "player2") => {
      setGameState((prev) => {
        if (prev.isPaused || prev.winner) return prev;

        const player = prev[playerKey];
        if (!player.currentPiece || player.isGameOver) return prev;

        const isFrozen = player.effects.some(
          (effect) => effect.type === "frozen" && Date.now() - effect.startTime < effect.duration,
        );
        if (isFrozen) return prev;

        const movedDown = tryMove(player, 0, 1);

        if (movedDown.currentPiece?.position.y === player.currentPiece.position.y) {
          const newBoard = lockPiece(player.board, player.currentPiece);
          const { board: clearedBoard, linesCleared } = clearLines(newBoard);
          const newCombo = linesCleared > 0 ? player.combo + 1 : 0;
          const attack = calculateAttack(linesCleared, newCombo);

          if (newCombo > 1) {
            setComboPopup({ player: playerKey === "player1" ? 1 : 2, combo: newCombo });
            setTimeout(() => setComboPopup(null), 2000);
          }

          if (attack > 0) {
            setAttackPopup({ player: playerKey === "player1" ? 1 : 2, lines: attack });
            setTimeout(() => setAttackPopup(null), 1500);

            if (attack >= 3) {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { x: playerKey === "player1" ? 0.3 : 0.7, y: 0.6 },
              });
            }
          }

          const nextPieces = [...player.nextPieces];
          const newCurrentPiece = nextPieces.shift()!;
          nextPieces.push(createPiece(getRandomPieceType(mode === "chaos")));

          const isGameOver = !isValidPosition(clearedBoard, newCurrentPiece);

          const updatedPlayer: PlayerState = {
            ...player,
            board: clearedBoard,
            currentPiece: isGameOver ? null : newCurrentPiece,
            nextPieces,
            score: player.score + calculateScore(linesCleared, newCombo, player.level),
            linesCleared: player.linesCleared + linesCleared,
            combo: newCombo,
            attackQueue: attack,
            powerMeter: Math.min(100, player.powerMeter + linesCleared * 10),
            canHold: true,
            isGameOver,
          };

          const opponentKey = playerKey === "player1" ? "player2" : "player1";
          const opponent = prev[opponentKey];
          const hasShield = opponent.effects.some(
            (effect) => effect.type === "block_attack" && Date.now() - effect.startTime < effect.duration,
          );

          let updatedOpponent = opponent;
          if (attack > 0 && !hasShield) {
            updatedOpponent = {
              ...opponent,
              board: addGarbageLines(opponent.board, attack),
            };

            setShake((current) => ({ ...current, [opponentKey]: true }));
            setTimeout(() => setShake((current) => ({ ...current, [opponentKey]: false })), 300);
          }

          const winner = isGameOver ? (playerKey === "player1" ? "player2" : "player1") : null;

          if (winner) {
            setTimeout(() => {
              const resultParams = new URLSearchParams({
                winner,
                mode,
                p1: p1Id,
                p2: p2Id,
              });

              if (mode === "ranked") {
                resultParams.set("opponent", rankedOpponentName);
              }

              navigate(`/result?${resultParams.toString()}`);
            }, 2000);
          }

          return {
            ...prev,
            [playerKey]: updatedPlayer,
            [opponentKey]: updatedOpponent,
            winner: winner as any,
          };
        }

        return {
          ...prev,
          [playerKey]: movedDown,
        };
      });
    },
    [mode, navigate, p1Id, p2Id, rankedOpponentName],
  );

  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (!gameState.isPaused && !gameState.winner) {
        const elapsedSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        if (elapsedSeconds !== gameState.matchTime) {
          setGameState((prev) => ({ ...prev, matchTime: elapsedSeconds }));
        }

        const dropSpeed1 = getDropSpeed(gameState.player1.level, gameState.player1.effects);
        if (timestamp - lastDropTimeRef.current.player1 > dropSpeed1) {
          handleAutoDrop("player1");
          lastDropTimeRef.current.player1 = timestamp;
        }

        const dropSpeed2 = getDropSpeed(gameState.player2.level, gameState.player2.effects);
        if (usesCpuOpponent) {
          if (timestamp - lastCpuMoveTimeRef.current > cpuMoveInterval) {
            handleCPUMove();
            lastCpuMoveTimeRef.current = timestamp;
          }

          if (timestamp - lastDropTimeRef.current.player2 > dropSpeed2) {
            handleAutoDrop("player2");
            lastDropTimeRef.current.player2 = timestamp;
          }
        } else if (timestamp - lastDropTimeRef.current.player2 > dropSpeed2) {
          handleAutoDrop("player2");
          lastDropTimeRef.current.player2 = timestamp;
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, handleAutoDrop, usesCpuOpponent]);

  const handleCPUMove = useCallback(() => {
    const player = gameState.player2;
    if (!player.currentPiece || player.isGameOver) return;

    const action = getCpuAction(player);

    if (action === "drop") {
      handleAutoDrop("player2");
      return;
    }

    setGameState((prev) => {
      const currentPlayer = prev.player2;
      if (!currentPlayer.currentPiece || currentPlayer.isGameOver) return prev;

      const nextPlayer =
        action === "left"
          ? tryMove(currentPlayer, -1, 0)
          : action === "right"
            ? tryMove(currentPlayer, 1, 0)
            : tryRotate(currentPlayer);

      return {
        ...prev,
        player2: nextPlayer,
      };
    });
  }, [gameState.player2, handleAutoDrop]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState.isPaused || gameState.winner) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setGameState((prev) => ({ ...prev, player1: tryMove(prev.player1, -1, 0) }));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setGameState((prev) => ({ ...prev, player1: tryMove(prev.player1, 1, 0) }));
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setGameState((prev) => ({ ...prev, player1: tryMove(prev.player1, 0, 1) }));
      } else if (event.key === " " || event.key === "ArrowUp") {
        event.preventDefault();
        setGameState((prev) => ({ ...prev, player1: tryRotate(prev.player1) }));
      } else if (event.key === "Shift") {
        event.preventDefault();
        setGameState((prev) => ({ ...prev, player1: hardDrop(prev.player1) }));
      } else if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        setGameState((prev) => ({ ...prev, player1: holdPieceAction(prev.player1) }));
      }

      if (hasLocalSecondPlayer) {
        if (event.key === "a" || event.key === "A") {
          event.preventDefault();
          setGameState((prev) => ({ ...prev, player2: tryMove(prev.player2, -1, 0) }));
        } else if (event.key === "d" || event.key === "D") {
          event.preventDefault();
          setGameState((prev) => ({ ...prev, player2: tryMove(prev.player2, 1, 0) }));
        } else if (event.key === "s" || event.key === "S") {
          event.preventDefault();
          setGameState((prev) => ({ ...prev, player2: tryMove(prev.player2, 0, 1) }));
        } else if (event.key === "w" || event.key === "W") {
          event.preventDefault();
          setGameState((prev) => ({ ...prev, player2: tryRotate(prev.player2) }));
        } else if (event.key === "q" || event.key === "Q") {
          event.preventDefault();
          setGameState((prev) => ({ ...prev, player2: hardDrop(prev.player2) }));
        } else if (event.key === "e" || event.key === "E") {
          event.preventDefault();
          setGameState((prev) => ({ ...prev, player2: holdPieceAction(prev.player2) }));
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.isPaused, gameState.winner, hasLocalSecondPlayer]);

  const activatePower = (playerKey: "player1" | "player2", powerId: string) => {
    setGameState((prev) => {
      const playerState = prev[playerKey];
      if (playerState.powerMeter < 100) return prev;

      const power = powers.find((entry) => entry.id === powerId);
      if (!power) return prev;

      const opponentKey = playerKey === "player1" ? "player2" : "player1";
      let updatedPlayer = { ...playerState, powerMeter: 0 };
      let updatedOpponent = prev[opponentKey];

      switch (powerId) {
        case "clear_line": {
          const { board: clearedBoard } = clearLines(playerState.board);
          updatedPlayer.board = clearedBoard;
          break;
        }
        case "shield":
          updatedPlayer.effects = [
            ...playerState.effects,
            { type: "block_attack", duration: 5000, startTime: Date.now() },
          ];
          break;
        case "speed_attack":
          updatedOpponent.effects = [
            ...updatedOpponent.effects,
            { type: "speed_up", duration: 3000, startTime: Date.now() },
          ];
          break;
        case "freeze":
          updatedOpponent.effects = [
            ...updatedOpponent.effects,
            { type: "frozen", duration: 2000, startTime: Date.now() },
          ];
          break;
        case "transform":
          if (updatedPlayer.currentPiece) {
            updatedPlayer.currentPiece = createPiece(getRandomPieceType(false));
          }
          break;
      }

      return {
        ...prev,
        [playerKey]: updatedPlayer,
        [opponentKey]: updatedOpponent,
      };
    });
  };

  const playerOneGhost = getGhostPiece(gameState.player1);
  const playerTwoGhost = getGhostPiece(gameState.player2);

  return (
    <div className="relative flex h-screen min-h-dvh flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.28),_transparent_34%),linear-gradient(145deg,#151433_0%,#3b1170_58%,#2d165b_100%)] px-2 py-2 max-[340px]:px-1 max-[340px]:py-1.5 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 22 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute h-2 w-2 rounded-full bg-white/18"
            initial={{ x: Math.random() * window.innerWidth, y: -20 }}
            animate={{ x: Math.random() * window.innerWidth, y: window.innerHeight + 20 }}
            transition={{
              duration: 12 + Math.random() * 8,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 4,
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 mx-auto mb-2 flex w-full max-w-[1600px] flex-none items-center justify-between gap-2 max-[340px]:mb-1.5 max-[340px]:gap-1.5 sm:mb-2.5 sm:gap-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <button
          onClick={() => navigate("/")}
          className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/16"
        >
          Menu
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))}
            className="rounded-2xl bg-white/10 p-2.5 text-white transition-colors hover:bg-white/16 sm:p-3"
          >
            {gameState.isPaused ? <Play className="h-4 w-4 sm:h-5 sm:w-5" /> : <Pause className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="rounded-2xl bg-white/10 p-2.5 text-white transition-colors hover:bg-white/16 sm:p-3"
          >
            {isMuted ? <VolumeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto min-h-0 w-full max-w-[1600px] flex-1">
        {usesCpuOpponent ? (
          <CpuFocusLayout
            player={gameState.player1}
            opponent={gameState.player2}
            playerDisplayName="JUGADOR 1"
            opponentDisplayName={playerTwoDisplayName}
            ghostPiece={playerOneGhost}
            opponentGhostPiece={playerTwoGhost}
            shake={shake.player1}
            opponentShake={shake.player2}
            powerMeter={gameState.player1.powerMeter}
            matchTime={gameState.matchTime}
            onActivatePower={(powerId) => activatePower("player1", powerId)}
          />
        ) : (
          <LocalVersusLayout
            playerOne={gameState.player1}
            playerTwo={gameState.player2}
            playerOneGhost={playerOneGhost}
            playerTwoGhost={playerTwoGhost}
            shake={shake}
            matchTime={gameState.matchTime}
            onActivatePower={activatePower}
          />
        )}
      </div>

      <AnimatePresence>
        {gameState.isPaused && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-[32px] bg-gradient-to-br from-purple-600 to-pink-600 p-8 text-center shadow-2xl sm:p-12"
              initial={{ scale: 0.84, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.84, y: 40 }}
            >
              <h2 className="text-4xl font-black text-white sm:text-6xl">PAUSA</h2>
              <p className="mt-3 text-sm text-white/80 sm:text-lg">Presiona ESC para volver a la partida</p>
              <button
                onClick={() => setGameState((prev) => ({ ...prev, isPaused: false }))}
                className="mt-8 rounded-2xl bg-white px-8 py-4 text-lg font-black text-purple-700 transition-transform hover:scale-105"
              >
                CONTINUAR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {comboPopup && (
          <motion.div
            className={`fixed ${comboPopup.player === 1 ? "left-[16%]" : "right-[16%]"} top-[20%] z-40`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
          >
            <div className="rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-3 text-xl font-black text-white shadow-2xl sm:text-3xl">
              {comboPopup.combo}x COMBO
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {attackPopup && (
          <motion.div
            className={`fixed ${attackPopup.player === 1 ? "left-[14%]" : "right-[14%]"} top-[30%] z-40`}
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -50 }}
          >
            <div className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 text-base font-black text-white shadow-2xl sm:text-xl">
              +{attackPopup.lines} ATAQUE
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative z-10 mx-auto mt-3 hidden flex-none max-w-[calc(100vw-1rem)] rounded-full bg-black/30 px-4 py-2 text-center text-[10px] font-medium text-white/85 backdrop-blur-sm sm:block sm:text-xs lg:text-sm"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        P1: Flechas, Espacio, Shift y C
        {hasLocalSecondPlayer && " | P2: WASD, W, Q y E"}
      </motion.div>
    </div>
  );
}

interface CpuFocusLayoutProps {
  player: PlayerState;
  opponent: PlayerState;
  playerDisplayName: string;
  opponentDisplayName: string;
  ghostPiece: PlayerState["currentPiece"];
  opponentGhostPiece: PlayerState["currentPiece"];
  shake: boolean;
  opponentShake: boolean;
  powerMeter: number;
  matchTime: number;
  onActivatePower: (powerId: string) => void;
}

interface LocalVersusLayoutProps {
  playerOne: PlayerState;
  playerTwo: PlayerState;
  playerOneGhost: PlayerState["currentPiece"];
  playerTwoGhost: PlayerState["currentPiece"];
  shake: { player1: boolean; player2: boolean };
  matchTime: number;
  onActivatePower: (playerKey: "player1" | "player2", powerId: string) => void;
}

interface VersusColumnProps {
  player: PlayerState;
  displayName: string;
  ghostPiece: PlayerState["currentPiece"];
  shake: boolean;
  accent: "blue" | "red";
  matchTime: number;
  onActivatePower: (powerId: string) => void;
}

interface PlayerHudProps {
  player: PlayerState;
  displayName: string;
  accent: "blue" | "red";
  cornerLabel?: string;
  compact?: boolean;
  statusChips?: Array<{ label: string; value: string; highlight?: boolean }>;
}

interface PlayerAreaProps {
  player: PlayerState;
  playerNumber: 1 | 2;
  displayName: string;
  ghostPiece: any;
  shake: boolean;
  onPowerActivate: (powerId: string) => void;
}

function PlayerArea({ player, playerNumber, displayName, ghostPiece, shake, onPowerActivate }: PlayerAreaProps) {
  const isPlayer2 = playerNumber === 2;

  return (
    <div className="relative grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2 sm:gap-3 lg:gap-4">
      <motion.div
        className={`rounded-xl bg-gradient-to-r p-2.5 shadow-xl sm:rounded-2xl sm:p-3 lg:p-4 ${
          isPlayer2 ? "from-red-500 to-pink-500" : "from-blue-500 to-cyan-500"
        }`}
        initial={{ x: isPlayer2 ? 50 : -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl lg:text-5xl">{player.character.emoji}</span>
            <div>
              <h3 className="text-xs font-black text-white sm:text-base lg:text-xl">{displayName}</h3>
              <p className="text-[10px] text-white/80 sm:text-xs lg:text-sm">{player.character.name}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-black text-white sm:text-xl lg:text-2xl">{player.score}</div>
            <div className="text-[9px] text-white/80 sm:text-[10px]">PUNTOS</div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1 sm:mt-3 sm:gap-2">
          <StatBadge label="Nivel" value={player.level} />
          <StatBadge label="Lineas" value={player.linesCleared} />
          <StatBadge label="Combo" value={player.combo} highlight={player.combo > 1} />
        </div>
      </motion.div>

      <div className="grid min-h-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-2 sm:gap-3 lg:gap-4">
        <div className="w-[60px] space-y-2 sm:w-[76px] sm:space-y-3 lg:w-[96px] lg:space-y-4">
          <HoldSlot piece={player.holdPiece} canHold={player.canHold} />
          <NextPieces pieces={player.nextPieces} />
        </div>

        <div className="flex min-h-0 flex-col items-center">
          <GameBoard
            board={player.board}
            currentPiece={player.currentPiece}
            ghostPiece={ghostPiece}
            isPlayer2={isPlayer2}
            shake={shake}
          />

          {player.effects.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:mt-3 sm:gap-2">
              {player.effects.map((effect, index) => {
                const remaining = Math.max(0, effect.duration - (Date.now() - effect.startTime));
                if (remaining <= 0) return null;

                return (
                  <motion.div
                    key={index}
                    className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    {effect.type === "frozen" && <Snowflake className="h-3 w-3 text-blue-400 sm:h-4 sm:w-4" />}
                    {effect.type === "speed_up" && <Zap className="h-3 w-3 text-yellow-400 sm:h-4 sm:w-4" />}
                    {effect.type === "block_attack" && <Shield className="h-3 w-3 text-green-400 sm:h-4 sm:w-4" />}
                    <span className="text-[10px] font-bold text-white sm:text-xs">{(remaining / 1000).toFixed(1)}s</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <PowerBar powerMeter={player.powerMeter} powers={powers} onActivate={onPowerActivate} isPlayer2={isPlayer2} />

      {player.isGameOver && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            <div className="mb-4 text-5xl sm:text-6xl">💀</div>
            <div className="text-2xl font-black text-white sm:text-3xl">GAME OVER</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatBadge({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg bg-white/20 px-1.5 py-1 sm:px-2 ${highlight ? "ring-2 ring-yellow-400" : ""}`}>
      <div className={`text-[9px] font-bold text-white sm:text-xs ${highlight ? "text-yellow-300" : ""}`}>{label}</div>
      <div className={`text-xs font-black text-white sm:text-sm lg:text-base ${highlight ? "text-yellow-300" : ""}`}>{value}</div>
    </div>
  );
}

function PowerBar({
  powerMeter,
  powers,
  onActivate,
}: {
  powerMeter: number;
  powers: any[];
  onActivate: (id: string) => void;
  isPlayer2: boolean;
}) {
  const canActivate = powerMeter >= 100;

  return (
    <motion.div
      className={`rounded-lg border-2 bg-gray-900/90 p-2 shadow-xl sm:rounded-xl sm:p-3 lg:p-4 ${
        canActivate ? "border-yellow-400" : "border-gray-600"
      }`}
      animate={
        canActivate
          ? {
              boxShadow: [
                "0 0 0px rgba(250, 204, 21, 0.5)",
                "0 0 30px rgba(250, 204, 21, 0.8)",
                "0 0 0px rgba(250, 204, 21, 0.5)",
              ],
            }
          : {}
      }
      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
    >
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <h4 className="text-[10px] font-black text-white sm:text-xs lg:text-sm">PODER ESPECIAL</h4>
        <span className="text-sm font-black text-yellow-400 sm:text-base lg:text-lg">{powerMeter}%</span>
      </div>

      <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-800 sm:mb-3 sm:h-3">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${powerMeter}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {powers.map((power) => (
          <button
            key={power.id}
            onClick={() => canActivate && onActivate(power.id)}
            disabled={!canActivate}
            className={`flex aspect-square items-center justify-center rounded-lg text-base transition-all sm:text-xl lg:text-2xl ${
              canActivate
                ? "bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg hover:scale-110"
                : "cursor-not-allowed bg-gray-700 opacity-50"
            }`}
            title={power.name}
          >
            {power.icon}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function CpuFocusLayout({
  player,
  opponent,
  playerDisplayName,
  opponentDisplayName,
  ghostPiece,
  opponentGhostPiece,
  shake,
  opponentShake,
  powerMeter,
  matchTime,
  onActivatePower,
}: CpuFocusLayoutProps) {
  return (
    <>
      <div className="grid h-full min-h-0 grid-rows-[132px_minmax(0,1fr)] gap-1.5 max-[380px]:grid-rows-[126px_minmax(0,1fr)] max-[340px]:grid-rows-[120px_minmax(0,1fr)] lg:hidden">
        <MobileBattleHud
          player={player}
          opponent={opponent}
          displayName={playerDisplayName}
          opponentDisplayName={opponentDisplayName}
          cornerLabel={formatMatchTime(matchTime)}
          opponentGhostPiece={opponentGhostPiece}
          opponentShake={opponentShake}
        />

        <section className="grid min-h-0 min-w-0 grid-rows-[46px_minmax(0,1fr)_44px] gap-1.5 overflow-hidden rounded-[28px] border border-white/12 bg-black/18 p-1.5 shadow-[0_20px_50px_rgba(5,0,28,0.28)] backdrop-blur-md max-[380px]:grid-rows-[42px_minmax(0,1fr)_40px] max-[340px]:gap-1 max-[340px]:p-1">
          <MobilePieceQueue holdPiece={player.holdPiece} canHold={player.canHold} nextPieces={player.nextPieces} />
          <div className="flex min-h-0 min-w-0 items-stretch justify-center overflow-hidden">
            <div className="relative flex w-full min-h-0 items-start justify-center overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,34,0.96),rgba(6,8,20,0.92))] px-1 py-1 max-[340px]:px-0.5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_44%)]" />
              <GameBoard
                board={player.board}
                currentPiece={player.currentPiece}
                ghostPiece={ghostPiece}
                shake={shake}
                size="hero-mobile"
                className="relative z-10 origin-center"
              />
              {player.isGameOver && <GameOverOverlay compact />}
            </div>
          </div>
          <MobilePowerStrip powerMeter={powerMeter} powers={powers} onActivate={onActivatePower} />
        </section>
      </div>

      <div className="hidden h-full min-h-0 gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_292px] xl:grid-cols-[minmax(0,1fr)_316px]">
        <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden rounded-[30px] border border-white/12 bg-black/18 p-2.5 shadow-[0_26px_70px_rgba(5,0,28,0.35)] backdrop-blur-md">
          <PlayerHud
            player={player}
            displayName={playerDisplayName}
            accent="blue"
            cornerLabel={`Tiempo ${formatMatchTime(matchTime)}`}
          />

          <div className="grid min-h-0 grid-cols-[82px_minmax(0,1fr)] gap-2 xl:grid-cols-[94px_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col gap-2">
              <HoldSlot piece={player.holdPiece} canHold={player.canHold} />
              <div className="min-h-0 flex-1">
                <NextPieces pieces={player.nextPieces} />
              </div>
            </div>

            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[22px] border border-white/10 bg-black/18 px-2.5 py-2">
                <div className="flex flex-wrap gap-2">
                  <MiniInfo label="Lineas" value={`${player.linesCleared}`} />
                  <MiniInfo label="Combo" value={`${player.combo}`} highlight={player.combo > 1} />
                  <MiniInfo label="Poder" value={`${powerMeter}%`} highlight={powerMeter >= 100} />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {player.effects.length > 0 ? (
                    player.effects.map((effect, index) => <EffectChip key={`${effect.type}-${index}`} effect={effect} />)
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                      Sin efectos activos
                    </span>
                  )}
                </div>
              </div>

              <div className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,34,0.96),rgba(6,8,20,0.9))] p-2">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_40%)]" />
                <GameBoard
                  board={player.board}
                  currentPiece={player.currentPiece}
                  ghostPiece={ghostPiece}
                  shake={shake}
                  size="hero"
                  className="relative z-10"
                />

                {player.isGameOver && <GameOverOverlay />}
              </div>
            </div>
          </div>
        </section>

        <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_152px] gap-2">
          <CpuPreviewCard
            player={opponent}
            displayName={opponentDisplayName}
            ghostPiece={opponentGhostPiece}
            shake={opponentShake}
          />
          <PowerDock powerMeter={powerMeter} powers={powers} onActivate={onActivatePower} variant="sidebar" />
        </aside>
      </div>
    </>
  );
}

function MobileCpuPreview({
  opponent,
  displayName,
  ghostPiece,
  shake,
  className = "",
}: {
  opponent: PlayerState;
  displayName: string;
  ghostPiece: PlayerState["currentPiece"];
  shake: boolean;
  className?: string;
}) {
  return (
    <section
      className={`grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-1 overflow-hidden rounded-[22px] border border-white/12 bg-black/26 p-1.5 shadow-[0_18px_40px_rgba(5,0,28,0.2)] backdrop-blur-md max-[340px]:p-1 ${className}`}
    >
      <div className="flex items-center justify-between gap-1 rounded-full border border-white/10 bg-black/40 px-1.5 py-1 backdrop-blur-sm max-[340px]:px-1 max-[340px]:py-0.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-[10px] max-[340px]:h-4 max-[340px]:w-4 max-[340px]:text-[9px]">
          {opponent.character.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[7px] font-bold uppercase tracking-[0.16em] text-white/55 max-[340px]:text-[6px]">{displayName}</p>
          <p className="truncate text-[9px] font-black text-white max-[340px]:text-[8px]">{opponent.character.name}</p>
        </div>
        <div className="min-w-[32px] text-right">
          <p className="text-[10px] font-black leading-none text-rose-100 max-[340px]:text-[9px]">{opponent.score}</p>
          <p className="text-[5px] font-bold uppercase tracking-[0.12em] text-white/45">Pts</p>
        </div>
      </div>

      <div className="flex min-h-0 items-start justify-center overflow-hidden rounded-[18px] border border-white/10 bg-black/16 p-[3px] max-[340px]:p-[2px]">
        <GameBoard
          board={opponent.board}
          currentPiece={opponent.currentPiece}
          ghostPiece={ghostPiece}
          isPlayer2
          shake={shake}
          size="mini-mobile"
          className="origin-center"
        />
      </div>
    </section>
  );
}

function MobileBattleHud({
  player,
  opponent,
  displayName,
  opponentDisplayName,
  cornerLabel,
  opponentGhostPiece,
  opponentShake,
}: {
  player: PlayerState;
  opponent: PlayerState;
  displayName: string;
  opponentDisplayName: string;
  cornerLabel: string;
  opponentGhostPiece: PlayerState["currentPiece"];
  opponentShake: boolean;
}) {
  return (
    <section
      className="grid min-h-0 gap-1.5 overflow-hidden rounded-[22px] border border-white/12 bg-black/24 p-1.5 shadow-[0_18px_42px_rgba(5,0,28,0.22)] backdrop-blur-md max-[340px]:gap-1 max-[340px]:p-1"
      style={{ gridTemplateColumns: "minmax(0, 1fr) 70px minmax(0, 1.25fr)" }}
    >
      <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-1 overflow-hidden rounded-[16px] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(37,99,235,0.86),rgba(6,182,212,0.58),rgba(14,116,144,0.34))] p-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-xl bg-black/15 text-sm shadow-inner max-[340px]:h-6 max-[340px]:w-6">
            {player.character.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-[7px] font-bold uppercase tracking-[0.18em] text-white/65 max-[340px]:text-[6px]">{displayName}</p>
            <h2 className="truncate text-xs font-black text-white max-[340px]:text-[11px]">{player.character.name}</h2>
          </div>
        </div>

        <div className="grid min-h-0 content-start gap-1" style={{ gridTemplateColumns: "repeat(2, minmax(0, 46px))" }}>
          <CompactMetric label="Puntos" value={player.score} />
          <CompactMetric label="Lineas" value={player.linesCleared} />
          <CompactMetric label="Combo" value={player.combo} />
        </div>
      </div>

      <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-none border border-white/10 bg-black/26 p-1.5">
        <GameBoard
          board={opponent.board}
          currentPiece={opponent.currentPiece}
          ghostPiece={opponentGhostPiece}
          isPlayer2
          shake={opponentShake}
          size="rival-mobile"
          borderless
        />
      </div>

      <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-1 overflow-hidden rounded-[16px] border border-rose-300/20 bg-black/26 p-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-xl bg-rose-500/20 text-sm shadow-inner max-[340px]:h-6 max-[340px]:w-6">
            {opponent.character.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-[7px] font-bold uppercase tracking-[0.16em] text-white/55 max-[340px]:text-[6px]">{opponentDisplayName}</p>
            <p className="truncate text-xs font-black text-white max-[340px]:text-[11px]">{opponent.character.name}</p>
          </div>
        </div>

        <div className="grid min-h-0 content-start gap-1" style={{ gridTemplateColumns: "repeat(2, minmax(0, 46px))" }}>
          <CompactMetric label="Tiempo" value={cornerLabel} tone="rose" />
          <CompactMetric label="Puntos" value={opponent.score} tone="rose" />
          <CompactMetric label="Lineas" value={opponent.linesCleared} tone="rose" />
        </div>
      </div>
    </section>
  );
}

function CompactMetric({ label, value, tone = "cyan" }: { label: string; value: string | number; tone?: "cyan" | "rose" }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/10 px-1 py-0.5 text-center">
      <div className="truncate text-[6px] font-bold uppercase tracking-[0.08em] text-white/50">{label}</div>
      <div className={`truncate text-[10px] font-black leading-tight ${tone === "rose" ? "text-rose-100" : "text-white"}`}>{value}</div>
    </div>
  );
}

function MobilePieceQueue({
  holdPiece,
  canHold,
  nextPieces,
}: {
  holdPiece: Piece | null;
  canHold: boolean;
  nextPieces: Piece[];
}) {
  return (
    <div className="grid min-h-0 gap-1.5 rounded-[18px] border border-white/10 bg-black/24 p-1.5" style={{ gridTemplateColumns: "68px minmax(0, 1fr)" }}>
      <div
        className={`grid min-h-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-1 rounded-xl border bg-gray-900/90 px-1.5 ${
          canHold ? "border-green-500" : "border-gray-600"
        }`}
      >
        <span className="text-[7px] font-black uppercase leading-none text-white">H</span>
        <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-lg bg-gray-800/80 py-1">
          {holdPiece ? <TinyPiece piece={holdPiece} /> : <span className="text-[8px] font-bold text-gray-600">Vacio</span>}
        </div>
      </div>

      <div className="grid min-h-0 items-center gap-1" style={{ gridTemplateColumns: "auto repeat(5, minmax(0, 1fr))" }}>
        <span className="text-[7px] font-black uppercase leading-none text-white/85">S</span>
        {nextPieces.slice(0, 5).map((piece, index) => (
          <motion.div
            key={`${piece.type}-${index}`}
            className="flex h-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-xl border border-purple-500/45 bg-gray-900/90 px-1"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.04 }}
          >
            <TinyPiece piece={piece} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TinyPiece({ piece }: { piece: Piece }) {
  return (
    <div
      className="grid gap-[2px]"
      style={{
        gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)`,
      }}
    >
      {piece.shape.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className="rounded-[2px]"
            style={{
              width: "clamp(5px, 1.45vw, 8px)",
              height: "clamp(5px, 1.45vw, 8px)",
              backgroundColor: cell ? piece.color : "transparent",
              boxShadow: cell ? `0 0 4px ${piece.color}` : "none",
            }}
          />
        )),
      )}
    </div>
  );
}

function MobilePowerStrip({
  powerMeter,
  powers,
  onActivate,
}: {
  powerMeter: number;
  powers: PowerType[];
  onActivate: (id: string) => void;
}) {
  const canActivate = powerMeter >= 100;

  return (
    <motion.section
      className={`grid min-h-0 gap-1.5 overflow-hidden rounded-[18px] border bg-gray-900/90 p-1.5 shadow-xl ${
        canActivate ? "border-yellow-300" : "border-purple-500"
      }`}
      style={{ gridTemplateColumns: "42px minmax(0, 1fr)" }}
      animate={
        canActivate
          ? {
              boxShadow: [
                "0 0 0px rgba(250,204,21,0.45)",
                "0 0 20px rgba(250,204,21,0.58)",
                "0 0 0px rgba(250,204,21,0.45)",
              ],
            }
          : {}
      }
      transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
    >
      <div className="flex min-w-0 flex-col justify-center">
        <p className="text-[6px] font-black uppercase leading-none tracking-[0.08em] text-white/55">Poder</p>
        <div className="mt-0.5 text-sm font-black leading-none text-yellow-300">{powerMeter}%</div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${powerMeter}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="grid min-h-0 gap-1" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
        {powers.map((power) => (
          <button
            key={power.id}
            onClick={() => canActivate && onActivate(power.id)}
            disabled={!canActivate}
            className={`flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-xl border text-[12px] transition-all ${
              canActivate
                ? "border-yellow-200/70 bg-gradient-to-br from-yellow-300 to-orange-500 text-slate-950 shadow-lg"
                : "cursor-not-allowed border-white/8 bg-white/5 text-white/35"
            }`}
            title={power.name}
          >
            <span className="drop-shadow-sm">{power.icon}</span>
          </button>
        ))}
      </div>
    </motion.section>
  );
}

function MobilePlayerHud({
  player,
  displayName,
  accent,
  cornerLabel,
  statusChips,
}: Pick<PlayerHudProps, "player" | "displayName" | "accent" | "cornerLabel" | "statusChips">) {
  const shell =
    accent === "red"
      ? "border-rose-300/20 bg-[linear-gradient(135deg,rgba(255,71,112,0.9),rgba(244,63,94,0.7),rgba(157,23,77,0.48))]"
      : "border-cyan-300/20 bg-[linear-gradient(135deg,rgba(37,99,235,0.88),rgba(6,182,212,0.72),rgba(14,116,144,0.48))]";

  return (
    <motion.div
      className={`rounded-[22px] border p-1.5 shadow-lg ${shell}`}
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-xl bg-black/15 text-sm shadow-inner">
            {player.character.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-[7px] font-bold uppercase tracking-[0.22em] text-white/68">{displayName}</p>
            <h2 className="truncate text-xs font-black text-white">{player.character.name}</h2>
          </div>
        </div>

        <div className="text-right">
          {cornerLabel && (
            <div className="mb-0.5 inline-flex rounded-full bg-white/14 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-cyan-50">
              {cornerLabel}
            </div>
          )}
          <div className="text-sm font-black leading-none text-white">{player.score}</div>
          <div className="text-[7px] font-bold uppercase tracking-[0.16em] text-white/60">Puntos</div>
        </div>
      </div>

      {statusChips && (
        <div className="mt-1 grid grid-cols-3 gap-1">
          {statusChips.map((chip) => (
            <div
              key={chip.label}
              className={`rounded-xl border px-1.5 py-0.5 ${
                chip.highlight ? "border-yellow-300/65 bg-yellow-300/14 text-yellow-100" : "border-white/10 bg-white/10 text-white"
              }`}
            >
              <div className="text-[6px] font-bold uppercase tracking-[0.14em] text-white/60">{chip.label}</div>
              <div className="text-[11px] font-black leading-tight">{chip.value}</div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function LocalVersusLayout({
  playerOne,
  playerTwo,
  playerOneGhost,
  playerTwoGhost,
  shake,
  matchTime,
  onActivatePower,
}: LocalVersusLayoutProps) {
  return (
    <div className="grid h-full min-h-0 grid-cols-2 gap-3">
      <VersusColumn
        player={playerOne}
        displayName="JUGADOR 1"
        ghostPiece={playerOneGhost}
        shake={shake.player1}
        accent="blue"
        matchTime={matchTime}
        onActivatePower={(powerId) => onActivatePower("player1", powerId)}
      />
      <VersusColumn
        player={playerTwo}
        displayName="JUGADOR 2"
        ghostPiece={playerTwoGhost}
        shake={shake.player2}
        accent="red"
        matchTime={matchTime}
        onActivatePower={(powerId) => onActivatePower("player2", powerId)}
      />
    </div>
  );
}

function VersusColumn({
  player,
  displayName,
  ghostPiece,
  shake,
  accent,
  matchTime,
  onActivatePower,
}: VersusColumnProps) {
  const isPlayer2 = accent === "red";

  return (
    <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-[28px] border border-white/12 bg-black/18 p-3 shadow-[0_20px_50px_rgba(5,0,28,0.25)] backdrop-blur-md">
      <PlayerHud
        player={player}
        displayName={displayName}
        accent={accent}
        cornerLabel={formatMatchTime(matchTime)}
      />

      <div className="grid min-h-0 gap-3 xl:grid-cols-[92px_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-3">
          <HoldSlot piece={player.holdPiece} canHold={player.canHold} />
          <div className="min-h-0 flex-1">
            <NextPieces pieces={player.nextPieces} />
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[22px] border border-white/10 bg-black/16 px-3 py-2.5">
            <div className="flex flex-wrap gap-2">
              <MiniInfo label="Lineas" value={`${player.linesCleared}`} />
              <MiniInfo label="Combo" value={`${player.combo}`} highlight={player.combo > 1} />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {player.effects.slice(0, 2).map((effect, index) => (
                <EffectChip key={`${effect.type}-${index}`} effect={effect} compact />
              ))}
            </div>
          </div>

          <div className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,34,0.96),rgba(6,8,20,0.9))] p-2">
            <GameBoard
              board={player.board}
              currentPiece={player.currentPiece}
              ghostPiece={ghostPiece}
              isPlayer2={isPlayer2}
              shake={shake}
              size="standard"
            />

            {player.isGameOver && <GameOverOverlay compact />}
          </div>
        </div>
      </div>

      <PowerDock powerMeter={player.powerMeter} powers={powers} onActivate={onActivatePower} variant="row" />
    </section>
  );
}

function PlayerHud({ player, displayName, accent, cornerLabel, compact = false, statusChips }: PlayerHudProps) {
  const mobileCompact = compact && Boolean(statusChips);
  const theme =
    accent === "red"
      ? {
          shell:
            "border-rose-300/20 bg-[linear-gradient(135deg,rgba(255,71,112,0.9),rgba(244,63,94,0.65),rgba(157,23,77,0.45))]",
          glow: "text-rose-100",
          badge: "bg-white/14 text-rose-50",
        }
      : {
          shell:
            "border-cyan-300/20 bg-[linear-gradient(135deg,rgba(37,99,235,0.88),rgba(6,182,212,0.7),rgba(14,116,144,0.45))]",
          glow: "text-cyan-50",
          badge: "bg-white/14 text-cyan-50",
        };

  return (
    <motion.div
      className={`border shadow-lg ${mobileCompact ? "rounded-[22px] p-1.5" : `rounded-[26px] ${compact ? "p-1.5 sm:p-2.5" : "p-2.5 sm:p-3"}`} ${theme.shell}`}
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className={`flex items-start justify-between ${mobileCompact ? "gap-1.5" : compact ? "gap-2" : "gap-3"}`}>
        <div className={`flex items-center ${mobileCompact ? "gap-1.5" : compact ? "gap-2" : "gap-3"}`}>
          <div
            className={`flex items-center justify-center rounded-2xl bg-black/15 shadow-inner ${
              mobileCompact
                ? "h-7 w-7 text-sm"
                : compact
                  ? "h-8 w-8 text-base sm:h-12 sm:w-12 sm:text-2xl"
                  : "h-12 w-12 text-2xl sm:h-14 sm:w-14 sm:text-3xl"
            }`}
          >
            {player.character.emoji}
          </div>

          <div className="min-w-0">
            <p className={`font-bold uppercase tracking-[0.24em] text-white/70 ${compact ? "text-[8px] sm:text-[10px]" : "text-[10px]"}`}>
              {displayName}
            </p>
            <h2 className={`truncate font-black text-white ${mobileCompact ? "text-xs" : compact ? "text-[13px] sm:text-base" : "text-base sm:text-xl"}`}>
              {player.character.name}
            </h2>
          </div>
        </div>

        <div className="text-right">
          {cornerLabel && (
            <div
              className={`mb-1 inline-flex rounded-full font-bold uppercase tracking-[0.18em] ${theme.badge} ${
                mobileCompact ? "px-2 py-0.5 text-[8px]" : compact ? "px-2.5 py-1 text-[9px]" : "px-3 py-1 text-[10px]"
              }`}
            >
              {cornerLabel}
            </div>
          )}
          <div className={`font-black text-white ${mobileCompact ? "text-sm" : compact ? "text-base sm:text-2xl" : "text-2xl sm:text-3xl"} ${theme.glow}`}>
            {player.score}
          </div>
          <div className={`font-bold uppercase tracking-[0.2em] text-white/65 ${compact ? "text-[8px] sm:text-[10px]" : "text-[10px]"}`}>
            Puntos
          </div>
        </div>
      </div>

      {statusChips ? (
        <div className={`${mobileCompact ? "mt-1" : "mt-1.5 sm:mt-2"} grid grid-cols-3 gap-1`}>
          {statusChips.map((chip) => (
            <div
              key={chip.label}
              className={`border px-1.5 ${mobileCompact ? "rounded-xl py-0.5" : "rounded-2xl py-1"} ${
                chip.highlight ? "border-yellow-300/65 bg-yellow-300/14 text-yellow-100" : "border-white/10 bg-white/10 text-white"
              }`}
            >
              <div className={`${mobileCompact ? "text-[6px]" : "text-[7px] sm:text-[8px]"} font-bold uppercase tracking-[0.14em] text-white/60`}>
                {chip.label}
              </div>
              <div className={`${mobileCompact ? "text-[11px]" : "mt-0.5 text-xs sm:text-sm"} font-black`}>{chip.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${compact ? "mt-2 hidden sm:grid" : "mt-2.5 grid"} grid-cols-3 gap-1.5`}>
          <HudStat label="Nivel" value={player.level} />
          <HudStat label="Lineas" value={player.linesCleared} />
          <HudStat label="Combo" value={player.combo} highlight={player.combo > 1} />
        </div>
      )}
    </motion.div>
  );
}

function CpuPreviewCard({
  player,
  displayName,
  ghostPiece,
  shake,
}: {
  player: PlayerState;
  displayName: string;
  ghostPiece: PlayerState["currentPiece"];
  shake: boolean;
}) {
  return (
    <section className="grid h-full min-h-0 gap-2 rounded-[28px] border border-white/12 bg-black/20 p-2.5 shadow-[0_18px_40px_rgba(5,0,28,0.2)] backdrop-blur-md sm:gap-3 sm:p-4">
      <PlayerHud player={player} displayName={displayName} accent="red" compact />

      <div className="grid min-h-0 gap-2 sm:grid-cols-[minmax(0,1fr)_110px] sm:gap-3">
        <div className="rounded-[24px] border border-white/10 bg-black/18 p-2 sm:p-3">
          <div className="mb-2 flex items-center justify-between sm:mb-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">Pantalla rival</span>
            <span className="rounded-full bg-white/8 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/70 sm:text-[10px]">
              Mini
            </span>
          </div>

          <div className="flex justify-center">
            <GameBoard
              board={player.board}
              currentPiece={player.currentPiece}
              ghostPiece={ghostPiece}
              isPlayer2
              shake={shake}
              size="mini"
            />
          </div>
        </div>

        <div className="hidden flex-col gap-2 sm:flex">
          <MiniInfo label="Lineas" value={`${player.linesCleared}`} />
          <MiniInfo label="Combo" value={`${player.combo}`} highlight={player.combo > 1} />
          <MiniInfo label="Nivel" value={`${player.level}`} />
        </div>
      </div>

      {player.effects.length > 0 && (
        <div className="hidden flex-wrap gap-2 sm:flex">
          {player.effects.map((effect, index) => (
            <EffectChip key={`${effect.type}-${index}`} effect={effect} compact />
          ))}
        </div>
      )}
    </section>
  );
}

function HudStat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl bg-white/12 px-2.5 py-1.5 ${highlight ? "ring-2 ring-yellow-300/80" : ""}`}>
      <div className={`text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 ${highlight ? "text-yellow-100" : ""}`}>
        {label}
      </div>
      <div className={`mt-0.5 text-base font-black text-white sm:text-lg ${highlight ? "text-yellow-200" : ""}`}>{value}</div>
    </div>
  );
}

function MiniInfo({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-full border px-2.5 py-1 text-center ${
        highlight ? "border-yellow-300/60 bg-yellow-300/12 text-yellow-100" : "border-white/10 bg-white/6 text-white"
      }`}
    >
      <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">{label}</div>
      <div className="text-xs font-black sm:text-base">{value}</div>
    </div>
  );
}

function EffectChip({ effect, compact = false }: { effect: Effect; compact?: boolean }) {
  const remaining = Math.max(0, effect.duration - (Date.now() - effect.startTime));
  if (remaining <= 0) return null;

  const content = getEffectPresentation(effect.type);

  return (
    <motion.div
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-white ${
        compact ? "text-[10px]" : "text-xs"
      }`}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {content.icon}
      <span className="font-bold uppercase tracking-[0.12em]">{content.label}</span>
      <span className="rounded-full bg-black/20 px-2 py-0.5 font-black">{(remaining / 1000).toFixed(1)}s</span>
    </motion.div>
  );
}

function PowerDock({
  powerMeter,
  powers,
  onActivate,
  variant,
}: {
  powerMeter: number;
  powers: PowerType[];
  onActivate: (id: string) => void;
  variant: "sidebar" | "row" | "mobile";
}) {
  const canActivate = powerMeter >= 100;

  return (
    <motion.section
      className={`flex min-h-0 h-full flex-col rounded-[28px] border bg-[linear-gradient(180deg,rgba(8,13,31,0.95),rgba(16,23,46,0.9))] shadow-[0_18px_40px_rgba(5,0,28,0.2)] backdrop-blur-md ${
        variant === "row" ? "p-3 sm:p-4" : variant === "mobile" ? "p-2" : "p-2.5 sm:p-3"
      } ${
        canActivate ? "border-yellow-300/65" : "border-white/12"
      }`}
      animate={
        canActivate
          ? {
              boxShadow: [
                "0 18px 40px rgba(5,0,28,0.2)",
                "0 18px 40px rgba(234,179,8,0.34)",
                "0 18px 40px rgba(5,0,28,0.2)",
              ],
            }
          : {}
      }
      transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`font-bold uppercase tracking-[0.24em] text-white/55 ${variant === "mobile" ? "text-[9px]" : "text-[10px]"}`}>
            Poder especial
          </p>
          <h3
            className={`mt-1 font-black text-white ${
              variant === "row" ? "text-lg sm:text-xl" : variant === "sidebar" ? "text-base sm:text-lg" : "text-sm"
            }`}
          >
            {variant === "mobile" ? "Poder listo" : canActivate ? "Listo para usar" : "Cargando energia"}
          </h3>
        </div>

        <div className="text-right">
        <div
          className={`font-black text-yellow-300 ${
              variant === "row" ? "text-2xl sm:text-3xl" : variant === "sidebar" ? "text-xl sm:text-2xl" : "text-lg"
            }`}
        >
          {powerMeter}%
        </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Carga</div>
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-full bg-white/8 ${
          variant === "row" ? "mt-3 h-2.5" : variant === "sidebar" ? "mt-2.5 h-2" : "mt-1.5 h-1.5"
        }`}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${powerMeter}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div
        className={`grid flex-1 gap-2 ${
          variant === "mobile" ? "mt-1.5 grid-cols-5 items-center gap-1" : variant === "sidebar" ? "mt-3 grid-cols-5" : "mt-4 grid-cols-5"
        }`}
        style={variant === "mobile" ? { gridTemplateColumns: "repeat(5, minmax(0, 1fr))" } : undefined}
      >
        {powers.map((power) => (
          <button
            key={power.id}
            onClick={() => canActivate && onActivate(power.id)}
            disabled={!canActivate}
            className={`group flex items-center justify-center rounded-2xl border transition-all ${
              variant === "mobile"
                ? "h-9 w-full min-h-0 min-w-0 rounded-xl text-[11px] max-[340px]:h-8"
                : variant === "sidebar"
                  ? "min-h-[44px] text-lg sm:min-h-[48px] sm:text-xl"
                  : "min-h-[58px] text-xl sm:text-2xl"
            } ${
              canActivate
                ? "border-yellow-200/70 bg-gradient-to-br from-yellow-300 to-orange-500 text-slate-950 shadow-lg hover:-translate-y-1 hover:shadow-yellow-300/30"
                : "cursor-not-allowed border-white/8 bg-white/5 text-white/35"
            }`}
            title={power.name}
          >
            <span className="drop-shadow-sm">{power.icon}</span>
          </button>
        ))}
      </div>
    </motion.section>
  );
}

function GameOverOverlay({ compact = false }: { compact?: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/72"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center">
        <div className={`${compact ? "text-4xl" : "text-5xl sm:text-6xl"}`}>💀</div>
        <div className={`mt-2 font-black text-white ${compact ? "text-xl" : "text-2xl sm:text-3xl"}`}>GAME OVER</div>
      </div>
    </motion.div>
  );
}

function getEffectPresentation(type: Effect["type"]) {
  switch (type) {
    case "frozen":
      return {
        label: "Hielo",
        icon: <Snowflake className="h-3.5 w-3.5 text-blue-300" />,
      };
    case "speed_up":
      return {
        label: "Turbo",
        icon: <Zap className="h-3.5 w-3.5 text-yellow-300" />,
      };
    case "block_attack":
      return {
        label: "Escudo",
        icon: <Shield className="h-3.5 w-3.5 text-emerald-300" />,
      };
    case "mirror":
      return {
        label: "Espejo",
        icon: <span className="text-[11px]">MI</span>,
      };
    case "shake":
      return {
        label: "Temblor",
        icon: <span className="text-[11px]">VS</span>,
      };
    default:
      return {
        label: "Efecto",
        icon: <span className="text-[11px]">FX</span>,
      };
  }
}

function formatMatchTime(matchTime: number) {
  const minutes = Math.floor(matchTime / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (matchTime % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}
