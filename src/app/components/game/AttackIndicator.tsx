import { motion } from "motion/react";
import { Swords, TrendingUp } from "lucide-react";

interface AttackIndicatorProps {
  attackQueue: number;
  incoming?: boolean;
}

export function AttackIndicator({ attackQueue, incoming = false }: AttackIndicatorProps) {
  if (attackQueue === 0) return null;

  return (
    <motion.div
      className={`absolute ${incoming ? 'top-4 right-4' : 'top-4 left-4'} z-20`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
    >
      <motion.div
        className={`px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 ${
          incoming
            ? 'bg-gradient-to-r from-red-600 to-orange-600'
            : 'bg-gradient-to-r from-green-500 to-emerald-500'
        }`}
        animate={{
          y: [0, -5, 0],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
        }}
      >
        {incoming ? (
          <TrendingUp className="w-5 h-5 text-white rotate-180" />
        ) : (
          <Swords className="w-5 h-5 text-white" />
        )}
        <span className="text-white font-black text-lg">+{attackQueue}</span>
      </motion.div>
    </motion.div>
  );
}
