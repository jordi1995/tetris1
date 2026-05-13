import { type ReactNode } from "react";
import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Bot, Gamepad2, Users, Trophy, Sparkles, Target, Heart } from "lucide-react";

const QUICK_PLAY_MODE_IDS = new Set(["normal", "chaos", "vs-cpu", "puzzle", "coop"]);

interface ModeData {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  color: string;
  difficulty: string;
}

interface ModeCardProps {
  mode: ModeData;
  index: number;
  onSelect: () => void;
  isPreselected: boolean;
}

const ALL_MODES: ModeData[] = [
  {
    id: "normal",
    name: "Modo Normal",
    description: "Tetris clasico en solitario: sobrevive y suma puntos.",
    icon: <Gamepad2 className="h-10 w-10 sm:h-12 sm:w-12" />,
    color: "from-cyan-500 to-blue-500",
    difficulty: "Clasico",
  },
  {
    id: "vs-cpu",
    name: "VS CPU",
    description: "Enfrentate a la inteligencia artificial.",
    icon: <Bot className="h-10 w-10 sm:h-12 sm:w-12" />,
    color: "from-blue-500 to-cyan-500",
    difficulty: "Facil -> Extremo",
  },
  {
    id: "vs-player",
    name: "1 VS 1 Local",
    description: "Batalla contra un amigo en el mismo dispositivo.",
    icon: <Users className="h-10 w-10 sm:h-12 sm:w-12" />,
    color: "from-green-500 to-emerald-500",
    difficulty: "Versus local",
  },
  {
    id: "ranked",
    name: "Ranked",
    description: "Compite y entra en cola online inmediatamente.",
    icon: <Trophy className="h-10 w-10 sm:h-12 sm:w-12" />,
    color: "from-purple-500 to-pink-500",
    difficulty: "Competitivo",
  },
  {
    id: "chaos",
    name: "Modo Caos",
    description: "Eventos aleatorios y partidas impredecibles.",
    icon: <Sparkles className="h-10 w-10 sm:h-12 sm:w-12" />,
    color: "from-orange-500 to-red-500",
    difficulty: "Caotico",
  },
  {
    id: "puzzle",
    name: "Puzzle Challenge",
    description: "Resuelve desafios con objetivo y ritmo propio.",
    icon: <Target className="h-10 w-10 sm:h-12 sm:w-12" />,
    color: "from-yellow-500 to-amber-500",
    difficulty: "Estrategico",
  },
  {
    id: "coop",
    name: "Co-op Boss",
    description: "Dos jugadores, un objetivo, misma pantalla.",
    icon: <Heart className="h-10 w-10 sm:h-12 sm:w-12" />,
    color: "from-pink-500 to-rose-500",
    difficulty: "Cooperativo",
  },
];

export function ModeSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedMode = searchParams.get("mode");
  const view = searchParams.get("view");
  const isQuickPlayView = view === "quick-play";

  const modes = isQuickPlayView
    ? ALL_MODES.filter((mode) => QUICK_PLAY_MODE_IDS.has(mode.id))
    : ALL_MODES;

  const title = isQuickPlayView ? "JUGAR AHORA" : "SELECCIONA EL MODO";
  const subtitle = isQuickPlayView
    ? "Solo aparecen los modos que no se repiten en la home."
    : "Elige como quieres jugar.";

  const handleSelect = (modeId: string) => {
    if (modeId === "ranked") {
      navigate("/online-matchmaking?mode=ranked");
      return;
    }

    const params = new URLSearchParams({
      mode: modeId,
      from: isQuickPlayView ? "quick-play" : "mode-selection",
    });

    navigate(`/character-selection?${params.toString()}`);
  };

  return (
    <div className="h-dvh overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 sm:p-6">
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <motion.div
          className="mb-4 flex items-center justify-between gap-4 sm:mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/90 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm font-bold sm:text-lg">Volver</span>
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-black text-white sm:text-4xl lg:text-5xl">{title}</h1>
            <p className="mt-1 text-xs text-white/80 sm:mt-2 sm:text-sm">{subtitle}</p>
          </div>

          <div className="w-16 sm:w-24" />
        </motion.div>

        <motion.div
          className={`grid flex-1 auto-rows-max grid-cols-2 content-start justify-items-center gap-3 sm:content-center sm:gap-4 ${
            isQuickPlayView ? "xl:grid-cols-4" : "xl:grid-cols-3"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {modes.map((mode, index) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              index={index}
              onSelect={() => handleSelect(mode.id)}
              isPreselected={preselectedMode === mode.id}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function ModeCard({ mode, index, onSelect, isPreselected }: ModeCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      className={`group relative w-full max-w-[290px] overflow-hidden rounded-[28px] bg-gradient-to-br ${mode.color} p-4 text-left text-white shadow-2xl sm:p-5`}
      initial={{ y: 50, opacity: 0, scale: 0.9 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: isPreselected ? 1.05 : 1,
      }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        type: "spring",
      }}
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />

      {isPreselected && (
        <motion.div
          className="absolute right-3 top-3 rounded-full bg-white/25 px-2.5 py-1 text-[10px] font-bold sm:right-4 sm:top-4 sm:text-xs"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          RECOMENDADO
        </motion.div>
      )}

      <motion.div
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 sm:mb-4 sm:h-20 sm:w-20"
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
      >
        {mode.icon}
      </motion.div>

      <div className="flex min-h-[126px] flex-col justify-between sm:min-h-[154px]">
        <div>
          <h3 className="mb-2 text-base font-black sm:text-2xl">{mode.name}</h3>
          <p className="mb-4 text-xs leading-snug text-white/90 sm:text-sm">{mode.description}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold sm:text-xs">
            {mode.difficulty}
          </span>

          <motion.span
            className="text-xl font-black sm:text-2xl"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
          >
            &gt;
          </motion.span>
        </div>
      </div>
    </motion.button>
  );
}
