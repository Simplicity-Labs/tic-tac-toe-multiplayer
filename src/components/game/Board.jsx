import { useState } from 'react'
import { cn } from '../../lib/utils'
import { Cell } from './Cell'
import { checkWinner, isEmpty, getBoardSize, getBoardDimensions, getColumn, getColumnPreviewPosition } from '../../lib/gameLogic'

export function Board({ board, onCellClick, disabled, currentPlayer, decayStatusArray, isGravityMode }) {
  const [hoveredColumn, setHoveredColumn] = useState(null)

  // Guard against undefined/null board (e.g., when game is deleted)
  if (!board || !Array.isArray(board)) {
    return null
  }

  const boardSize = getBoardSize(board)
  const { cols, rows } = getBoardDimensions(boardSize)
  const winResult = checkWinner(board)

  // Calculate preview position for gravity mode
  const gravityPreviewPosition = isGravityMode && hoveredColumn !== null && !disabled
    ? getColumnPreviewPosition(board, hoveredColumn, boardSize)
    : null

  const handleCellHover = (index) => {
    if (isGravityMode && !disabled) {
      setHoveredColumn(getColumn(index, boardSize))
    }
  }

  const handleBoardLeave = () => {
    setHoveredColumn(null)
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'grid gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl',
          cols === 3 && 'grid-cols-3',
          cols === 4 && 'grid-cols-4',
          cols === 5 && 'grid-cols-5',
          cols === 7 && 'grid-cols-7'
        )}
        onMouseLeave={handleBoardLeave}
      >
        {board.map((cell, index) => (
          <Cell
            key={index}
            value={cell}
            onClick={() => onCellClick(index)}
            onHover={() => handleCellHover(index)}
            disabled={disabled || (!isGravityMode && !isEmpty(cell))}
            isWinningCell={winResult?.line?.includes(index)}
            currentPlayer={currentPlayer}
            boardSize={boardSize}
            decayStatus={decayStatusArray?.[index]}
            isGravityPreview={gravityPreviewPosition === index}
            isGravityMode={isGravityMode}
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
  const { cols, rows } = getBoardDimensions(boardSize)

  const getLineCoordinates = () => {
    const cellWidth = 100 / cols
    const cellHeight = 100 / rows

    // Generate positions dynamically based on board dimensions
    const getPosition = (index) => {
      const row = Math.floor(index / cols)
      const col = index % cols
      return {
        x: cellWidth * (col + 0.5),
        y: cellHeight * (row + 0.5),
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
