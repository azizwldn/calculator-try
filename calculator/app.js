const COLS = 10, ROWS = 20, BLOCK = 30;

const PIECES = {
  I: { shape: [[1,1,1,1]], color: '#22d3ee' },
  O: { shape: [[1,1],[1,1]], color: '#facc15' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#c084fc' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#4ade80' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#f87171' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#60a5fa' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#fb923c' },
};

const PIECE_KEYS = Object.keys(PIECES);
const SCORES = [0, 100, 300, 500, 800];
const SPEEDS = [800,700,600,500,400,300,250,200,160,130,100];

// Canvas setup
const canvas  = document.getElementById('board');
const ctx     = canvas.getContext('2d');
const nCanvas = document.getElementById('next');
const nCtx    = nCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const overlay = document.getElementById('overlay');
const oTitle  = document.getElementById('overlay-title');
const oSub    = document.getElementById('overlay-sub');
const startBtn= document.getElementById('start-btn');

let board, piece, nextPiece, score, level, lines, running, paused, dropTimer, lastTime;

// --- Board ---
function makeBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// --- Pieces ---
function randomPiece() {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  const { shape, color } = PIECES[key];
  return {
    shape: shape.map(r => [...r]),
    color,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

function rotate(shape) {
  const rows = shape.length, cols = shape[0].length;
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c])
  );
}

// --- Collision ---
function collides(s, x, y) {
  for (let r = 0; r < s.length; r++)
    for (let c = 0; c < s[r].length; c++)
      if (s[r][c]) {
        const nx = x + c, ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
  return false;
}

// --- Lock & clear ---
function lock() {
  piece.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v) board[piece.y + r][piece.x + c] = piece.color;
    })
  );

  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(c => c)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      r++;
    }
  }

  if (cleared) {
    score += SCORES[cleared] * level;
    lines += cleared;
    level = Math.min(10, Math.floor(lines / 10) + 1);
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = lines;
  }

  piece = nextPiece;
  nextPiece = randomPiece();
  drawNext();

  if (collides(piece.shape, piece.x, piece.y)) {
    gameOver();
  }
}

// --- Ghost piece ---
function ghostY() {
  let y = piece.y;
  while (!collides(piece.shape, piece.x, y + 1)) y++;
  return y;
}

// --- Draw ---
function drawBlock(context, x, y, color, alpha = 1) {
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
  context.fillStyle = 'rgba(255,255,255,0.15)';
  context.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, 4);
  context.globalAlpha = 1;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    ctx.strokeRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK);
  }

  // Board
  board.forEach((row, r) =>
    row.forEach((color, c) => { if (color) drawBlock(ctx, c, r, color); })
  );

  // Ghost
  const gy = ghostY();
  if (gy !== piece.y) {
    piece.shape.forEach((row, r) =>
      row.forEach((v, c) => { if (v) drawBlock(ctx, piece.x + c, gy + r, piece.color, 0.2); })
    );
  }

  // Active piece
  piece.shape.forEach((row, r) =>
    row.forEach((v, c) => { if (v) drawBlock(ctx, piece.x + c, piece.y + r, piece.color); })
  );
}

function drawNext() {
  nCtx.clearRect(0, 0, nCanvas.width, nCanvas.height);
  const s = nextPiece.shape;
  const offX = Math.floor((4 - s[0].length) / 2);
  const offY = Math.floor((4 - s.length) / 2);
  s.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v) {
        nCtx.fillStyle = nextPiece.color;
        nCtx.fillRect((offX + c) * 30 + 1, (offY + r) * 30 + 1, 28, 28);
        nCtx.fillStyle = 'rgba(255,255,255,0.15)';
        nCtx.fillRect((offX + c) * 30 + 1, (offY + r) * 30 + 1, 28, 4);
      }
    })
  );
}

// --- Game loop ---
function loop(ts) {
  if (!running || paused) return;
  const dt = ts - lastTime;
  lastTime = ts;
  dropTimer += dt;

  const speed = SPEEDS[Math.min(level - 1, SPEEDS.length - 1)];
  if (dropTimer >= speed) {
    moveDown();
    dropTimer = 0;
  }

  draw();
  requestAnimationFrame(loop);
}

// --- Moves ---
function moveLeft()  { if (!collides(piece.shape, piece.x - 1, piece.y)) piece.x--; }
function moveRight() { if (!collides(piece.shape, piece.x + 1, piece.y)) piece.x++; }
function moveDown()  {
  if (!collides(piece.shape, piece.x, piece.y + 1)) piece.y++;
  else lock();
}
function hardDrop() {
  piece.y = ghostY();
  lock();
  draw();
}
function rotatePiece() {
  const rot = rotate(piece.shape);
  let kick = 0;
  if (collides(rot, piece.x, piece.y)) {
    kick = piece.x > COLS / 2 ? -1 : 1;
    if (collides(rot, piece.x + kick, piece.y)) return;
  }
  piece.shape = rot;
  piece.x += kick;
}

// --- State ---
function startGame() {
  board     = makeBoard();
  score     = 0; level = 1; lines = 0;
  scoreEl.textContent = 0;
  levelEl.textContent = 1;
  linesEl.textContent = 0;
  piece     = randomPiece();
  nextPiece = randomPiece();
  running   = true;
  paused    = false;
  dropTimer = 0;
  lastTime  = performance.now();
  overlay.classList.add('hidden');
  drawNext();
  requestAnimationFrame(loop);
}

function gameOver() {
  running = false;
  oTitle.textContent = 'GAME OVER';
  oSub.textContent   = `Score: ${score}`;
  startBtn.textContent = 'RESTART';
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  if (!paused) {
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}

// --- Keyboard ---
document.addEventListener('keydown', e => {
  const map = {
    ArrowLeft:  moveLeft,
    ArrowRight: moveRight,
    ArrowDown:  moveDown,
    ArrowUp:    rotatePiece,
    ' ':        running ? hardDrop : startGame,
    'p':        togglePause,
    'P':        togglePause,
  };
  if (map[e.key]) { e.preventDefault(); map[e.key](); }
});

// --- Mobile buttons ---
document.getElementById('btn-left').addEventListener('click', moveLeft);
document.getElementById('btn-right').addEventListener('click', moveRight);
document.getElementById('btn-down').addEventListener('click', moveDown);
document.getElementById('btn-rotate').addEventListener('click', rotatePiece);
document.getElementById('btn-drop').addEventListener('click', hardDrop);
startBtn.addEventListener('click', startGame);

// Touch swipe support
let tx0, ty0;
canvas.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; });
canvas.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx0;
  const dy = e.changedTouches[0].clientY - ty0;
  if (Math.abs(dx) > Math.abs(dy)) dx > 0 ? moveRight() : moveLeft();
  else dy > 0 ? moveDown() : rotatePiece();
});

// Initial draw
board = makeBoard();
piece = randomPiece();
nextPiece = randomPiece();
draw();
drawNext();
