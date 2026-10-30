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
  var pvpButton = document.getElementById('pvp-button');
  var turnIndicator = document.getElementById('turn-indicator');

  var HUMAN = 'X';
  var COMPUTER = 'O';

  var difficulty = null; // 'EASY' | 'HARD' | 'PVP'
  var board = createEmptyBoard();
  var gameOver = true;
  var currentTurn = HUMAN;

  function render() {
    cells.forEach(function (cell, index) {
      cell.textContent = board[index] || '';
    });
  }

  function startGame(selectedDifficulty) {
    difficulty = selectedDifficulty;
    board = createEmptyBoard();
    gameOver = false;
    currentTurn = HUMAN;
    resultBanner.textContent = '';
    difficultySelect.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    render();
    updateTurnIndicator();
  }

  function updateTurnIndicator() {
    if (difficulty === 'PVP' && !gameOver) {
      turnIndicator.classList.remove('hidden');
      turnIndicator.textContent = currentTurn + ' 차례';
    } else {
      turnIndicator.classList.add('hidden');
    }
  }

  function computerMove() {
    var move = difficulty === 'HARD'
      ? getMinimaxMove(board, COMPUTER, HUMAN)
      : getRandomMove(board);
    board[move] = COMPUTER;
  }

  function finishGame(winner) {
    gameOver = true;
    resultBanner.textContent = getResultMessage(difficulty, winner);
    if (difficulty !== 'PVP') {
      var outcome;
      if (winner === HUMAN) {
        outcome = 'WIN';
      } else if (winner === COMPUTER) {
        outcome = 'LOSE';
      } else {
        outcome = 'DRAW';
      }
      submitResult(difficulty, outcome).then(refreshStats);
    }
    updateTurnIndicator();
  }

  function handleCellClick(event) {
    if (gameOver) return;
    var index = Number(event.currentTarget.getAttribute('data-index'));
    if (board[index] !== null) return;

    if (difficulty === 'PVP') {
      board[index] = currentTurn;
      render();

      var pvpWinner = checkWinner(board);
      if (pvpWinner !== null) {
        finishGame(pvpWinner);
        return;
      }

      currentTurn = getNextSymbol(currentTurn);
      updateTurnIndicator();
      return;
    }

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

  pvpButton.addEventListener('click', function () {
    startGame('PVP');
  });

  function returnToDifficultySelect() {
    gameOver = true;
    gameBoard.classList.add('hidden');
    difficultySelect.classList.remove('hidden');
    turnIndicator.classList.add('hidden');
  }

  restartButton.addEventListener('click', function () {
    startGame(difficulty);
  });

  changeDifficultyButton.addEventListener('click', function () {
    returnToDifficultySelect();
  });

  refreshStats();
})();
