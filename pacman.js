<canvas id="gameCanvas"></canvas>
<script>
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const tileSize = 24;
const cols = Math.floor(canvas.width / tileSize);
const rows = Math.floor(canvas.height / tileSize);
let maze = [];

let pacman = { x: 1, y: 1 };
let fruit = { x: cols - 2, y: rows - 2 };
let path = [];
let mouseTile = null;
let frameCount = 0;
let hasEatenFruit = false;

// Criação do labirinto
function generateMaze(cols, rows) {
  const maze = Array.from({ length: rows }, () => Array(cols).fill(1));

  function carve(x, y) {
    const dir = [
      [0, -2], [2, 0], [0, 2], [-2, 0]
    ].sort(() => Math.random() - 0.5);

    for (let [dx, dy] of dir) {
      const nx = x + dx, ny = y + dy;
      if (ny > 0 && ny < rows && nx > 0 && nx < cols && maze[ny][nx] === 1) {
        maze[ny][nx] = 0;
        maze[y + dy / 2][x + dx / 2] = 0;
        carve(nx, ny);
      }
    }
  }

  maze[1][1] = 0;
  carve(1, 1);

  // Garante passagem central
  const mid = Math.floor(rows / 2);
  for (let i = 1; i < cols - 1; i++) {
    maze[mid][i] = 0;
  }

  return maze;
}

maze = generateMaze(cols, rows);

// A* Pathfinding
function findPath(start, end) {
  const openSet = [start];
  const cameFrom = {};
  const gScore = {};
  const fScore = {};

  function key(pos) {
    return `${pos.x},${pos.y}`;
  }

  gScore[key(start)] = 0;
  fScore[key(start)] = heuristic(start, end);

  while (openSet.length > 0) {
    let current = openSet.reduce((a, b) =>
      fScore[key(a)] < fScore[key(b)] ? a : b
    );

    if (current.x === end.x && current.y === end.y) {
      let totalPath = [current];
      while (key(current) in cameFrom) {
        current = cameFrom[key(current)];
        totalPath.push(current);
      }
      return totalPath.reverse();
    }

    openSet.splice(openSet.indexOf(current), 1);
    for (let [dx, dy] of [
      [0, -1], [1, 0], [0, 1], [-1, 0]
    ]) {
      let neighbor = { x: current.x + dx, y: current.y + dy };
      if (
        neighbor.x < 0 || neighbor.x >= cols ||
        neighbor.y < 0 || neighbor.y >= rows ||
        maze[neighbor.y][neighbor.x] === 1
      ) continue;

      let tentative_gScore = gScore[key(current)] + 1;
      if (
        tentative_gScore < (gScore[key(neighbor)] ?? Infinity)
      ) {
        cameFrom[key(neighbor)] = current;
        gScore[key(neighbor)] = tentative_gScore;
        fScore[key(neighbor)] = tentative_gScore + heuristic(neighbor, end);
        if (!openSet.find(p => p.x === neighbor.x && p.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return [];
}

function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Partículas quadradas
const particles = Array.from({ length: 80 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 3 + 2,
  dx: (Math.random() - 0.5) * 0.5,
  dy: (Math.random() - 0.5) * 0.5,
}));

function drawParticles() {
  for (let p of particles) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(p.x, p.y, p.size, p.size);

    const dist = Math.hypot(p.x - mouseX, p.y - mouseY);
    if (dist < 100) {
      const angle = Math.atan2(p.y - mouseY, p.x - mouseX);
      p.x += Math.cos(angle);
      p.y += Math.sin(angle);
    }

    p.x += p.dx;
    p.y += p.dy;

    if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
  }
}

// Animação do labirinto
function drawMaze() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (maze[y][x] === 1) {
        if (hasEatenFruit) {
          const r = Math.floor(128 + 128 * Math.sin(frameCount / 20));
          const g = Math.floor(128 + 128 * Math.sin(frameCount / 30));
          const b = Math.floor(128 + 128 * Math.sin(frameCount / 40));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        } else {
          ctx.fillStyle = "#444";
        }
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
}

function drawPacman() {
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(
    pacman.x * tileSize + tileSize / 2,
    pacman.y * tileSize + tileSize / 2,
    tileSize / 2 - 2,
    0.2 * Math.PI,
    1.8 * Math.PI
  );
  ctx.lineTo(pacman.x * tileSize + tileSize / 2, pacman.y * tileSize + tileSize / 2);
  ctx.fill();
}

function drawFruit() {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(
    fruit.x * tileSize + tileSize / 2,
    fruit.y * tileSize + tileSize / 2,
    tileSize / 3,
    0,
    2 * Math.PI
  );
  ctx.fill();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawParticles();
  drawMaze();
  drawFruit();
  drawPacman();

  if (path.length > 0) {
    pacman = path.shift();
  }

  if (!hasEatenFruit && pacman.x === fruit.x && pacman.y === fruit.y) {
    hasEatenFruit = true;
  }

  frameCount++;
  requestAnimationFrame(gameLoop);
}

let mouseX = 0;
let mouseY = 0;
canvas.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  const tileX = Math.floor(mouseX / tileSize);
  const tileY = Math.floor(mouseY / tileSize);
  if (tileX !== mouseTile?.x || tileY !== mouseTile?.y) {
    mouseTile = { x: tileX, y: tileY };
    if (maze[tileY] && maze[tileY][tileX] === 0) {
      path = findPath(pacman, mouseTile);
    }
  }
});

// Responsividade
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

gameLoop();
</script>
