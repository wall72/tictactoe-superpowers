var getAvailableMoves, checkWinner;
if (typeof module !== 'undefined' && module.exports) {
  ({ getAvailableMoves, checkWinner } = require('./game-logic.js'));
}

function minimax(board, currentPlayer, aiSymbol, humanSymbol, depth) {
  const winner = checkWinner(board);
  if (winner === aiSymbol) return 10 - depth;
  if (winner === humanSymbol) return depth - 10;
  if (winner === 'draw') return 0;

  const moves = getAvailableMoves(board);
  const isAiTurn = currentPlayer === aiSymbol;
  let best = isAiTurn ? -Infinity : Infinity;

  for (const move of moves) {
    board[move] = currentPlayer;
    const score = minimax(board, currentPlayer === aiSymbol ? humanSymbol : aiSymbol, aiSymbol, humanSymbol, depth + 1);
    board[move] = null;
    best = isAiTurn ? Math.max(best, score) : Math.min(best, score);
  }

  return best;
}

function getMinimaxMove(board, aiSymbol, humanSymbol) {
  let bestScore = -Infinity;
  let bestMove = null;

  for (const move of getAvailableMoves(board)) {
    board[move] = aiSymbol;
    const score = minimax(board, humanSymbol, aiSymbol, humanSymbol, 1);
    board[move] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getMinimaxMove };
}
