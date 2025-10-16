// Game configuration and state variables
const GOAL_CANS = 20;
let currentCans = 0;
let gameActive = false;
let paused = false; // previously implicit; declare explicitly
let spawnInterval; // ...existing variable kept for compatibility but not used
let clearTimeoutId = null;
let spawnTimeoutId = null;
let timerInterval;
let timeLeft = 60; // will be initialized to current difficulty time after grid creation

// Difficulty settings (spawn rate in ms, starting time in seconds)
const DIFFICULTY_SETTINGS = {
  easy: { spawnRate: 900, time: 60, baseCleanChance: 0.75 },
  medium: { spawnRate: 900, time: 60, baseCleanChance: 0.7 },
  hard: { spawnRate: 900, time: 60, baseCleanChance: 0.6 }
};

let currentDifficulty = 'hard'; // Default difficulty is hard
const STREAK_THRESHOLD = 3; // trigger altered probabilities after 3 in a row

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

// Initialize display time to match default difficulty
timeLeft = DIFFICULTY_SETTINGS[currentDifficulty].time;
updateStats();

// ensure we can cancel scheduled clears
if (typeof window._clearAllTimeoutId === 'undefined') window._clearAllTimeoutId = null;

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive || paused) return;
  const cells = document.querySelectorAll('.grid-cell');
  if (cells.length === 0) return;

  // Initialize streak tracker if needed
  if (typeof window.dropStreak === 'undefined') {
    window.dropStreak = { type: null, count: 0 };
  }

  // Get base clean chance for the current difficulty
  let chance = DIFFICULTY_SETTINGS[currentDifficulty].baseCleanChance;

  // Adjust probabilities based on streak
  if (window.dropStreak.count >= STREAK_THRESHOLD && window.dropStreak.type) {
    const streakType = window.dropStreak.type;
    if (streakType === 'clean') {
      chance = currentDifficulty === 'easy' ? 0.8 : currentDifficulty === 'medium' ? 0.7 : 0.3;
    } else if (streakType === 'dirty') {
      chance = currentDifficulty === 'easy' ? 0.9 : currentDifficulty === 'medium' ? 0.8 : 0.7;
    }
  }

  // Decide drop type based on computed chance
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

  // Use Fisher-Yates shuffle to randomize cell order, then pick first empty if available
  const shuffledCells = shuffleArray(Array.from(cells));
  const targetCell = shuffledCells.find(cell => !cell.querySelector('.water-drop')) || shuffledCells[0];

  // Ensure only one emoji present: clear all cells before placing a new one
  const allCells = document.querySelectorAll('.grid-cell');
  allCells.forEach(cell => (cell.innerHTML = ''));

  targetCell.innerHTML = `
    <div class="water-can-wrapper">
      ${dropType.html}
    </div>
  `;

  // Update streak tracking based on the spawned drop
  if (window.lastSpawnType === dropType.type) {
    window.dropStreak.count++;
  } else {
    window.dropStreak.type = dropType.type;
    window.dropStreak.count = 1;
  }
  window.lastSpawnType = dropType.type;

  const drop = targetCell.querySelector('.water-drop');
  if (drop) {
    drop.addEventListener('click', collectDrop);
    if (drop.tagName === 'IMG') {
      drop.setAttribute('data-value', dropType.value);
      drop.style.cursor = 'pointer';
    }
  }

  // Schedule clearing all cells after 1 second
  if (clearTimeoutId) clearTimeout(clearTimeoutId);
  clearTimeoutId = setTimeout(() => {
    allCells.forEach(cell => (cell.innerHTML = ''));
    clearTimeoutId = null;

    // Schedule the next spawn exactly 1 second after clearing
    if (spawnTimeoutId) clearTimeout(spawnTimeoutId);
    spawnTimeoutId = setTimeout(() => {
      spawnTimeoutId = null;
      if (gameActive && !paused) spawnWaterCan();
    }, 1000);
  }, 1000);
}

// Collects a can
function collectDrop(e) {
	if (!gameActive || paused) return; // Prevent collection if paused

	// If there's a pending scheduled clear, cancel it because we're clearing now
	if (clearTimeoutId) {
		clearTimeout(clearTimeoutId);
		clearTimeoutId = null;
	}
	// If there's a pending scheduled spawn, cancel it to reschedule after the clear
	if (spawnTimeoutId) {
		clearTimeout(spawnTimeoutId);
		spawnTimeoutId = null;
	}

	const value = parseInt(e.target.getAttribute('data-value'), 10);
	currentCans += value;
	if (currentCans < 0) currentCans = 0;
	updateStats();

	// Remove the clicked drop immediately
	const wrapper = e.target.closest('.water-can-wrapper');
	if (wrapper) wrapper.innerHTML = '';

	// Schedule a full clear (in case any leftover) and next spawn in the exact sequence:
	// clear now (already cleared clicked cell), then 1s later spawn next emoji
	// we ensure no emoji visible during the 1s gap by clearing all cells now
	const all = document.querySelectorAll('.grid-cell');
	all.forEach(cell => (cell.innerHTML = ''));

	// schedule next spawn exactly 1s after this clear
	spawnTimeoutId = setTimeout(() => {
		spawnTimeoutId = null;
		if (gameActive && !paused) spawnWaterCan();
	}, 1000);

	if (currentCans >= GOAL_CANS) {
		endGame(true);
	}
}

