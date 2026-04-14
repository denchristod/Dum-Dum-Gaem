// Dum Dum Gaem Script

const sounds = {
  click: new Audio('click.wav'),
  correct: new Audio('correct.wav'),
  wrong: new Audio('wrong.wav')
};

function playSound(name) {
  const sound = sounds[name];
  if (!sound) return;

  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function vibrate(pattern = 50) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

let gameData = [];

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    gameData = data.game_data;
    console.log('Loaded:', gameData);

    // Enable start button AFTER data loads
    document.getElementById('startGame').disabled = false;
  })
  .catch(error => console.error('Error loading JSON:', error));

// Game state
let state = {
  team1Name: 'Team Dum',
  team2Name: 'Team Bum',
  score1: 0,
  score2: 0,
  currentTeam: 1,
  round: 1,
  totalRounds: 3,
  timePerRound: 60,
  timeLeft: 60,
  paused: false,
  timerInterval: null,
  cards: [],
  currentCardIndex: 0,
  isPlaying: false
};

const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const turnScreen = document.getElementById('turnScreen');
const gameOverScreen = document.getElementById('gameOverScreen');

const timerDisplay = document.getElementById('timer');
const roundDisplay = document.getElementById('roundNum');
const easyWord = document.getElementById('easyWord');
const hardWord = document.getElementById('hardWord');
const card = document.getElementById('card');
const pauseBtn = document.getElementById('pauseBtn');

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function init() {
  // setup time
  document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.timePerRound = parseInt(btn.dataset.time);
    });
  });

  // setup rounds
  document.querySelectorAll('.round-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.round-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.totalRounds = parseInt(btn.dataset.rounds);
    });
  });

  document.getElementById('startGame').addEventListener('click', startGame);
  document.getElementById('readyBtn').addEventListener('click', startTurn);
  document.getElementById('skipBtn').addEventListener('click', () => 
  { addPoints(-1); 
    playSound('wrong');
    vibrate(120);});
  document.getElementById('easyBtn').addEventListener('click', () => 
  { addPoints(1); 
    playSound('correct');
    vibrate(80);});
  document.getElementById('hardBtn').addEventListener('click', () => 
  { addPoints(3); 
    playSound('correct');
    vibrate(80);});
  document.getElementById('playAgainBtn').addEventListener('click', resetGame);
  pauseBtn.addEventListener('click', togglePause);
}

function startGame() {
  state.score1 = 0;
  state.score2 = 0;
  state.currentTeam = 1;
  state.round = 1;
  state.cards = shuffle(gameData);
  state.currentCardIndex = 0;

  setupScreen.classList.add('hidden');
  showTurnScreen();
}

function showTurnScreen() {
  const teamName = state.currentTeam === 1 ? state.team1Name : state.team2Name;
  const highlight = document.getElementById('turnTeamHighlight');
  highlight.textContent = teamName;
  highlight.className = 'team-highlight team' + state.currentTeam;
  turnScreen.classList.add('active');
}

function startTurn() {
  turnScreen.classList.remove('active');
  gameScreen.classList.add('active');
  updateScoreDisplay();
  state.timeLeft = state.timePerRound;
  timerDisplay.textContent = state.timeLeft;
  roundDisplay.textContent = state.round;
  state.isPlaying = true;
  state.paused = false;
  showCard();
  state.timerInterval = setInterval(tick, 1000);
}

function tick() {
  if (state.paused || !state.isPlaying) return;
  state.timeLeft--;
  timerDisplay.textContent = state.timeLeft;
  if (state.timeLeft <= 0) endTurn();
}

function togglePause() {
  state.paused = !state.paused;

  pauseBtn.classList.toggle('active', state.paused);

  const icon = pauseBtn.querySelector('i');

  if (state.paused) {
    icon.classList.remove('fa-pause');
    icon.classList.add('fa-play');
  } else {
    icon.classList.remove('fa-play');
    icon.classList.add('fa-pause');
  }
}

function showCard() {
  if (state.currentCardIndex >= state.cards.length) {
    state.cards = shuffle(gameData);
    state.currentCardIndex = 0;
  }
  const c = state.cards[state.currentCardIndex];
  easyWord.textContent = c["1"];
  hardWord.textContent = c["3"];
}

function addPoints(points) {
  if (!state.isPlaying || state.paused) return;

  if (state.currentTeam === 1) {
    state.score1 = Math.max(0, state.score1 + points);
  } else {
    state.score2 = Math.max(0, state.score2 + points);
  }
  updateScoreDisplay();
  state.currentCardIndex++;
  showCard();
  card.style.transform = 'scale(0.95)';
  setTimeout(() => card.style.transform = 'scale(1)', 100);
}

function updateScoreDisplay() {
  document.getElementById('score1').textContent = state.score1;
  document.getElementById('score2').textContent = state.score2;
  document.getElementById('team1Box').classList.toggle('active-team', state.currentTeam === 1);
  document.getElementById('team2Box').classList.toggle('active-team', state.currentTeam === 2);
}

function endTurn() {
  clearInterval(state.timerInterval);
  state.isPlaying = false;
  state.paused = false;
  pauseBtn.classList.remove('active');
  const icon = pauseBtn.querySelector('i');
  icon.classList.remove('fa-play');
  icon.classList.add('fa-pause');

  state.currentCardIndex++;

  // Switch teams or rounds
  if (state.currentTeam === 1) {
    state.currentTeam = 2;
    showTurnScreen();
  } else {
    if (state.round >= state.totalRounds) {
      endGame();
    } else {
      state.round++;
      state.currentTeam = 1;
      showTurnScreen();
    }
  }
}

function endGame() {
  gameScreen.classList.remove('active');
  let winner;
  if (state.score1 > state.score2) winner = state.team1Name + ' Wins!';
  else if (state.score2 > state.score1) winner = state.team2Name + ' Wins!';
  else winner = "It's a Tie!";
  document.getElementById('winnerName').textContent = winner;
  document.getElementById('final1Score').textContent = state.score1;
  document.getElementById('final2Score').textContent = state.score2;
  gameOverScreen.classList.add('active');
}

function resetGame() {
  gameOverScreen.classList.remove('active');
  gameScreen.classList.remove('active');
  setupScreen.classList.remove('hidden');
}

init();
