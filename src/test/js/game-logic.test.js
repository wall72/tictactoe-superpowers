const test = require('node:test');
const assert = require('node:assert');
const { createEmptyBoard, getAvailableMoves, checkWinner, getRandomMove, getNextSymbol, getResultMessage } =
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

test('getNextSymbol returns O when given X', () => {
  assert.strictEqual(getNextSymbol('X'), 'O');
});

test('getNextSymbol returns X when given O', () => {
  assert.strictEqual(getNextSymbol('O'), 'X');
});

test('getResultMessage for PVP mode uses winner-based wording', () => {
  assert.strictEqual(getResultMessage('PVP', 'X'), 'X 승리!');
  assert.strictEqual(getResultMessage('PVP', 'O'), 'O 승리!');
  assert.strictEqual(getResultMessage('PVP', 'draw'), '무승부입니다.');
});

test('getResultMessage for EASY/HARD mode keeps human-perspective wording', () => {
  assert.strictEqual(getResultMessage('EASY', 'X'), '승리했습니다!');
  assert.strictEqual(getResultMessage('HARD', 'O'), '패배했습니다.');
  assert.strictEqual(getResultMessage('EASY', 'draw'), '무승부입니다.');
});
