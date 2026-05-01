import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Trophy, Users, Zap, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { TutorialModal } from "../components/TutorialModal";

interface MenuButtonProps {
  onClick: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
  color: string;
  delay: number;
}

export function MainMenu() {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);

  const actions: MenuButtonProps[] = [
    {
      onClick: () => navigate("/mode-selection?view=quick-play"),
      icon: <Zap className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: "JUGAR AHORA",
      subtitle: "VS CPU, Puzzle Challenge, Co-op Boss y Modo Caos",
      color: "from-yellow-400 to-orange-500",
      delay: 0,
    },
    {
      onClick: () => navigate("/online-matchmaking?mode=ranked"),
      icon: <Trophy className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: "RANKED",
      subtitle: "Entra directo al buscador de rival online",
      color: "from-purple-500 to-pink-500",
      delay: 0.08,
    },
    {
      onClick: () => navigate("/character-selection?mode=vs-player&from=home-local"),
      icon: <Users className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: "1 VS 1 LOCAL",
      subtitle: "Salta directo a seleccionar los gatos",
      color: "from-blue-500 to-cyan-500",
      delay: 0.16,
    },
    {
      onClick: () => setShowTutorial(true),
      icon: <HelpCircle className="h-6 w-6 sm:h-7 sm:w-7" />,
      title: "TUTORIAL",
      subtitle: "Aprende controles, poderes y ritmo de partida",
      color: "from-indigo-500 to-purple-500",
      delay: 0.24,
    },
  ];

  return (
    <div className="relative h-dvh overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 16 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute text-3xl opacity-10 sm:text-4xl"
            initial={{
              x: Math.random() * window.innerWidth,
              y: -50,
              rotate: 0,
            }}
            animate={{
              y: window.innerHeight + 50,
              rotate: 360,
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          >
            {["😺", "😸", "😻", "😼", "😾", "😿"][Math.floor(Math.random() * 6)]}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-5">
        <motion.div
          className="flex flex-1 flex-col justify-center gap-5 sm:gap-6"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <div className="text-center">
            <motion.div
              className="mb-2 text-[clamp(3rem,12vw,5.75rem)]"
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, -5, 5, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              😺
            </motion.div>

            <h1 className="text-[clamp(3rem,11vw,5.5rem)] font-black tracking-tight text-white">
              CAT<span className="text-yellow-300">TETRIS</span>
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm font-bold text-white/90 sm:text-lg">
              Todo entra en una pantalla: acceso rapido a partida, ranked y versus local sin scroll.
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {actions.map((action) => (
              <MenuButton key={action.title} {...action} />
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="pt-2 text-center text-[11px] text-white/70 sm:text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <p>Flechas para mover, Espacio para rotar, C para hold y Shift para hard drop.</p>
        </motion.div>
      </div>

      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}

function MenuButton({ onClick, icon, title, subtitle, color, delay }: MenuButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`group relative flex min-h-[96px] w-full items-center gap-4 overflow-hidden rounded-[28px] bg-gradient-to-r ${color} p-4 text-white shadow-2xl sm:min-h-[112px] sm:p-5`}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 transition-transform duration-700 group-hover:translate-x-full" />

      <div className="rounded-2xl bg-white/20 p-3">{icon}</div>

      <div className="flex-1 text-left">
        <div className="text-lg font-black tracking-tight sm:text-2xl">{title}</div>
        <div className="mt-1 text-xs font-medium text-white/90 sm:text-sm">{subtitle}</div>
      </div>

      <motion.div
        className="text-2xl font-black sm:text-3xl"
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
      >
        &gt;
      </motion.div>
    </motion.button>
  );
}
