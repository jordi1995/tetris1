import { motion } from "motion/react";
import { Piece } from "../../types/game";

interface HoldSlotProps {
  piece: Piece | null;
  canHold: boolean;
}

export function HoldSlot({ piece, canHold }: HoldSlotProps) {
  return (
    <div className={`bg-gray-900/90 p-4 rounded-xl shadow-xl border-2 transition-all ${
      canHold ? 'border-green-500' : 'border-gray-600'
    }`}>
      <h3 className="text-white font-black text-sm mb-3 text-center">
        HOLD (C)
      </h3>
      
      <motion.div
        className={`bg-gray-800 p-4 rounded-lg min-h-[80px] flex items-center justify-center ${
          !canHold ? 'opacity-50' : ''
        }`}
        animate={canHold ? {
          boxShadow: ['0 0 0px rgba(34, 197, 94, 0.5)', '0 0 20px rgba(34, 197, 94, 0.5)', '0 0 0px rgba(34, 197, 94, 0.5)'],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {piece ? (
          <HoldPiece piece={piece} />
        ) : (
          <span className="text-gray-600 text-xs text-center">
            Vacío
          </span>
        )}
      </motion.div>
      
      {!canHold && (
        <p className="text-yellow-500 text-xs mt-2 text-center font-bold">
          Ya usada
        </p>
      )}
    </div>
  );
}

function HoldPiece({ piece }: { piece: Piece }) {
  return (
    <div className="grid gap-[2px]" style={{
      gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)`,
    }}>
      {piece.shape.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className="w-4 h-4 rounded-sm"
            style={{
              backgroundColor: cell ? piece.color : 'transparent',
              boxShadow: cell ? `0 0 6px ${piece.color}` : 'none',
            }}
          />
        ))
      )}
    </div>
  );
}
