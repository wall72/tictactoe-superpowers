const test = require('node:test');
const assert = require('node:assert');
const { createEmptyBoard, checkWinner } = require('../../main/resources/static/js/game-logic.js');
const { getMinimaxMove } = require('../../main/resources/static/js/ai.js');

test('getMinimaxMove takes the immediate winning move', () => {
  const board = ['O', 'O', null, 'X', 'X', null, null, null, null];
  assert.strictEqual(getMinimaxMove(board, 'O', 'X'), 2);
});

test('getMinimaxMove blocks the human from winning', () => {
  const board = ['X', 'X', null, 'O', null, null, null, null, null];
  assert.strictEqual(getMinimaxMove(board, 'O', 'X'), 2);
});

test('minimax vs minimax from empty board always ends in a draw', () => {
  let board = createEmptyBoard();
  let turn = 'X';
  while (checkWinner(board) === null) {
    const move = turn === 'X' ? getMinimaxMove(board, 'X', 'O') : getMinimaxMove(board, 'O', 'X');
    board[move] = turn;
    turn = turn === 'X' ? 'O' : 'X';
  }
  assert.strictEqual(checkWinner(board), 'draw');
});
