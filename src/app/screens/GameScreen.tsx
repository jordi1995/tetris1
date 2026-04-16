import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Pause, Play, Volume2, VolumeOff, Trophy, Zap, Shield, Snowflake, Sparkles } from "lucide-react";
import { GameState, PlayerState, Effect } from "../types/game";
import { characters } from "../data/characters";
import { powers } from "../data/powers";
import { GameBoard } from "../components/game/GameBoard";
import { HoldSlot } from "../components/game/HoldSlot";
import { NextPieces } from "../components/game/NextPieces";
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

  const p1Character = characters.find((c) => c.id === p1Id) || characters[0];
  const p2Character = p2Id === "cpu" ? characters[1] : characters.find((c) => c.id === p2Id) || characters[1];

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
  const gameStartTimeRef = useRef<number>(Date.now());

  // Drop speed basado en nivel
  const getDropSpeed = (level: number, effects: Effect[]) => {
    const hasSpeedUp = effects.some((e) => e.type === "speed_up");
    const baseSpeed = Math.max(100, 1000 - (level - 1) * 50);
    return hasSpeedUp ? baseSpeed / 2 : baseSpeed;
  };

  // Calcular ghost piece (posición de caída)
  const getGhostPiece = (state: PlayerState) => {
    if (!state.currentPiece) return null;
    let ghostPiece = state.currentPiece;
    while (isValidPosition(state.board, movePiece(ghostPiece, 0, 1))) {
      ghostPiece = movePiece(ghostPiece, 0, 1);
    }
    return ghostPiece;
  };

  // Manejar drop automático
  const handleAutoDrop = useCallback((playerKey: "player1" | "player2") => {
    setGameState((prev) => {
      if (prev.isPaused || prev.winner) return prev;

      const player = prev[playerKey];
      if (!player.currentPiece || player.isGameOver) return prev;

      // Check if frozen
      const isFrozen = player.effects.some((e) => e.type === "frozen" && Date.now() - e.startTime < e.duration);
      if (isFrozen) return prev;

      const movedDown = tryMove(player, 0, 1);

      // Si no puede moverse más, lockear la pieza
      if (movedDown.currentPiece?.position.y === player.currentPiece.position.y) {
        const newBoard = lockPiece(player.board, player.currentPiece);
        const { board: clearedBoard, linesCleared } = clearLines(newBoard);

        // Calcular nuevo combo
        const newCombo = linesCleared > 0 ? player.combo + 1 : 0;

        // Calcular ataque
        const attack = calculateAttack(linesCleared, newCombo);

        // Mostrar popup de combo
        if (newCombo > 1) {
          setComboPopup({ player: playerKey === "player1" ? 1 : 2, combo: newCombo });
          setTimeout(() => setComboPopup(null), 2000);
        }

        // Mostrar popup de ataque
        if (attack > 0) {
          setAttackPopup({ player: playerKey === "player1" ? 1 : 2, lines: attack });
          setTimeout(() => setAttackPopup(null), 1500);
          
          // Trigger confetti for big attacks
          if (attack >= 3) {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { x: playerKey === "player1" ? 0.3 : 0.7, y: 0.6 },
            });
          }
        }

        // Nueva pieza
        const nextPieces = [...player.nextPieces];
        const newCurrentPiece = nextPieces.shift()!;
        nextPieces.push(createPiece(getRandomPieceType(mode === "chaos")));

        // Check game over
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

        // Aplicar ataque al oponente
        const opponentKey = playerKey === "player1" ? "player2" : "player1";
        const opponent = prev[opponentKey];
        const hasShield = opponent.effects.some((e) => e.type === "block_attack" && Date.now() - e.startTime < e.duration);

        let updatedOpponent = opponent;
        if (attack > 0 && !hasShield) {
          updatedOpponent = {
            ...opponent,
            board: addGarbageLines(opponent.board, attack),
          };

          // Shake opponent board
          setShake((s) => ({ ...s, [opponentKey]: true }));
          setTimeout(() => setShake((s) => ({ ...s, [opponentKey]: false })), 300);
        }

        // Check for winner
        const winner = isGameOver ? (playerKey === "player1" ? "player2" : "player1") : null;

        if (winner) {
          setTimeout(() => {
            navigate(`/result?winner=${winner}&mode=${mode}&p1=${p1Id}&p2=${p2Id}`);
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
  }, [mode, navigate, p1Id, p2Id]);

  // Game loop
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (!gameState.isPaused && !gameState.winner) {
        // Update match time
        const elapsedSeconds = Math.floor((timestamp - gameStartTimeRef.current) / 1000);
        if (elapsedSeconds !== gameState.matchTime) {
          setGameState((prev) => ({ ...prev, matchTime: elapsedSeconds }));
        }

        // Player 1 drop
        const dropSpeed1 = getDropSpeed(gameState.player1.level, gameState.player1.effects);
        if (timestamp - lastDropTimeRef.current.player1 > dropSpeed1) {
          handleAutoDrop("player1");
          lastDropTimeRef.current.player1 = timestamp;
        }

        // Player 2 drop (CPU or player)
        const dropSpeed2 = getDropSpeed(gameState.player2.level, gameState.player2.effects);
        if (timestamp - lastDropTimeRef.current.player2 > dropSpeed2) {
          if (mode === "vs-cpu") {
            handleCPUMove();
          } else {
            handleAutoDrop("player2");
          }
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
  }, [gameState, handleAutoDrop, mode]);

  // CPU AI (simple)
  const handleCPUMove = useCallback(() => {
    setGameState((prev) => {
      const player = prev.player2;
      if (!player.currentPiece || player.isGameOver) return prev;

      // Simple AI: move hacia un lado aleatoriamente y a veces rotar
      const actions = [
        () => tryMove(player, -1, 0),
        () => tryMove(player, 1, 0),
        () => tryRotate(player),
        () => tryMove(player, 0, 1),
      ];

      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const newState = randomAction();

      return {
        ...prev,
        player2: newState,
      };
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isPaused || gameState.winner) return;

      // Player 1 controls (arrows)
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, player1: tryMove(prev.player1, -1, 0) }));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, player1: tryMove(prev.player1, 1, 0) }));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, player1: tryMove(prev.player1, 0, 1) }));
      } else if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, player1: tryRotate(prev.player1) }));
      } else if (e.key === "Shift") {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, player1: hardDrop(prev.player1) }));
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, player1: holdPieceAction(prev.player1) }));
      }

      // Player 2 controls (WASD) - solo en modo vs-player
      if (mode === "vs-player") {
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          setGameState((prev) => ({ ...prev, player2: tryMove(prev.player2, -1, 0) }));
        } else if (e.key === "d" || e.key === "D") {
          e.preventDefault();
          setGameState((prev) => ({ ...prev, player2: tryMove(prev.player2, 1, 0) }));
        } else if (e.key === "s" || e.key === "S") {
          e.preventDefault();
          setGameState((prev) => ({ ...prev, player2: tryMove(prev.player2, 0, 1) }));
        } else if (e.key === "w" || e.key === "W") {
          e.preventDefault();
          setGameState((prev) => ({ ...prev, player2: tryRotate(prev.player2) }));
        } else if (e.key === "q" || e.key === "Q") {
          e.preventDefault();
          setGameState((prev) => ({ ...prev, player2: hardDrop(prev.player2) }));
        } else if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          setGameState((prev) => ({ ...prev, player2: holdPieceAction(prev.player2) }));
        }
      }

      // Pause
      if (e.key === "Escape") {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.isPaused, gameState.winner, mode]);

  // Activar poder
  const activatePower = (player: "player1" | "player2", powerId: string) => {
    setGameState((prev) => {
      const playerState = prev[player];
      if (playerState.powerMeter < 100) return prev;

      const power = powers.find((p) => p.id === powerId);
      if (!power) return prev;

      let updatedPlayer = { ...playerState, powerMeter: 0 };
      const opponentKey = player === "player1" ? "player2" : "player1";
      let updatedOpponent = prev[opponentKey];

      // Aplicar efectos del poder
      switch (powerId) {
        case "clear_line":
          const { board: clearedBoard } = clearLines(playerState.board);
          updatedPlayer.board = clearedBoard;
          break;
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
        [player]: updatedPlayer,
        [opponentKey]: updatedOpponent,
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 overflow-hidden relative">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: -20,
            }}
            animate={{
              y: window.innerHeight + 20,
              x: Math.random() * window.innerWidth,
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div
        className="max-w-[1600px] mx-auto mb-6 flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          ← Menú
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            {gameState.isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            {isMuted ? <VolumeOff className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>
      </motion.div>

      {/* Main game area */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-[1fr_auto_1fr] gap-6 items-start">
        {/* Player 1 */}
        <PlayerArea
          player={gameState.player1}
          playerNumber={1}
          ghostPiece={getGhostPiece(gameState.player1)}
          shake={shake.player1}
          onPowerActivate={(powerId) => activatePower("player1", powerId)}
        />

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center min-h-[600px]">
          <motion.div
            className="text-8xl font-black text-white/20 mb-8"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            VS
          </motion.div>

          {/* Time */}
          <div className="text-white/60 text-lg font-bold">
            {Math.floor(gameState.matchTime / 60)}:{(gameState.matchTime % 60).toString().padStart(2, "0")}
          </div>
        </div>

        {/* Player 2 */}
        <PlayerArea
          player={gameState.player2}
          playerNumber={2}
          ghostPiece={getGhostPiece(gameState.player2)}
          shake={shake.player2}
          onPowerActivate={(powerId) => activatePower("player2", powerId)}
          isCPU={mode === "vs-cpu"}
        />
      </div>

      {/* Pause overlay */}
      <AnimatePresence>
        {gameState.isPaused && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-purple-600 to-pink-600 p-12 rounded-3xl text-center"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
            >
              <h2 className="text-6xl font-black text-white mb-4">PAUSA</h2>
              <p className="text-white/80 text-xl mb-8">Presiona ESC para continuar</p>
              <button
                onClick={() => setGameState((prev) => ({ ...prev, isPaused: false }))}
                className="px-8 py-4 bg-white text-purple-600 rounded-xl font-black text-xl hover:scale-110 transition-transform"
              >
                CONTINUAR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combo popup */}
      <AnimatePresence>
        {comboPopup && (
          <motion.div
            className={`fixed ${comboPopup.player === 1 ? "left-1/4" : "right-1/4"} top-1/2 -translate-y-1/2 z-40`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-4 rounded-2xl shadow-2xl">
              <div className="text-white text-4xl font-black">
                {comboPopup.combo}x COMBO!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attack popup */}
      <AnimatePresence>
        {attackPopup && (
          <motion.div
            className={`fixed ${attackPopup.player === 1 ? "left-1/4" : "right-1/4"} top-1/3 -translate-y-1/2 z-40`}
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -50 }}
          >
            <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-3 rounded-xl shadow-2xl">
              <div className="text-white text-2xl font-black">
                ⚔️ +{attackPopup.lines} ATAQUE
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls hint */}
      <motion.div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-6 py-3 rounded-full text-sm backdrop-blur-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        P1: ⬅️ ➡️ ⬇️ ESPACIO 🔄 SHIFT ⚡ C 💾
        {mode === "vs-player" && " | P2: WASD W🔄 Q⚡ E💾"}
      </motion.div>
    </div>
  );
}

interface PlayerAreaProps {
  player: PlayerState;
  playerNumber: 1 | 2;
  ghostPiece: any;
  shake: boolean;
  onPowerActivate: (powerId: string) => void;
  isCPU?: boolean;
}

function PlayerArea({ player, playerNumber, ghostPiece, shake, onPowerActivate, isCPU = false }: PlayerAreaProps) {
  const isPlayer2 = playerNumber === 2;

  return (
    <div className="space-y-4">
      {/* Player header */}
      <motion.div
        className={`bg-gradient-to-r ${
          isPlayer2 ? "from-red-500 to-pink-500" : "from-blue-500 to-cyan-500"
        } p-4 rounded-2xl shadow-xl`}
        initial={{ x: isPlayer2 ? 50 : -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{player.character.emoji}</span>
            <div>
              <h3 className="text-white font-black text-xl">
                {isCPU ? "CPU" : `JUGADOR ${playerNumber}`}
              </h3>
              <p className="text-white/80 text-sm">{player.character.name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-black text-2xl">{player.score}</div>
            <div className="text-white/80 text-xs">PUNTOS</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <StatBadge label="Nivel" value={player.level} />
          <StatBadge label="Líneas" value={player.linesCleared} />
          <StatBadge label="Combo" value={player.combo} highlight={player.combo > 1} />
        </div>
      </motion.div>

      <div className="grid grid-cols-[auto_1fr] gap-4">
        {/* Side panel */}
        <div className="space-y-4">
          <HoldSlot piece={player.holdPiece} canHold={player.canHold} />
          <NextPieces pieces={player.nextPieces} />
        </div>

        {/* Board */}
        <div>
          <GameBoard
            board={player.board}
            currentPiece={player.currentPiece}
            ghostPiece={ghostPiece}
            isPlayer2={isPlayer2}
            shake={shake}
          />

          {/* Active effects */}
          {player.effects.length > 0 && (
            <div className="mt-3 flex gap-2">
              {player.effects.map((effect, i) => {
                const remaining = Math.max(0, effect.duration - (Date.now() - effect.startTime));
                if (remaining <= 0) return null;

                return (
                  <motion.div
                    key={i}
                    className="bg-white/10 px-3 py-2 rounded-lg flex items-center gap-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    {effect.type === "frozen" && <Snowflake className="w-4 h-4 text-blue-400" />}
                    {effect.type === "speed_up" && <Zap className="w-4 h-4 text-yellow-400" />}
                    {effect.type === "block_attack" && <Shield className="w-4 h-4 text-green-400" />}
                    <span className="text-white text-xs font-bold">{(remaining / 1000).toFixed(1)}s</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Power bar */}
      <PowerBar
        powerMeter={player.powerMeter}
        powers={powers}
        onActivate={onPowerActivate}
        isPlayer2={isPlayer2}
      />

      {/* Game over overlay */}
      {player.isGameOver && (
        <motion.div
          className="absolute inset-0 bg-black/80 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">💀</div>
            <div className="text-white text-3xl font-black">GAME OVER</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatBadge({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`bg-white/20 px-2 py-1 rounded-lg ${highlight ? "ring-2 ring-yellow-400" : ""}`}>
      <div className={`text-white text-xs font-bold ${highlight ? "text-yellow-300" : ""}`}>{label}</div>
      <div className={`text-white font-black ${highlight ? "text-yellow-300" : ""}`}>{value}</div>
    </div>
  );
}

function PowerBar({
  powerMeter,
  powers,
  onActivate,
  isPlayer2,
}: {
  powerMeter: number;
  powers: any[];
  onActivate: (id: string) => void;
  isPlayer2: boolean;
}) {
  const canActivate = powerMeter >= 100;

  return (
    <motion.div
      className={`bg-gray-900/90 p-4 rounded-xl shadow-xl border-2 ${
        canActivate ? "border-yellow-400" : "border-gray-600"
      }`}
      animate={
        canActivate
          ? {
              boxShadow: ["0 0 0px rgba(250, 204, 21, 0.5)", "0 0 30px rgba(250, 204, 21, 0.8)", "0 0 0px rgba(250, 204, 21, 0.5)"],
            }
          : {}
      }
      transition={{ duration: 1, repeat: Infinity }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-black text-sm">PODER ESPECIAL</h4>
        <span className="text-yellow-400 font-black text-lg">{powerMeter}%</span>
      </div>

      {/* Power meter bar */}
      <div className="bg-gray-800 h-3 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${powerMeter}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Power buttons */}
      <div className="grid grid-cols-5 gap-2">
        {powers.map((power) => (
          <button
            key={power.id}
            onClick={() => canActivate && onActivate(power.id)}
            disabled={!canActivate}
            className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-all ${
              canActivate
                ? "bg-gradient-to-br from-yellow-400 to-orange-500 hover:scale-110 shadow-lg"
                : "bg-gray-700 opacity-50 cursor-not-allowed"
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