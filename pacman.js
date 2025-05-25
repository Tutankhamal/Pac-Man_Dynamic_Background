const canvas = document.getElementById('retro-bg');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const tileSize = 40;
const cols = Math.floor(width / tileSize);
const rows = Math.floor(height / tileSize);
const halfCols = Math.floor(cols / 2);

const mazeColors = [
  'rgba(251, 35, 78, 0.15)',  // #fb234e15
  'rgba(248, 134, 34, 0.15)', // #f8862215
  'rgba(240, 237, 33, 0.15)', // #f0ed2115
  'rgba(71, 239, 33, 0.15)',  // #47ef2115
  'rgba(35, 214, 227, 0.15)', // #23d6e315
  'rgba(35, 38, 224, 0.15)',  // #2326e015
  'rgba(162, 33, 221, 0.15)'  // #a221dd15
];

let baseMazeColor = mazeColors[Math.floor(Math.random() * mazeColors.length)];
let rgbMode = true;  // Ativando RGB para teste
let rgbHue = 0;

let maze = [];
let fruit = null;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateClassicMaze() {
  // Metade direita
  let rightMaze = Array.from({ length: rows }, () => Array(halfCols).fill(1));
  const visited = Array.from({ length: rows }, () => Array(halfCols).fill(false));

  function isValid(x, y) {
    return x > 0 && x < halfCols - 1 && y > 0 && y < rows - 1;
  }

  function carveMaze(x, y) {
    visited[y][x] = true;
    rightMaze[y][x] = 0;

    const directions = shuffle([
      [0, -2], [0, 2], [2, 0], [-2, 0]
    ]);

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (isValid(nx, ny) && !visited[ny][nx]) {
        rightMaze[y + dy / 2][x + dx / 2] = 0;
        carveMaze(nx, ny);
      }
    }
  }

  carveMaze(1, 1);

  maze = Array.from({ length: rows }, () => Array(cols).fill(1));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < halfCols; x++) {
      maze[y][halfCols + x] = rightMaze[y][x];
      maze[y][halfCols - 1 - x] = rightMaze[y][x];
    }
  }

  for (let x = 0; x < cols; x++) {
    maze[0][x] = 1;
    maze[rows - 1][x] = 1;
  }
  for (let y = 0; y < rows; y++) {
    maze[y][0] = 1;
    maze[y][cols - 1] = 1;
  }

  const middleCol = halfCols - 1;
  const corridorRows = [
    Math.floor(rows / 2) - 1,
    Math.floor(rows / 2),
    Math.floor(rows / 2) + 1
  ];

  for (const r of corridorRows) {
    maze[r][middleCol] = 0;
    maze[r][middleCol + 1] = 0;
    if (middleCol - 1 > 0) maze[r][middleCol - 1] = 0;
    if (middleCol + 2 < cols) maze[r][middleCol + 2] = 0;
  }

  addExtraOpenings(0.08);

  maze[1][cols - 2] = 0;
  maze[1][cols - 3] = 0;
  maze[2][cols - 2] = 0;
}

function addExtraOpenings(chance = 0.1) {
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (maze[y][x] === 1 && Math.random() < chance) {
        if ((x % 2 === 1) || (y % 2 === 1)) {
          maze[y][x] = 0;
        }
      }
    }
  }
}

generateClassicMaze();

const mouse = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
document.addEventListener('mousemove', e => {
  mouse.x = Math.min(cols - 1, Math.max(0, Math.floor(e.clientX / tileSize)));
  mouse.y = Math.min(rows - 1, Math.max(0, Math.floor(e.clientY / tileSize)));
});

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.random() * 2 + 1;
    this.baseX = this.x;
    this.baseY = this.y;
    const colors = ['#3d3558', '#2e2a49', '#4a4367'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 5;
    ctx.fill();
  }
  update() {
    const dx = this.x - mouse.x * tileSize;
    const dy = this.y - mouse.y * tileSize;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 120;
    const force = (maxDist - dist) / maxDist;
    if (dist < maxDist) {
      this.x += dx / dist * force * 1.2;
      this.y += dy / dist * force * 1.2;
    } else {
      this.x += (this.baseX - this.x) * 0.02;
      this.y += (this.baseY - this.y) * 0.02;
    }
  }
}

let particles = [];
for (let i = 0; i < 100; i++) particles.push(new Particle());

const pacman = {
  x: cols - 2,
  y: 1,
  px: cols - 2,
  py: 1,
  angle: 0,
  direction: 'right',
  path: [],
  speed: 0.1,
  moving: false,
  target: null,
  mouthOpen: 0,
  mouthOpening: true
};

