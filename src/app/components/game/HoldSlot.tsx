import { motion } from "motion/react";
import { Piece } from "../../types/game";

interface HoldSlotProps {
  piece: Piece | null;
  canHold: boolean;
}

export function HoldSlot({ piece, canHold }: HoldSlotProps) {
  return (
    <div
      className={`rounded-xl border-2 bg-gray-900/90 p-1.5 shadow-xl transition-all sm:p-3 ${
        canHold ? "border-green-500" : "border-gray-600"
      }`}
    >
      <h3 className="mb-1.5 text-center text-[10px] font-black text-white sm:mb-3 sm:text-xs">HOLD (C)</h3>

      <motion.div
        className={`flex min-h-[48px] items-center justify-center rounded-lg bg-gray-800 p-1.5 sm:min-h-[68px] sm:p-3 ${
          !canHold ? "opacity-50" : ""
        }`}
        animate={
          canHold
            ? {
                boxShadow: [
                  "0 0 0px rgba(34, 197, 94, 0.5)",
                  "0 0 20px rgba(34, 197, 94, 0.5)",
                  "0 0 0px rgba(34, 197, 94, 0.5)",
                ],
              }
            : {}
        }
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        {piece ? <HoldPiece piece={piece} /> : <span className="text-center text-[10px] text-gray-600 sm:text-xs">Vacio</span>}
      </motion.div>

      {!canHold && <p className="mt-2 text-center text-[10px] font-bold text-yellow-500 sm:text-xs">Ya usada</p>}
    </div>
  );
}

function HoldPiece({ piece }: { piece: Piece }) {
  return (
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
              width: "clamp(8px, 0.7vw + 0.3vh, 14px)",
              height: "clamp(8px, 0.7vw + 0.3vh, 14px)",
              backgroundColor: cell ? piece.color : "transparent",
              boxShadow: cell ? `0 0 6px ${piece.color}` : "none",
            }}
          />
        )),
      )}
    </div>
  );
}
