import { cn } from '../../lib/utils'
import { Cell } from './Cell'
import { checkWinner, isEmpty, getBoardSize } from '../../lib/gameLogic'

export function Board({ board, onCellClick, disabled, currentPlayer }) {
  // Guard against undefined/null board (e.g., when game is deleted)
  if (!board || !Array.isArray(board)) {
    return null
  }

  const boardSize = getBoardSize(board)
  const winResult = checkWinner(board)

  return (
    <div className="relative">
      <div
        className={cn(
          'grid gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl',
          boardSize === 3 && 'grid-cols-3',
          boardSize === 4 && 'grid-cols-4',
          boardSize === 5 && 'grid-cols-5'
        )}
      >
        {board.map((cell, index) => (
          <Cell
            key={index}
            value={cell}
            onClick={() => onCellClick(index)}
            disabled={disabled || !isEmpty(cell)}
            isWinningCell={winResult?.line?.includes(index)}
            currentPlayer={currentPlayer}
            boardSize={boardSize}
          />
        ))}
      </div>

      {/* Win line overlay */}
      {winResult && (
        <WinLine line={winResult.line} boardSize={boardSize} />
      )}
    </div>
  )
}

function WinLine({ line, boardSize }) {
  const getLineCoordinates = () => {
    const cellSize = 100 / boardSize

    // Generate positions dynamically based on board size
    const getPosition = (index) => {
      const row = Math.floor(index / boardSize)
      const col = index % boardSize
      return {
        x: cellSize * (col + 0.5),
        y: cellSize * (row + 0.5),
      }
    }

    const start = getPosition(line[0])
    const end = getPosition(line[line.length - 1])

    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y }
  }

  const { x1, y1, x2, y2 } = getLineCoordinates()

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary-500 win-line"
        style={{
          strokeDasharray: 100,
          strokeDashoffset: 100,
          animation: 'winLine 0.5s ease-out forwards',
        }}
      />
    </svg>
  )
}