function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function findPath(start, end) {
  const openSet = [start];
  const cameFrom = {};
  const gScore = {};
  const fScore = {};
  function nodeKey(n) { return `${n.x},${n.y}`; }
  gScore[nodeKey(start)] = 0;
  fScore[nodeKey(start)] = heuristic(start, end);

  while (openSet.length > 0) {
    openSet.sort((a, b) => fScore[nodeKey(a)] - fScore[nodeKey(b)]);
    const current = openSet.shift();
    if (current.x === end.x && current.y === end.y) {
      const path = [];
      let tempKey = nodeKey(current);
      while (tempKey in cameFrom) {
        path.unshift(cameFrom[tempKey]);
        tempKey = nodeKey(cameFrom[tempKey]);
      }
      return path;
    }

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ];

    for (const neighbor of neighbors) {
      if (
        neighbor.x < 0 || neighbor.x >= cols ||
        neighbor.y < 0 || neighbor.y >= rows ||
        maze[neighbor.y][neighbor.x] === 1
      ) continue;

      const tentativeG = gScore[nodeKey(current)] + 1;
      const key = nodeKey(neighbor);
      if (!(key in gScore) || tentativeG < gScore[key]) {
        cameFrom[key] = current;
        gScore[key] = tentativeG;
        fScore[key] = tentativeG + heuristic(neighbor, end);
        if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  return [];
}

function placeFruit() {
  while (true) {
    const fx = Math.floor(Math.random() * cols);
    const fy = Math.floor(Math.random() * rows);
    if (maze[fy][fx] === 0 && (fx !== pacman.x || fy !== pacman.y)) {
      fruit = { x: fx, y: fy };
      break;
    }
  }
}

function drawFruit() {
  if (!fruit) return;
  ctx.beginPath();
  ctx.arc(fruit.x * tileSize + tileSize / 2, fruit.y * tileSize + tileSize / 2, tileSize / 4, 0, Math.PI * 2);
  ctx.fillStyle = 'red';
  ctx.shadowColor = 'red';
  ctx.shadowBlur = 10;
  ctx.fill();
}

function updateMazeColor() {
  if (rgbMode) {
    rgbHue = (rgbHue + 1) % 360;
    return `hsla(${rgbHue}, 100%, 60%, 0.15)`;
  } else {
    return baseMazeColor;
  }
}

function drawMaze() {
  const color = updateMazeColor();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (maze[y][x] === 1) {
        ctx.fillStyle = color;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
}

function updatePacman() {
  // Atualiza animação da boca do Pacman
  if (pacman.mouthOpening) {
    pacman.mouthOpen += 0.06;
    if (pacman.mouthOpen >= 0.25) pacman.mouthOpening = false;
  } else {
    pacman.mouthOpen -= 0.06;
    if (pacman.mouthOpen <= 0) pacman.mouthOpening = true;
  }

  if (!pacman.moving) {
    const target = { x: mouse.x, y: mouse.y };
    if (pacman.path.length === 0 || Math.random() < 0.02) {
      pacman.path = findPath({ x: pacman.x, y: pacman.y }, target);
    }
    if (pacman.path.length > 0) {
      pacman.target = pacman.path.shift();
      pacman.moving = true;
    }
  }

  if (pacman.moving && pacman.target) {
    const dx = pacman.target.x - pacman.x;
    const dy = pacman.target.y - pacman.y;

    // Interpola suavemente
    pacman.px += dx * pacman.speed;
    pacman.py += dy * pacman.speed;

    // Se chegou perto o suficiente, fixa na célula
    if (Math.abs(pacman.px - pacman.target.x) < 0.05 && Math.abs(pacman.py - pacman.target.y) < 0.05) {
      pacman.x = pacman.target.x;
      pacman.y = pacman.target.y;
      pacman.px = pacman.x;
      pacman.py = pacman.y;
      pacman.moving = false;
    }

    if (dx > 0) pacman.angle = 0;
    else if (dx < 0) pacman.angle = Math.PI;
    else if (dy > 0) pacman.angle = Math.PI / 2;
    else if (dy < 0) pacman.angle = 3 * Math.PI / 2;
  }
}

function drawPacman() {
  const cx = pacman.px * tileSize + tileSize / 2;
  const cy = pacman.py * tileSize + tileSize / 2;
  const radius = tileSize / 2 - 4;
  const mouthAngle = pacman.mouthOpen * Math.PI;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(pacman.angle);

  ctx.fillStyle = 'yellow';
  ctx.shadowColor = 'yellow';
  ctx.shadowBlur = 15;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, mouthAngle, 2 * Math.PI - mouthAngle, false);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  drawMaze();
  drawFruit();
  updatePacman();
  drawPacman();

  requestAnimationFrame(animate);
}

placeFruit();
animate();

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});
