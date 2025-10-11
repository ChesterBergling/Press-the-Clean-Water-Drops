// Game configuration and state variables
const GOAL_CANS = 20;
let currentCans = 0;
let gameActive = false;
let spawnInterval;
let timerInterval;
let timeLeft = 60; // Set initial time to 60 seconds

// Charity: water facts with motivational second sentences
const facts = [
  [
    "771 million people lack access to clean and safe water.",
    "Your actions can help change this reality."
  ],
  [
    "Every day, women and girls spend 200 million hours collecting water.",
    "You can help reduce this burden for families."
  ],
  [
    "Dirty water causes more deaths than all forms of violence, including war.",
    "Together, we can save lives by providing clean water."
  ],
  [
    "Access to clean water improves health, education, and income.",
    "Your support can unlock opportunities for entire communities."
  ],
  [
    "Children are especially vulnerable to waterborne diseases.",
    "You can help protect their futures."
  ]
];

const charityWaterFacts = [
  [
    "771 million people lack access to clean and safe water.",
    "Your support can help bring clean water to those in need."
  ],
  [
    "Every day, women and girls spend 200 million hours collecting water.",
    "You can help reduce this burden and empower communities."
  ],
  [
    "Dirty water causes more deaths than all forms of violence, including war.",
    "Together, we can save lives by providing clean water."
  ],
  [
    "Access to clean water improves health, education, and income.",
    "Your actions can unlock opportunities for entire communities."
  ],
  [
    "Children are especially vulnerable to waterborne diseases.",
    "You can help protect their futures with clean water."
  ],
  [
    "Clean water can change everything for a community.",
    "Your involvement makes real change possible."
  ],
  [
    "100% of public donations to charity: water fund clean water projects.",
    "Every dollar you give goes directly to those who need it."
  ],
  [
    "Since 2006, charity: water has funded over 91,000 water projects.",
    "Your help continues to make a global impact."
  ],
  [
    "Clean water means more time for school, work, and family.",
    "You can help create brighter futures."
  ],
  [
    "Water scarcity affects 1 in 10 people worldwide.",
    "Your action today can change someone's tomorrow."
  ]
];

// Winning and losing messages
const winningMessages = [
  "Amazing! You made a real splash for clean water.",
  "You’re a water hero! Every drop counts.",
  "Victory! Your clicks bring hope to many.",
  "You did it! Clean water is closer thanks to you.",
  "Fantastic! You’ve helped change lives today."
];

const losingMessages = [
  "Keep trying! Every click brings us closer to clean water.",
  "Don't give up! Your effort can make a difference.",
  "Almost there! Try again to help more people.",
  "Every drop matters. Give it another go!",
  "You can do it! Clean water needs your help."
];

// Fisher-Yates shuffle for facts
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const factMessages = [
  [
    "703 million people still lack clean water.",
    "But just $40 can help bring one person lasting access to clean, safe water for life."
  ],
  [
    "Women and girls spend up to 6 hours a day walking for water.",
    "When clean water is close to home, girls can go to school and women can earn an income."
  ],
  [
    "Unsafe water causes millions of preventable diseases each year.",
    "Every new well, filter, or tap brings health, safety, and hope to entire villages."
  ],
  [
    "Contaminated water kills more children than war or violence.",
    "Clean water means kids can grow up healthy, play, and dream of a better future."
  ],
  [
    "In many places, people survive on less than 5 gallons of water a day.",
    "Together, we can change that — one drop, one dollar, one project at a time."
  ],
  [
    "Every minute, someone dies from a water-related illness.",
    "But every minute, charity: water supporters are helping someone else live."
  ],
  [
    "The water crisis is solvable in our lifetime.",
    "With awareness, teamwork, and compassion, we can make clean water accessible to everyone."
  ]
];

// Display a random fact at game start
function showRandomFact() {
  const shuffled = shuffleArray(factMessages.slice());
  const fact = shuffled[0];
  const achievements = document.getElementById('achievements');
  achievements.innerHTML = `<span>${fact[0]} ${fact[1]}</span>`;
}

