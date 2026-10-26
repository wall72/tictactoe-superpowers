const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function createEmptyBoard() {
  return new Array(9).fill(null);
}

function getAvailableMoves(board) {
  const moves = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      moves.push(i);
    }
  }
  return moves;
}

function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (getAvailableMoves(board).length === 0) {
    return 'draw';
  }
  return null;
}

function getRandomMove(board) {
  const moves = getAvailableMoves(board);
  const index = Math.floor(Math.random() * moves.length);
  return moves[index];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createEmptyBoard, getAvailableMoves, checkWinner, getRandomMove };
}