// Helper to enforce a maximum interval so a new emoji appears at least every 2s
function getSpawnRateForDifficulty(level) {
  const raw = (DIFFICULTY_SETTINGS[level] && DIFFICULTY_SETTINGS[level].spawnRate) || 1500;
  return Math.min(raw, 2000); // cap at 2000ms
}

// Simple canvas-based confetti (no external libs)
function launchConfetti(duration = 3000, particleCount = 120) {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  const colors = ['#ffd600','#2E9DF7','#8BD1CB','#4FCB53','#FF902A','#F5402C','#F16061'];
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * -H * 0.2,
      size: 6 + Math.random() * 8,
      gravity: 0.3 + Math.random() * 0.6,
      rotation: Math.random() * 2 * Math.PI,
      tilt: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 4 + 2
    });
  }

  const start = performance.now();
  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, W, H);
    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity * 0.02;
      p.rotation += 0.1;
      // draw as rotated rectangle
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      document.body.removeChild(canvas);
    }
  }
  requestAnimationFrame(frame);
}

// Set difficulty (update UI and reset game)
function setDifficulty(level) {
  if (!DIFFICULTY_SETTINGS[level]) return;

  resetGame(); // Reset the game when difficulty changes
  currentDifficulty = level;

  // Update button active states
  document.querySelectorAll('.difficulty-button').forEach(btn => {
    btn.classList.toggle('active', btn.id === `difficulty-${level}`);
  });

  // Update displayed time to match the chosen difficulty
  timeLeft = DIFFICULTY_SETTINGS[level].time;
  updateStats();

  const achievements = document.getElementById('achievements');
  achievements.textContent = `Difficulty set to ${level}.`;
  setTimeout(() => {
    if (achievements.textContent === `Difficulty set to ${level}.`) achievements.textContent = '';
  }, 1500);
}

// Add event listeners for difficulty buttons
document.getElementById('difficulty-easy').addEventListener('click', () => setDifficulty('easy'));
document.getElementById('difficulty-medium').addEventListener('click', () => setDifficulty('medium'));
document.getElementById('difficulty-hard').addEventListener('click', () => setDifficulty('hard'));

// Initializes and starts a new game
function startGame() {
	if (gameActive) return;
	gameActive = true;
	paused = false;
	currentCans = 0;
	// Use the selected difficulty's starting time (now all 60s)
	timeLeft = DIFFICULTY_SETTINGS[currentDifficulty].time;
	updateStats();
	showRandomFact(); // Show fact at game start
	createGrid();

	// Immediately clear any existing interval and spawn once
	clearInterval(spawnInterval);
	spawnWaterCan(); // Immediately spawn the first emoji

	// Use the selected difficulty's spawn rate (capped to 2000ms)
	// spawnInterval = setInterval(spawnWaterCan, getSpawnRateForDifficulty(currentDifficulty));

	timerInterval = setInterval(() => {
		if (!paused) {
			timeLeft--;
			updateStats();
			if (timeLeft <= 0) {
				endGame(false);
			}
		}
	}, 1000);

	// cancel any pending timeouts to avoid unexpected spawns/clears
	if (clearTimeoutId) {
		clearTimeout(clearTimeoutId);
		clearTimeoutId = null;
	}
	if (spawnTimeoutId) {
		clearTimeout(spawnTimeoutId);
		spawnTimeoutId = null;
	}

	// Ensure one immediate spawn following the strict cycle
	spawnWaterCan();
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
  // spawn immediately so grid isn't empty until next interval
  spawnWaterCan();
}

function resetGame() {
	gameActive = false;
	paused = false;
	clearInterval(spawnInterval);
	clearInterval(timerInterval);
	currentCans = 0;
	// Reset timer to the current difficulty's starting time
	timeLeft = DIFFICULTY_SETTINGS[currentDifficulty].time;
	updateStats();
	document.getElementById('achievements').textContent = '';
	createGrid();

	// Fix spawn bug: clear streak tracking so probabilities don't carry over
	if (typeof window.dropStreak !== 'undefined') {
		window.dropStreak.type = null;
		window.dropStreak.count = 0;
	} else {
		window.dropStreak = { type: null, count: 0 };
	}

	// Ensure pause button label is consistent
	const pauseBtn = document.getElementById('pause-game');
	if (pauseBtn) pauseBtn.textContent = 'Pause';

	// cancel pending timeouts
	if (clearTimeoutId) {
		clearTimeout(clearTimeoutId);
		clearTimeoutId = null;
	}
	if (spawnTimeoutId) {
		clearTimeout(spawnTimeoutId);
		spawnTimeoutId = null;
	}
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
		// confetti for win
		launchConfetti();
		achievements.textContent = getRandomMessage(winningMessages);
	} else {
		achievements.textContent = getRandomMessage(losingMessages);
	}

	// cancel pending timeouts
	if (clearTimeoutId) {
		clearTimeout(clearTimeoutId);
		clearTimeoutId = null;
	}
	if (spawnTimeoutId) {
		clearTimeout(spawnTimeoutId);
		spawnTimeoutId = null;
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
