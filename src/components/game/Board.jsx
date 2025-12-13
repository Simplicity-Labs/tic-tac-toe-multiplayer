import { cn } from '../../lib/utils'
import { Cell } from './Cell'
import { checkWinner, isEmpty } from '../../lib/gameLogic'

export function Board({ board, onCellClick, disabled, currentPlayer }) {
  // Guard against undefined/null board (e.g., when game is deleted)
  if (!board || !Array.isArray(board)) {
    return null
  }

  const winResult = checkWinner(board)

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        {board.map((cell, index) => (
          <Cell
            key={index}
            value={cell}
            onClick={() => onCellClick(index)}
            disabled={disabled || !isEmpty(cell)}
            isWinningCell={winResult?.line?.includes(index)}
            currentPlayer={currentPlayer}
          />
        ))}
      </div>

      {/* Win line overlay */}
      {winResult && (
        <WinLine line={winResult.line} />
      )}
    </div>
  )
}

function WinLine({ line }) {
  const getLineCoordinates = () => {
    const cellSize = 100 / 3
    const positions = {
      0: { x: cellSize / 2, y: cellSize / 2 },
      1: { x: cellSize * 1.5, y: cellSize / 2 },
      2: { x: cellSize * 2.5, y: cellSize / 2 },
      3: { x: cellSize / 2, y: cellSize * 1.5 },
      4: { x: cellSize * 1.5, y: cellSize * 1.5 },
      5: { x: cellSize * 2.5, y: cellSize * 1.5 },
      6: { x: cellSize / 2, y: cellSize * 2.5 },
      7: { x: cellSize * 1.5, y: cellSize * 2.5 },
      8: { x: cellSize * 2.5, y: cellSize * 2.5 },
    }

    const start = positions[line[0]]
    const end = positions[line[2]]

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