function updateStats() {
  document.getElementById('current-cans').textContent = currentCans;
  document.getElementById('timer').textContent = timeLeft;
}

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive || paused) return;
  const cells = document.querySelectorAll('.grid-cell');
  // Always clear all cells before spawning
  cells.forEach(cell => (cell.innerHTML = ''));

  // Ensure at least one emoji is always present
  // If for some reason no cell is available, do nothing
  if (cells.length === 0) return;

  // Guarantee 65% clean, 35% dirty
    // Streak reduction logic for 60/40 split
    if (typeof window.dropStreak === 'undefined') {
      window.dropStreak = { type: null, count: 0 };
    }
    let chance = 0.6;
    if (window.dropStreak.count >= 4) {
      // If streak is clean, increase dirty chance; if dirty, increase clean chance
      if (window.dropStreak.type === 'clean') {
        chance = 0.3; // 70% dirty after 4 clean
      } else if (window.dropStreak.type === 'dirty') {
        chance = 0.7; // 70% clean after 4 dirty
      }
    }
    let dropType;
    if (Math.random() < chance) {
      dropType = {
        type: 'clean',
        html: '<img src="img/water-can.png" alt="Water Can" class="water-drop" style="width:2em;height:2em;" />',
        value: 1
      };
    } else {
      dropType = {
        type: 'dirty',
        html: '<span class="water-drop" data-value="-3" style="font-size:2em;cursor:pointer;">🛢️</span>',
        value: -3
      };
    }
    // Update streak tracking
    if (window.dropStreak.type === dropType.type) {
      window.dropStreak.count++;
    } else {
      window.dropStreak.type = dropType.type;
      window.dropStreak.count = 1;
    }

  // Shuffle cells for random placement
  const shuffledCells = shuffleArray(Array.from(cells));
  const randomCell = shuffledCells[0];
  randomCell.innerHTML = `
    <div class="water-can-wrapper">
      ${dropType.html}
    </div>
  `;
  const drop = randomCell.querySelector('.water-drop');
  if (drop) {
    drop.addEventListener('click', collectDrop);
    if (drop.tagName === 'IMG') {
      drop.setAttribute('data-value', dropType.value);
      drop.style.cursor = 'pointer';
    }
  }
}

// Collects a can
function collectDrop(e) {
  if (!gameActive || paused) return; // Prevent collection if paused
  const value = parseInt(e.target.getAttribute('data-value'), 10);
  currentCans += value;
  if (currentCans < 0) currentCans = 0;
  updateStats();
  e.target.parentElement.innerHTML = '';
  if (currentCans >= GOAL_CANS) {
    endGame(true);
  }
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return;
  gameActive = true;
  paused = false;
  currentCans = 0;
  timeLeft = 60; // Ensure timer is set to 60 seconds before and during the game
  updateStats();
  showRandomFact(); // Show fact at game start
  createGrid();
  spawnWaterCan(); // Immediately spawn the first emoji
  spawnInterval = setInterval(spawnWaterCan, 1500); // Spawn water cans every 1.5 seconds
  timerInterval = setInterval(() => {
    if (!paused) {
      timeLeft--;
      updateStats();
      if (timeLeft <= 0) {
        endGame(false);
      }
    }
  }, 1000);
}

function pauseGame() {
  if (!gameActive || paused) return;
  paused = true;
  document.getElementById('achievements').textContent = 'Game paused.';
}

function resumeGame() {
  if (!gameActive || !paused) return;
  paused = false;
  document.getElementById('achievements').textContent = '';
}

function resetGame() {
  gameActive = false;
  paused = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  currentCans = 0;
  timeLeft = 60; // Reset timer to 60 seconds
  updateStats();
  document.getElementById('achievements').textContent = '';
  createGrid();
}

function getRandomMessage(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function endGame(won) {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  const achievements = document.getElementById('achievements');
  if (won) {
    achievements.textContent = getRandomMessage(winningMessages);
  } else {
    achievements.textContent = getRandomMessage(losingMessages);
  }
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('pause-game').addEventListener('click', function() {
  if (!paused) {
    pauseGame();
    this.textContent = 'Resume';
  } else {
    resumeGame();
    this.textContent = 'Pause';
  }
});
document.getElementById('reset-game').addEventListener('click', function() {
  resetGame();
  document.getElementById('pause-game').textContent = 'Pause';
});
