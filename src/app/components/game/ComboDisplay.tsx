import { motion } from "motion/react";
import { Flame } from "lucide-react";

interface ComboDisplayProps {
  combo: number;
}

export function ComboDisplay({ combo }: ComboDisplayProps) {
  if (combo <= 1) return null;

  return (
    <motion.div
      className="absolute top-0 left-1/2 -translate-x-1/2 z-30"
      initial={{ scale: 0, y: -50 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0, y: -50 }}
    >
      <motion.div
        className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
        }}
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
          }}
        >
          <Flame className="w-6 h-6 text-yellow-300" />
        </motion.div>
        <span className="text-white font-black text-2xl">{combo}x COMBO!</span>
      </motion.div>
    </motion.div>
  );
}
