import { useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { Trophy, Star, TrendingUp, Zap, Home, RotateCcw } from "lucide-react";
import { characters } from "../data/characters";
import confetti from "canvas-confetti";

export function ResultScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const winner = searchParams.get("winner") || "player1";
  const mode = searchParams.get("mode") || "vs-cpu";
  const p1Id = searchParams.get("p1") || "whiskers";
  const p2Id = searchParams.get("p2") || "shadow";
  const opponentName = searchParams.get("opponent") || "RIVAL ONLINE";
  const usesAutomatedOpponent = mode === "vs-cpu" || mode === "ranked" || mode === "puzzle" || mode === "chaos";
  const playerTwoLabel = mode === "ranked" ? opponentName : usesAutomatedOpponent ? "CPU" : "JUGADOR 2";

  const p1Character = characters.find((c) => c.id === p1Id) || characters[0];
  const p2Character = p2Id === "cpu" ? characters[1] : characters.find((c) => c.id === p2Id) || characters[1];

  const winnerCharacter = winner === "player1" ? p1Character : p2Character;
  const loserCharacter = winner === "player1" ? p2Character : p1Character;

  useEffect(() => {
    // Confetti celebration
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 flex items-center justify-center p-8 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl opacity-20"
            initial={{
              x: Math.random() * window.innerWidth,
              y: -50,
              rotate: 0,
            }}
            animate={{
              y: window.innerHeight + 50,
              rotate: 360,
              x: Math.random() * window.innerWidth,
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "linear",
            }}
          >
            {["🏆", "⭐", "🎉", "✨", "🎊", "🌟"][Math.floor(Math.random() * 6)]}
          </motion.div>
        ))}
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Main result card */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-4 border-white/20"
          initial={{ scale: 0.5, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        >
          {/* Winner badge */}
          <motion.div
            className="text-center mb-8"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-4 rounded-2xl shadow-2xl mb-6"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, -2, 2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <h1 className="text-5xl font-black text-white flex items-center gap-4">
                <Trophy className="w-12 h-12" />
                ¡VICTORIA!
                <Trophy className="w-12 h-12" />
              </h1>
            </motion.div>
          </motion.div>

          {/* Winner display */}
          <motion.div
            className="text-center mb-12"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <motion.div
              className="text-9xl mb-4"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
            >
              {winnerCharacter.emoji}
            </motion.div>
            <h2
              className="text-6xl font-black mb-2"
              style={{ color: winnerCharacter.color }}
            >
              {winnerCharacter.name}
            </h2>
            <p className="text-white/80 text-2xl">
              {winner === "player1" ? "JUGADOR 1" : playerTwoLabel}
            </p>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            className="grid grid-cols-2 gap-6 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {/* Winner stats */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">{winnerCharacter.emoji}</span>
                <div>
                  <h3 className="text-white font-black text-xl">{winnerCharacter.name}</h3>
                  <p className="text-white/80 text-sm">Ganador</p>
                </div>
              </div>
              <div className="space-y-2">
                <StatRow icon={<Star />} label="MVP" value="★★★★★" />
                <StatRow icon={<TrendingUp />} label="Racha" value="12x" />
                <StatRow icon={<Zap />} label="Ataques" value="45" />
              </div>
            </div>

            {/* Loser stats */}
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 p-6 rounded-2xl opacity-70">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl grayscale">{loserCharacter.emoji}</span>
                <div>
                  <h3 className="text-white font-black text-xl">{loserCharacter.name}</h3>
                  <p className="text-white/80 text-sm">Perdedor</p>
                </div>
              </div>
              <div className="space-y-2">
                <StatRow icon={<Star />} label="MVP" value="★★☆☆☆" />
                <StatRow icon={<TrendingUp />} label="Racha" value="8x" />
                <StatRow icon={<Zap />} label="Ataques" value="32" />
              </div>
            </div>
          </motion.div>

          {/* Match highlights */}
          <motion.div
            className="bg-white/10 p-6 rounded-2xl mb-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <h3 className="text-white font-black text-xl mb-4 text-center">
              🎮 RESUMEN DE LA PARTIDA
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <HighlightCard
                title="Mejor Combo"
                value="12x"
                icon="🔥"
                color="from-orange-500 to-red-500"
              />
              <HighlightCard
                title="Mayor Ataque"
                value="4 líneas"
                icon="⚔️"
                color="from-purple-500 to-pink-500"
              />
              <HighlightCard
                title="Duración"
                value="3:47"
                icon="⏱️"
                color="from-blue-500 to-cyan-500"
              />
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            className="flex gap-4 justify-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <ActionButton
              onClick={() => {
                const params = new URLSearchParams({
                  mode,
                  p1: p1Id,
                  p2: p2Id,
                });

                if (mode === "ranked") {
                  params.set("opponent", opponentName);
                }

                navigate(`/game?${params.toString()}`);
              }}
              icon={<RotateCcw />}
              label="REVANCHA"
              color="from-green-500 to-emerald-500"
            />
            <ActionButton
              onClick={() => navigate("/")}
              icon={<Home />}
              label="MENÚ PRINCIPAL"
              color="from-blue-500 to-cyan-500"
            />
          </motion.div>
        </motion.div>

        {/* Footer message */}
        <motion.div
          className="text-center mt-8 text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <p className="text-lg">
            ¡Gracias por jugar! 🎮 Sigue practicando para mejorar tus habilidades
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-white">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5">{icon}</div>
        <span className="text-sm font-bold">{label}</span>
      </div>
      <span className="font-black">{value}</span>
    </div>
  );
}

function HighlightCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <motion.div
      className={`bg-gradient-to-br ${color} p-4 rounded-xl text-center`}
      whileHover={{ scale: 1.05, rotate: 2 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-white font-black text-2xl mb-1">{value}</div>
      <div className="text-white/80 text-xs font-bold">{title}</div>
    </motion.div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  color,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`bg-gradient-to-r ${color} px-8 py-4 rounded-xl text-white font-black text-xl flex items-center gap-3 shadow-2xl`}
      whileHover={{ scale: 1.1, y: -5 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-6 h-6">{icon}</div>
      {label}
    </motion.button>
  );
}
