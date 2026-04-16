import { motion } from "motion/react";
import { Cell, Piece } from "../../types/game";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../../utils/gameLogic";

interface GameBoardProps {
  board: Cell[][];
  currentPiece: Piece | null;
  ghostPiece?: Piece | null;
  isPlayer2?: boolean;
  shake?: boolean;
}

export function GameBoard({ board, currentPiece, ghostPiece, isPlayer2 = false, shake = false }: GameBoardProps) {
  // Crear tablero combinado con la pieza actual
  const displayBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  // Dibujar pieza fantasma
  if (ghostPiece) {
    for (let y = 0; y < ghostPiece.shape.length; y++) {
      for (let x = 0; x < ghostPiece.shape[y].length; x++) {
        if (ghostPiece.shape[y][x]) {
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
  }
  
  // Dibujar pieza actual
  if (currentPiece) {
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
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
  }

  return (
    <motion.div
      className={`inline-block bg-gray-900/90 p-2 rounded-xl shadow-2xl border-4 ${
        isPlayer2 ? 'border-red-500' : 'border-blue-500'
      }`}
      animate={shake ? {
        x: [0, -5, 5, -5, 5, 0],
        y: [0, -5, 5, -5, 5, 0],
      } : {}}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="grid gap-[1px] bg-gray-800 p-[1px] rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
        }}
      >
        {displayBoard.map((row, y) =>
          row.map((cell, x) => (
            <BoardCell
              key={`${x}-${y}`}
              cell={cell}
              x={x}
              y={y}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

interface CellProps {
  cell: Cell & { isGhost?: boolean };
  x: number;
  y: number;
}

function BoardCell({ cell }: CellProps) {
  if (!cell.filled) {
    return (
      <div className="w-6 h-6 bg-gray-900/50 rounded-sm" />
    );
  }

  if (cell.isGhost) {
    return (
      <div 
        className="w-6 h-6 rounded-sm border-2 border-dashed opacity-30"
        style={{ borderColor: cell.color }}
      />
    );
  }

  return (
    <motion.div
      className="w-6 h-6 rounded-sm shadow-md relative overflow-hidden"
      style={{ backgroundColor: cell.color }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.1 }}
    >
      {/* Brillo superior */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20" />
      
      {/* Icono de gato para piezas especiales */}
      {cell.type && ['CAT_BOMB', 'SCRATCH', 'SLEEP_CAT', 'LUCKY_CAT'].includes(cell.type) && (
        <div className="absolute inset-0 flex items-center justify-center text-xs">
          {cell.type === 'CAT_BOMB' && '💣'}
          {cell.type === 'SCRATCH' && '✂️'}
          {cell.type === 'SLEEP_CAT' && '😴'}
          {cell.type === 'LUCKY_CAT' && '🍀'}
        </div>
      )}
      
      {/* Indicador de basura */}
      {cell.isGarbage && (
        <div className="absolute inset-0 flex items-center justify-center text-[8px]">
          ⚠️
        </div>
      )}
    </motion.div>
  );
}