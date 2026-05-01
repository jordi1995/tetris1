import { motion } from "motion/react";
import { Cell, Piece } from "../../types/game";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../../utils/gameLogic";

interface GameBoardProps {
  board: Cell[][];
  currentPiece: Piece | null;
  ghostPiece?: Piece | null;
  isPlayer2?: boolean;
  shake?: boolean;
  size?: "mini" | "micro-mobile" | "rival-mobile" | "mini-mobile" | "standard" | "hero" | "hero-mobile" | "hero-mobile-short";
  className?: string;
  borderless?: boolean;
}

interface CellProps {
  cell: Cell & { isGhost?: boolean };
  size: "mini" | "micro-mobile" | "rival-mobile" | "mini-mobile" | "standard" | "hero" | "hero-mobile" | "hero-mobile-short";
}

const BOARD_SIZE_STYLES = {
  mini: {
    cell: "clamp(5px, 0.72vh + 0.05vw, 9px)",
    radius: "2px",
    frameClass: "rounded-md border-2 p-1 shadow-xl sm:p-1.5",
    iconClass: "text-[6px] sm:text-[7px]",
  },
  "micro-mobile": {
    cell: "clamp(3.8px, 0.5vh + 0.03vw, 4.6px)",
    radius: "1.5px",
    frameClass: "rounded-md border-2 p-[3px] shadow-lg",
    iconClass: "text-[4px]",
  },
  "rival-mobile": {
    cell: "clamp(4.3px, 1.08vw, 5.2px)",
    radius: "1.5px",
    frameClass: "rounded-none border-0 p-[3px] shadow-lg",
    iconClass: "text-[4px]",
  },
  "mini-mobile": {
    cell: "clamp(5px, 0.66vh + 0.04vw, 5.8px)",
    radius: "2px",
    frameClass: "rounded-md border-2 p-[3px] shadow-lg",
    iconClass: "text-[5px]",
  },
  standard: {
    cell: "clamp(9px, 1.18vh + 0.1vw, 17px)",
    radius: "4px",
    frameClass: "rounded-xl border-2 p-1.5 shadow-2xl sm:border-4 sm:p-2",
    iconClass: "text-[7px] sm:text-[8px] lg:text-[10px]",
  },
  hero: {
    cell: "clamp(12px, 1.58vh + 0.14vw, 22px)",
    radius: "4px",
    frameClass: "rounded-2xl border-2 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:border-4 sm:p-3",
    iconClass: "text-[7px] sm:text-[8px] lg:text-[11px]",
  },
  "hero-mobile": {
    cell: "clamp(12px, min(calc((100vw - 72px) / 10), calc((100vh - 402px) / 20)), 26px)",
    radius: "4px",
    frameClass: "rounded-[20px] border-2 p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.34)]",
    iconClass: "text-[7px]",
  },
  "hero-mobile-short": {
    cell: "clamp(12px, min(calc((100vw - 72px) / 10), calc((100vh - 402px) / 20)), 22px)",
    radius: "4px",
    frameClass: "rounded-[18px] border-2 p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.34)]",
    iconClass: "text-[7px]",
  },
} as const;

export function GameBoard({
  board,
  currentPiece,
  ghostPiece,
  isPlayer2 = false,
  shake = false,
  size = "standard",
  className = "",
  borderless = false,
}: GameBoardProps) {
  const sizeStyle = BOARD_SIZE_STYLES[size];
  const displayBoard = board.map((row) => row.map((cell) => ({ ...cell })));

  if (ghostPiece) {
    for (let y = 0; y < ghostPiece.shape.length; y++) {
      for (let x = 0; x < ghostPiece.shape[y].length; x++) {
        if (!ghostPiece.shape[y][x]) continue;

        const boardY = ghostPiece.position.y + y;
        const boardX = ghostPiece.position.x + x;

        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          if (!displayBoard[boardY][boardX].filled) {
            displayBoard[boardY][boardX] = {
              filled: true,
              color: ghostPiece.color,
              isGhost: true,
            };
          }
        }
      }
    }
  }

  if (currentPiece) {
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (!currentPiece.shape[y][x]) continue;

        const boardY = currentPiece.position.y + y;
        const boardX = currentPiece.position.x + x;

        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          displayBoard[boardY][boardX] = {
            filled: true,
            color: currentPiece.color,
            type: currentPiece.type,
          };
        }
      }
    }
  }

  return (
    <motion.div
      className={`inline-block bg-gray-900/90 ${sizeStyle.frameClass} ${className} ${
        borderless ? "" : isPlayer2 ? "border-red-500" : "border-blue-500"
      }`}
      animate={
        shake
          ? {
              x: [0, -5, 5, -5, 5, 0],
              y: [0, -5, 5, -5, 5, 0],
            }
          : {}
      }
      transition={{ duration: 0.3 }}
    >
      <div
        className={`grid bg-gray-800 p-[1px] ${size === "rival-mobile" ? "rounded-none" : "rounded-lg"}`}
        style={{
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
          gap: "1px",
        }}
      >
        {displayBoard.map((row, y) =>
          row.map((cell, x) => <BoardCell key={`${x}-${y}`} cell={cell} size={size} />),
        )}
      </div>
    </motion.div>
  );
}

function BoardCell({ cell, size }: CellProps) {
  const sizeStyle = BOARD_SIZE_STYLES[size];
  const baseCellStyle = {
    width: sizeStyle.cell,
    height: sizeStyle.cell,
    borderRadius: sizeStyle.radius,
  };

  if (!cell.filled) {
    return <div className="bg-gray-900/50" style={baseCellStyle} />;
  }

  if (cell.isGhost) {
    return (
      <div
        className={`border border-dashed opacity-30 ${size !== "mini" ? "sm:border-2" : ""}`}
        style={{ ...baseCellStyle, borderColor: cell.color }}
      />
    );
  }

  return (
    <motion.div
      className="relative overflow-hidden shadow-md"
      style={{ ...baseCellStyle, backgroundColor: cell.color }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.1 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20" />

      {size !== "mini" && cell.type && ["CAT_BOMB", "SCRATCH", "SLEEP_CAT", "LUCKY_CAT"].includes(cell.type) && (
        <div className={`absolute inset-0 flex items-center justify-center ${sizeStyle.iconClass}`}>
          {cell.type === "CAT_BOMB" && "💣"}
          {cell.type === "SCRATCH" && "✂️"}
          {cell.type === "SLEEP_CAT" && "😴"}
          {cell.type === "LUCKY_CAT" && "🍀"}
        </div>
      )}

      {cell.isGarbage && (
        <div className={`absolute inset-0 flex items-center justify-center ${sizeStyle.iconClass}`}>⚠️</div>
      )}
    </motion.div>
  );
}
