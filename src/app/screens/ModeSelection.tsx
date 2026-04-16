import { motion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Bot, Users, Trophy, Sparkles, Target, Heart } from "lucide-react";

export function ModeSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedMode = searchParams.get('mode');

  const modes = [
    {
      id: 'vs-cpu',
      name: 'VS CPU',
      description: 'Enfréntate a la inteligencia artificial',
      icon: <Bot className="w-12 h-12" />,
      color: 'from-blue-500 to-cyan-500',
      difficulty: 'Fácil → Extremo',
    },
    {
      id: 'vs-player',
      name: '1 VS 1 Local',
      description: 'Batalla contra un amigo en el mismo dispositivo',
      icon: <Users className="w-12 h-12" />,
      color: 'from-green-500 to-emerald-500',
      difficulty: 'Cooperativo',
    },
    {
      id: 'ranked',
      name: 'Ranked',
      description: 'Competitivo con sistema de ranking',
      icon: <Trophy className="w-12 h-12" />,
      color: 'from-purple-500 to-pink-500',
      difficulty: 'Competitivo',
    },
    {
      id: 'chaos',
      name: 'Modo Caos',
      description: 'Eventos aleatorios y mecánicas impredecibles',
      icon: <Sparkles className="w-12 h-12" />,
      color: 'from-orange-500 to-red-500',
      difficulty: 'Caótico',
    },
    {
      id: 'puzzle',
      name: 'Puzzle Challenge',
      description: 'Resuelve desafíos específicos',
      icon: <Target className="w-12 h-12" />,
      color: 'from-yellow-500 to-amber-500',
      difficulty: 'Estratégico',
    },
    {
      id: 'coop',
      name: 'Co-op Boss',
      description: 'Dos jugadores contra un jefe gigante',
      icon: <Heart className="w-12 h-12" />,
      color: 'from-pink-500 to-rose-500',
      difficulty: 'Cooperativo',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8 flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-lg font-bold">Volver</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-5xl font-black text-white">
              SELECCIONA EL MODO
            </h1>
            <p className="text-white/80 mt-2">Elige cómo quieres jugar</p>
          </div>
          
          <div className="w-24" /> {/* Spacer */}
        </motion.div>

        {/* Grid de modos */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {modes.map((mode, index) => (
            <ModeCard
              key={mode.id}
              mode={mode}
              index={index}
              onSelect={() => navigate(`/character-selection?mode=${mode.id}`)}
              isPreselected={preselectedMode === mode.id}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

interface ModeCardProps {
  mode: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    difficulty: string;
  };
  index: number;
  onSelect: () => void;
  isPreselected: boolean;
}

function ModeCard({ mode, index, onSelect, isPreselected }: ModeCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      className={`bg-gradient-to-br ${mode.color} p-6 rounded-3xl shadow-2xl text-white text-left group relative overflow-hidden`}
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
      whileHover={{ scale: 1.08, y: -10 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      {/* Badge de preseleccionado */}
      {isPreselected && (
        <motion.div
          className="absolute top-4 right-4 bg-white/30 px-3 py-1 rounded-full text-xs font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          ✨ Recomendado
        </motion.div>
      )}
      
      {/* Icono */}
      <motion.div
        className="bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
      >
        {mode.icon}
      </motion.div>
      
      {/* Contenido */}
      <div>
        <h3 className="text-2xl font-black mb-2">{mode.name}</h3>
        <p className="text-white/90 text-sm mb-4 min-h-[40px]">
          {mode.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
            {mode.difficulty}
          </span>
          
          <motion.span
            className="text-2xl"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            →
          </motion.span>
        </div>
      </div>
    </motion.button>
  );
}
