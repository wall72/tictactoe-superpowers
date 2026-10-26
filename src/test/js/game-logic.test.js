const test = require('node:test');
const assert = require('node:assert');
const { createEmptyBoard, getAvailableMoves, checkWinner, getRandomMove } =
  require('../../main/resources/static/js/game-logic.js');

test('checkWinner detects a row win for X', () => {
  const board = ['X', 'X', 'X', null, null, null, null, null, null];
  assert.strictEqual(checkWinner(board), 'X');
});

test('checkWinner returns draw when board is full with no winner', () => {
  const board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
  assert.strictEqual(checkWinner(board), 'draw');
});

test('checkWinner returns null when game is still ongoing', () => {
  const board = createEmptyBoard();
  assert.strictEqual(checkWinner(board), null);
});

test('getRandomMove only returns indices of empty cells', () => {
  const board = ['X', null, 'O', null, null, null, null, null, null];
  const move = getRandomMove(board);
  assert.ok(getAvailableMoves(board).includes(move));
});
