const canvas = document.getElementById('retro-bg');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

let baseTileSize = 40;
const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

let tileSize;

function calculateTileSize() {
  if (isMobile) {
    return baseTileSize;
  } else {
    // Desktop
    if (width >= 1920) {
      return baseTileSize * 1.2; // 48 (20% maior)
    } else if (width >= 1280 && width < 1920) {
      // proporcional entre 40 e 48
      const ratio = (width - 1280) / (1920 - 1280);
      return baseTileSize + (baseTileSize * 0.2 * ratio);
    } else {
      // largura menor que 1280px, usa tamanho base (40)
      return baseTileSize;
    }
  }
}

let cols, rows, halfCols;
let maze = [];

const mazeColors = [
  'hsla(348, 97%, 56%, 0.15)',  // vermelho
  'hsla(282, 60%, 55%, 0.15)'   // roxo
];
let baseMazeColor = mazeColors[Math.floor(Math.random() * mazeColors.length)];
let mazeColor = baseMazeColor;
let rgbMode = false;
let rgbHue = 0;
let fruit = null;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateClassicMaze() {
  let leftMaze = Array.from({ length: rows }, () => Array(halfCols).fill(1));
  const visited = Array.from({ length: rows }, () => Array(halfCols).fill(false));

  function isValid(x, y) {
    return x > 0 && x < halfCols - 1 && y > 0 && y < rows - 1;
  }

  function carveMaze(x, y) {
    visited[y][x] = true;
    leftMaze[y][x] = 0;
    const directions = shuffle([[0, -2], [0, 2], [-2, 0], [2, 0]]);
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (isValid(nx, ny) && !visited[ny][nx]) {
        leftMaze[y + dy / 2][x + dx / 2] = 0;
        carveMaze(nx, ny);
      }
    }
  }

  carveMaze(1, 1);

  maze = Array.from({ length: rows }, (_, y) => {
    const mirroredRow = [...leftMaze[y]];
    const rightHalf = [...mirroredRow].reverse();
    const row = (cols % 2 === 0)
      ? mirroredRow.concat(rightHalf)
      : mirroredRow.concat([0], rightHalf);
    const middleCol = Math.floor(cols / 2);
    const middleRow = Math.floor(rows / 2);
    const corridorSize = 4;

    for (let yy = middleRow - Math.floor(corridorSize / 2); yy < middleRow + Math.ceil(corridorSize / 2); yy++) {
      if (yy === y) {
        for (let xx = middleCol - Math.floor(corridorSize / 2); xx < middleCol + Math.ceil(corridorSize / 2); xx++) {
          if (row[xx] !== undefined) row[xx] = 0;
        }
      }
    }

    return row;
  });

  addExtraOpenings(0.08);
  maze[1][1] = maze[1][2] = maze[2][1] = 0;
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

const mouse = { x: 0, y: 0 };

document.addEventListener('mousemove', e => {
  mouse.x = Math.min(cols - 1, Math.max(0, Math.floor(e.clientX / tileSize)));
  mouse.y = Math.min(rows - 1, Math.max(0, Math.floor(e.clientY / tileSize)));
});

