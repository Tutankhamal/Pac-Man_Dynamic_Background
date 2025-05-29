const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let tileSize;
let cols = 28;
let rows = 31;
let maze = [];
let particles = [];
let pacman;

function calculateTileSize() {
  const baseSize = Math.floor(window.innerWidth / 48);
  const isDesktop = window.innerWidth >= 1024;
  const boostedSize = isDesktop ? Math.floor(baseSize * 1.2) : baseSize;
  const maxSize = isDesktop ? 19 : 16;

  return Math.max(8, Math.min(boostedSize, maxSize));
}

function resizeCanvas() {
  tileSize = calculateTileSize();
  canvas.width = tileSize * cols;
  canvas.height = tileSize * rows;

  maze = generateMaze(cols, rows);
  particles = createParticles();
  pacman = new PacMan(Math.floor(cols / 2), Math.floor(rows / 2));

  centerCanvas();
}

function centerCanvas() {
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";
}

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeCanvas, 150);
});

class PacMan {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.pixelX = x * tileSize + tileSize / 2;
    this.pixelY = y * tileSize + tileSize / 2;
    this.radius = tileSize * 0.4;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = "yellow";
    ctx.arc(this.pixelX, this.pixelY, this.radius, 0.25 * Math.PI, 1.75 * Math.PI);
    ctx.lineTo(this.pixelX, this.pixelY);
    ctx.fill();
  }
}

function generateMaze(cols, rows) {
  const maze = [];
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      // 1 = parede, 0 = caminho (exemplo simples)
      row.push((x % 2 === 1 && y % 2 === 1) ? 0 : 1);
    }
    maze.push(row);
  }
  return maze;
}

function createParticles() {
  const particleCount = 80;
  const list = [];
  for (let i = 0; i < particleCount; i++) {
    list.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
    });
  }
  return list;
}

function drawParticles() {
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    p.x += p.dx;
    p.y += p.dy;

    if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
  }
}

function drawMaze() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (maze[y][x] === 1) {
        ctx.fillStyle = "rgba(0, 0, 255, 0.4)";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawParticles();
  drawMaze();
  pacman.draw();
  requestAnimationFrame(gameLoop);
}

// Inicializa tudo
resizeCanvas();
gameLoop();
