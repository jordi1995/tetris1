import { motion } from "motion/react";
import { Piece } from "../../types/game";

interface NextPiecesProps {
  pieces: Piece[];
}

export function NextPieces({ pieces }: NextPiecesProps) {
  return (
    <div className="rounded-xl border-2 border-purple-500 bg-gray-900/90 p-1.5 shadow-xl sm:p-3">
      <h3 className="mb-1.5 text-center font-black text-white sm:mb-3 sm:text-xs">
        <span className="block text-[8px] leading-[0.9] sm:hidden">
          SIGUIEN
          <br />
          TES
        </span>
        <span className="hidden sm:block">SIGUIENTES</span>
      </h3>

      <div className="space-y-1 sm:space-y-2">
        {pieces.slice(0, 5).map((piece, index) => (
          <motion.div
            key={index}
            className="rounded-lg bg-gray-800 p-1 sm:p-2"
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
    <div className="flex min-h-[22px] items-center justify-center sm:min-h-[32px]">
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)`,
        }}
      >
        {piece.shape.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            className="rounded-[2px]"
            style={{
              width: "clamp(6px, 0.5vw + 0.24vh, 11px)",
              height: "clamp(6px, 0.5vw + 0.24vh, 11px)",
              backgroundColor: cell ? piece.color : "transparent",
              boxShadow: cell ? `0 0 4px ${piece.color}` : "none",
            }}
            />
          )),
        )}
      </div>
    </div>
  );
}