document.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  mouse.x = Math.floor(touch.clientX / tileSize);
  mouse.y = Math.floor(touch.clientY / tileSize);
});

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.size = Math.floor(Math.random() * 3 + 2);
    this.baseX = this.x;
    this.baseY = this.y;
    this.hue = Math.floor(Math.random() * 360);
    this.hueSpeed = Math.random() * 0.5 + 0.1;
  }
  draw() {
    // Opacidade reduzida para 0.25 (50% do original 0.5)
    const color = `hsla(${this.hue}, 100%, 60%, 0.25)`; 
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
  update() {
    this.hue = (this.hue + this.hueSpeed) % 360;
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

const pacman = {
  x: 1, y: 1, px: 1, py: 1,
  angle: 0, direction: 'right',
  path: [], speed: 0.07,
  moving: false, target: null,
  lastGoal: { x: 1, y: 1 }
};

let lastPathCheck = 0;
function findPath(start, end) {
  const openSet = [start];
  const cameFrom = {};
  const gScore = {};
  const fScore = {};
  const nodeKey = n => `${n.x},${n.y}`;
  gScore[nodeKey(start)] = 0;
  fScore[nodeKey(start)] = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);

  while (openSet.length > 0) {
    openSet.sort((a, b) => fScore[nodeKey(a)] - fScore[nodeKey(b)]);
    const current = openSet.shift();
    if (current.x === end.x && current.y === end.y) {
      const path = [];
      let temp = current;
      while (temp && nodeKey(temp) !== nodeKey(start)) {
        path.unshift(temp);
        temp = cameFrom[nodeKey(temp)];
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
        fScore[key] = tentativeG + Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y);
        if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  return [];
}

function updatePacman() {
  const now = performance.now();
  const target = { x: mouse.x, y: mouse.y };

  if (!pacman.moving && (target.x !== pacman.lastGoal.x || target.y !== pacman.lastGoal.y)) {
    if (now - lastPathCheck > 100) {
      pacman.path = findPath({ x: Math.round(pacman.px), y: Math.round(pacman.py) }, target);
      pacman.lastGoal = { ...target };
      lastPathCheck = now;
    }
  }

  if (!pacman.moving && pacman.path.length > 0) {
    pacman.target = pacman.path.shift();
    pacman.moving = true;
    const dx = pacman.target.x - pacman.px;
    const dy = pacman.target.y - pacman.py;
    if (dx > 0) pacman.direction = 'right';
    else if (dx < 0) pacman.direction = 'left';
    else if (dy > 0) pacman.direction = 'down';
    else if (dy < 0) pacman.direction = 'up';
  }

  if (pacman.moving && pacman.target) {
    const dx = pacman.target.x - pacman.px;
    const dy = pacman.target.y - pacman.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < pacman.speed) {
      pacman.px = pacman.target.x;
      pacman.py = pacman.target.y;
      pacman.x = pacman.target.x;
      pacman.y = pacman.target.y;
      pacman.moving = false;
      pacman.target = null;
if (fruit && pacman.x === fruit.x && pacman.y === fruit.y) {
  fruit = null;
  rgbMode = true;
  setTimeout(placeFruit, 3000); // reaparece após 3 segundos
}
    } else {
      pacman.px += (dx / dist) * pacman.speed;
      pacman.py += (dy / dist) * pacman.speed;
    }
  }

  pacman.angle += 0.2;
}

function drawPacman() {
  const cx = pacman.px * tileSize + tileSize / 2;
  const cy = pacman.py * tileSize + tileSize / 2;
  const r = tileSize / 2 - 4;
  const mouth = Math.abs(Math.sin(pacman.angle)) * Math.PI / 5;
  let rotation = 0;
  if (pacman.direction === 'right') rotation = 0;
  else if (pacman.direction === 'left') rotation = Math.PI;
  else if (pacman.direction === 'up') rotation = -Math.PI / 2;
  else if (pacman.direction === 'down') rotation = Math.PI / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, mouth, 2 * Math.PI - mouth);
  ctx.lineTo(0, 0);
  ctx.fillStyle = '#d4c05a';
  ctx.shadowColor = '#d4c05a';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.restore();
}

function placeFruit() {
  let fx, fy;
  do {
    fx = Math.floor(Math.random() * cols);
    fy = Math.floor(Math.random() * rows);
  } while (maze[fy][fx] === 1 || (fx === pacman.x && fy === pacman.y));
  fruit = { x: fx, y: fy };
}

function drawFruit() {
  if (!fruit) return;
  const fx = fruit.x * tileSize + tileSize / 2;
  const fy = fruit.y * tileSize + tileSize / 2;
  const radius = tileSize / 7; // 50% menor

  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.arc(fx, fy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawMaze() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (maze[y][x] === 1) {
        if (rgbMode) {
          mazeColor = `hsla(${(rgbHue + (x + y) * 10) % 360}, 90%, 55%, 0.15)`;
        } else {
          mazeColor = baseMazeColor;
        }
        ctx.fillStyle = mazeColor;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
}

function updateRgbHue() {
  if (rgbMode) {
    rgbHue = (rgbHue + 2) % 360;
  }
}

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  tileSize = calculateTileSize();

  cols = Math.floor(width / tileSize);
  rows = Math.floor(height / tileSize);
  halfCols = Math.floor(cols / 2);

  generateClassicMaze();

  particles = [];
  const particleCount = Math.floor((width * height) / 12000);
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  drawMaze();

  for (const p of particles) {
    p.update();
    p.draw();
  }

  updatePacman();
  drawPacman();
  drawFruit();
  updateRgbHue();

  requestAnimationFrame(draw);
}

resize();
placeFruit();
draw();

window.addEventListener('resize', () => {
  resize();
  placeFruit();
});
