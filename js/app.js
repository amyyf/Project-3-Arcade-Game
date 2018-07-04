/* globals ctx, Resources, Engine */

const startButton = document.getElementById('start');
startButton.addEventListener('click', startGame);

function startGame () {
  removeParagraphs();
  const game = new Game();
  game.makeBug();
  window.game = game;
  window.allEnemies = game.enemies;
  window.player = game.player;
  Engine(window);

  // This listens for key presses and sends the keys to your
  // Player.handleInput() method. You don't need to modify this.
  document.addEventListener('keyup', function (e) {
    e.preventDefault();
    var allowedKeys = {
      37: 'left',
      38: 'up',
      39: 'right',
      40: 'down'
    };
    game.player.handleInput(allowedKeys[e.keyCode]);
  });
}

// Delete direction paragraphs to prevent scrolling during gameplay
function removeParagraphs () {
  const header = document.getElementById('head');
  header.nextElementSibling.remove();
  header.nextElementSibling.remove();
}

// Enemies our player must avoid
var Enemy = function (game) {
  // Variables applied to each of our instances go here,
  // we've provided one for you to get started

  // The image/sprite for our enemies, this uses
  // a helper we've provided to easily load images
  this.sprite = 'images/enemy-bug.png';
  this.x = -100;
  this.y = pickRow(game);
  this.speed = (Math.random() * 400) + 200;
};
// Randomize which row new enemies appear in
function pickRow (game) {
  const rowOptions = game.enemyRows;
  const el = Math.floor((Math.random() * rowOptions.length));
  return rowOptions[el];
}
// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function (dt) {
  // You should multiply any movement by the dt parameter
  // which will ensure the game runs at the same speed for
  // all computers.
  this.x = this.x + (this.speed * dt);
  if (this.x > (ctx.canvas.width)) {
    window.allEnemies.delete(this);
  }
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function () {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

var Player = function (game) {
  this.game = game;
  this.sprite = 'images/char-boy.png';
  this.positionX = game.playerStartX;
  this.positionY = game.playerStartY;
  this.x = game.columns[this.positionX];
  this.y = game.rows[this.positionY];
};

Player.prototype.handleInput = function (direction) {
  switch (direction) {
    case 'left':
      if (this.positionX > 0) {
        this.positionX--;
      }
      break;
    case 'up':
      if (this.positionY > 0) {
        this.positionY--;
      }
      break;
    case 'right':
      if (this.positionX < this.game.columns.length - 1) {
        this.positionX++;
      }
      break;
    case 'down':
      if (this.positionY < this.game.rows.length - 1) {
        this.positionY++;
      }
      break;
  }
  this.calculateScore();
  // return this.positionX || this.positionY;
};

Player.prototype.update = function () {
  this.x = this.game.columns[this.positionX];
  this.y = this.game.rows[this.positionY];
  const bugs = this.game.enemies;
  for (let bug of bugs) {
    if (bug.y === this.y && ((bug.x + 40) > this.x && (bug.x - 40) < this.x)) {
      this.game.scoreboard.decreaseScore();
      this.positionX = this.game.playerStartX;
      this.positionY = this.game.playerStartY;
    }
  }
};

Player.prototype.render = function () {
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.calculateScore = function () {
  window.setTimeout(() => {
    if (this.positionY === this.game.winningRow) {
      this.positionX = this.game.playerStartX;
      this.positionY = this.game.playerStartY;
      this.game.scoreboard.increaseScore();
    }
  }, 250);
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var Game = function () {
  this.columns = [0, 100, 200, 300, 400];
  this.rows = [-20, 60, 140, 220, 300, 380];
  this.enemyRows = this.rows.slice(1, 4);
  this.playerStartX = 2;
  this.playerStartY = 5;
  this.winningRow = 0;
  this.player = new Player(this);
  this.enemies = new Set();
  this.scoreboard = new Scoreboard(this);
};

Game.prototype.makeBug = function () {
  const bug = new Enemy(this);
  this.enemies.add(bug);
  setTimeout(this.makeBug.bind(this), getIntervalTime());
};

Game.prototype.gameOver = function () {
  this.player = null;
  this.enemies = null;
  const gameOver = document.createElement('div');
  const gameOverText = `
    <p class="game-over">Game over!</p>
    <p class="game-over">Your score was ${this.scoreboard.score}</p>
    <p class="game-over">Please refresh the page to play again</p>
  `;
  gameOver.innerHTML = gameOverText;
  document.body.append(gameOver);
  document.getElementsByTagName('canvas')[0].remove();
  startButton.remove();
  this.checkHighScore();
};

Game.prototype.checkHighScore = function () {
  const previousHighScore = localStorage.getItem('high score');
  const currentScore = this.scoreboard.score;
  const highScoreReport = document.createElement('div');
  if (currentScore > previousHighScore) {
    localStorage.setItem('high score', `${this.scoreboard.score}`);
    const newHighScore = `
      <p class="game-over">Congratulations! You have the new high score!</p>
    `;
    highScoreReport.innerHTML = newHighScore;
  } else {
    const tryAgain = `
      <p class="game-over">The high score is ${previousHighScore} - try again!</p>
    `;
    highScoreReport.innerHTML = tryAgain;
  }
  document.body.append(highScoreReport);
};

var Scoreboard = function (game) {
  this.game = game;
  this.score = 0;
  this.timer = 5;
  const doc = window.document;
  const scoreboard = doc.createDocumentFragment();
  const box = doc.createElement('div');
  const timerBox = doc.createElement('div');
  const scoreBox = doc.createElement('div');
  const timer = doc.createElement('span');
  const score = doc.createElement('span');
  box.setAttribute('id', 'box');
  timer.setAttribute('id', 'timerDisplay');
  score.setAttribute('id', 'scoreDisplay');
  timerBox.textContent = 'Seconds remaining: ';
  scoreBox.textContent = 'Score: ';
  timer.textContent = this.timer;
  score.textContent = this.score;
  scoreBox.appendChild(score);
  timerBox.appendChild(timer);
  box.appendChild(timerBox);
  box.appendChild(scoreBox);
  scoreboard.appendChild(box);
  document.body.appendChild(scoreboard);
  this.scoreDisplay = score;
  this.timerDisplay = timer;
  this.countdown(this.game);
};

Scoreboard.prototype.countdown = function (game) {
  this.game = game;
  const interval = setInterval(() => {
    if (this.timer === 0) {
      clearInterval(interval);
      this.game.gameOver();
    } else {
      this.timer--;
      this.timerDisplay.textContent = this.timer;
    }
  }, 1000);
};

Scoreboard.prototype.increaseScore = function () {
  this.score++;
  this.scoreDisplay.textContent = this.score;
};

Scoreboard.prototype.decreaseScore = function () {
  if (this.score > 0) {
    this.score--;
    this.scoreDisplay.textContent = this.score;
  }
};

function getIntervalTime () {
  const int = (Math.random() * 1000) + 500;
  return int;
}
