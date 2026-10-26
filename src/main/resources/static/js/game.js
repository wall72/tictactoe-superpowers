(function () {
  var difficultySelect = document.getElementById('difficulty-select');
  var gameBoard = document.getElementById('game-board');
  var boardElement = document.getElementById('board');
  var cells = Array.prototype.slice.call(boardElement.querySelectorAll('.cell'));
  var resultBanner = document.getElementById('result-banner');
  var restartButton = document.getElementById('restart-button');
  var changeDifficultyButton = document.getElementById('change-difficulty-button');
  var easyButton = document.getElementById('easy-button');
  var hardButton = document.getElementById('hard-button');

  var HUMAN = 'X';
  var COMPUTER = 'O';

  var difficulty = null; // 'EASY' | 'HARD'
  var board = createEmptyBoard();
  var gameOver = true;

  function render() {
    cells.forEach(function (cell, index) {
      cell.textContent = board[index] || '';
    });
  }

  function startGame(selectedDifficulty) {
    difficulty = selectedDifficulty;
    board = createEmptyBoard();
    gameOver = false;
    resultBanner.textContent = '';
    difficultySelect.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    render();
  }

  function computerMove() {
    var move = difficulty === 'HARD'
      ? getMinimaxMove(board, COMPUTER, HUMAN)
      : getRandomMove(board);
    board[move] = COMPUTER;
  }

  function finishGame(winner) {
    gameOver = true;
    var outcome;
    if (winner === HUMAN) {
      outcome = 'WIN';
      resultBanner.textContent = '승리했습니다!';
    } else if (winner === COMPUTER) {
      outcome = 'LOSE';
      resultBanner.textContent = '패배했습니다.';
    } else {
      outcome = 'DRAW';
      resultBanner.textContent = '무승부입니다.';
    }
    submitResult(difficulty, outcome).then(refreshStats);
  }

  function handleCellClick(event) {
    if (gameOver) return;
    var index = Number(event.currentTarget.getAttribute('data-index'));
    if (board[index] !== null) return;

    board[index] = HUMAN;
    render();

    var winner = checkWinner(board);
    if (winner !== null) {
      finishGame(winner);
      return;
    }

    computerMove();
    render();

    winner = checkWinner(board);
    if (winner !== null) {
      finishGame(winner);
    }
  }

  function refreshStats() {
    fetchStats().then(function (stats) {
      document.getElementById('easy-win').textContent = stats.easy.win;
      document.getElementById('easy-lose').textContent = stats.easy.lose;
      document.getElementById('easy-draw').textContent = stats.easy.draw;
      document.getElementById('hard-win').textContent = stats.hard.win;
      document.getElementById('hard-lose').textContent = stats.hard.lose;
      document.getElementById('hard-draw').textContent = stats.hard.draw;
    });
  }

  cells.forEach(function (cell) {
    cell.addEventListener('click', handleCellClick);
  });

  easyButton.addEventListener('click', function () {
    startGame('EASY');
  });

  hardButton.addEventListener('click', function () {
    startGame('HARD');
  });

  function returnToDifficultySelect() {
    gameOver = true;
    gameBoard.classList.add('hidden');
    difficultySelect.classList.remove('hidden');
  }

  restartButton.addEventListener('click', function () {
    startGame(difficulty);
  });

  changeDifficultyButton.addEventListener('click', function () {
    returnToDifficultySelect();
  });

  refreshStats();
})();
