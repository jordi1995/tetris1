import { motion } from "motion/react";
import { Piece } from "../../types/game";

interface NextPiecesProps {
  pieces: Piece[];
}

export function NextPieces({ pieces }: NextPiecesProps) {
  return (
    <div className="bg-gray-900/90 p-4 rounded-xl shadow-xl border-2 border-purple-500">
      <h3 className="text-white font-black text-sm mb-3 text-center">
        SIGUIENTES
      </h3>
      
      <div className="space-y-3">
        {pieces.slice(0, 5).map((piece, index) => (
          <motion.div
            key={index}
            className="bg-gray-800 p-2 rounded-lg"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <MiniPiece piece={piece} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MiniPiece({ piece }: { piece: Piece }) {
  return (
    <div className="flex items-center justify-center min-h-[40px]">
      <div className="grid gap-[2px]" style={{
        gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)`,
      }}>
        {piece.shape.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: cell ? piece.color : 'transparent',
                boxShadow: cell ? `0 0 4px ${piece.color}` : 'none',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
