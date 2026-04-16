import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Sparkles, Trophy, Users, Zap, HelpCircle } from "lucide-react";
import { useState } from "react";
import { TutorialModal } from "../components/TutorialModal";

export function MainMenu() {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4 overflow-hidden">
      {/* Fondo animado con gatos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl opacity-10"
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
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          >
            {['😺', '😸', '😻', '😼', '😾', '😿'][Math.floor(Math.random() * 6)]}
          </motion.div>
        ))}
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Logo y título */}
        <motion.div
          className="text-center mb-12"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <motion.div
            className="text-9xl mb-4"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            😺
          </motion.div>
          <h1 className="text-7xl font-black text-white mb-4 tracking-tight">
            CAT
            <span className="text-yellow-300">TETRIS</span>
          </h1>
          <p className="text-2xl text-white/90 font-bold">
            Battle Puzzle Royale
          </p>
        </motion.div>

        {/* Botones de menú */}
        <motion.div
          className="space-y-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <MenuButton
            onClick={() => navigate('/mode-selection')}
            icon={<Zap className="w-8 h-8" />}
            title="JUGAR AHORA"
            subtitle="Elige tu modo de batalla"
            color="from-yellow-400 to-orange-500"
            delay={0}
          />
          
          <MenuButton
            onClick={() => navigate('/mode-selection?mode=ranked')}
            icon={<Trophy className="w-8 h-8" />}
            title="RANKED"
            subtitle="Competitivo • Sube de rango"
            color="from-purple-500 to-pink-500"
            delay={0.1}
          />
          
          <MenuButton
            onClick={() => navigate('/mode-selection?mode=vs-player')}
            icon={<Users className="w-8 h-8" />}
            title="1 VS 1 LOCAL"
            subtitle="Batalla contra un amigo"
            color="from-blue-500 to-cyan-500"
            delay={0.2}
          />
          
          <MenuButton
            onClick={() => navigate('/mode-selection?mode=chaos')}
            icon={<Sparkles className="w-8 h-8" />}
            title="MODO CAOS"
            subtitle="Eventos aleatorios extremos"
            color="from-green-500 to-emerald-500"
            delay={0.3}
          />
          
          <MenuButton
            onClick={() => setShowTutorial(true)}
            icon={<HelpCircle className="w-8 h-8" />}
            title="TUTORIAL"
            subtitle="Aprende a jugar"
            color="from-indigo-500 to-purple-500"
            delay={0.4}
          />
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-12 text-white/70 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>Usa ⬅️ ➡️ ⬇️ para mover • ESPACIO para rotar • C para hold • SHIFT para hard drop</p>
        </motion.div>
      </div>
      
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
}

interface MenuButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  delay: number;
}

function MenuButton({ onClick, icon, title, subtitle, color, delay }: MenuButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full bg-gradient-to-r ${color} text-white p-6 rounded-2xl shadow-2xl flex items-center gap-6 group relative overflow-hidden`}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      <div className="bg-white/20 p-4 rounded-xl">
        {icon}
      </div>
      
      <div className="flex-1 text-left">
        <div className="text-2xl font-black tracking-tight">{title}</div>
        <div className="text-white/90 text-sm font-medium">{subtitle}</div>
      </div>
      
      <motion.div
        className="text-3xl"
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        →
      </motion.div>
    </motion.button>
  );
}