const canvas = document.getElementById('retro-bg');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

let baseTileSize = 40;
const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

let tileSize;

function calculateTileSize() {
  if (isMobile) {
    return baseTileSize * 0.85; // 15% menor em dispositivos móveis
  } else {
    if (width >= 1920) {
      return baseTileSize * 1.2; // 48
    } else if (width >= 1280 && width < 1920) {
      const ratio = (width - 1280) / (1920 - 1280);
      return baseTileSize + (baseTileSize * 0.2 * ratio);
    } else {
      return baseTileSize;
    }
  }
}

let cols, rows, halfCols;
let maze = [];

const mazeColors = [
  '#fb234e15', '#f8862215', '#f0ed2115',
  '#47ef2115', '#23d6e315', '#2326e015', '#a221dd15'
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
    const color = `hsla(${this.hue}, 100%, 60%, 0.5)`; // 50% opacidade
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
  rgbMode = true; // Ativa o modo RGB
  setTimeout(spawnFruit, 4000); // Apenas respawna a fruta, sem desativar o RGB
}
    } else {
      pacman.px += (dx / dist) * pacman.speed;
      pacman.py += (dy / dist) * pacman.speed;
    }
  }
}

function drawMaze() {
  ctx.fillStyle = mazeColor;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (maze[y][x] === 1) {
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
}

function drawParticles() {
  particles.forEach(p => {
    p.update();
    p.draw();
  });
}

function drawPacman() {
  const px = pacman.px * tileSize + tileSize / 2;
  const py = pacman.py * tileSize + tileSize / 2;

  ctx.save();
  ctx.translate(px, py);

  const angleMap = { right: 0, left: Math.PI, up: -Math.PI / 2, down: Math.PI / 2 };
  ctx.rotate(angleMap[pacman.direction] || 0);

  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  const mouthAngle = Math.sin(performance.now() / 150) * 0.3 + 0.3;
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, tileSize / 2.2, mouthAngle, 2 * Math.PI - mouthAngle);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawFruit() {
  if (!fruit) return;
  const fx = fruit.x * tileSize + tileSize / 2;
  const fy = fruit.y * tileSize + tileSize / 2;

  ctx.save();
  ctx.translate(fx, fy);

  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(0, 0, tileSize / 3, 0, 2 * Math.PI);
  ctx.fill();

  ctx.restore();
}

function updateColors() {
  if (rgbMode) {
    rgbHue = (rgbHue + 2) % 360;
    mazeColor = `hsla(${rgbHue}, 100%, 50%, 0.15)`;
  } else {
    mazeColor = baseMazeColor;
  }
}


function spawnFruit() {
  while (true) {
    const fx = Math.floor(Math.random() * cols);
    const fy = Math.floor(Math.random() * rows);
    if (maze[fy] && maze[fy][fx] === 0 && !(fx === pacman.x && fy === pacman.y)) {
      fruit = { x: fx, y: fy };
      break;
    }
  }
}

function resizeCanvasAndMaze() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;

  tileSize = calculateTileSize();

  cols = Math.floor(width / tileSize);
  rows = Math.floor(height / tileSize);
  halfCols = Math.floor(cols / 2);

  generateClassicMaze();

  particles = Array.from({ length: 80 }, () => new Particle());

  if (!fruit) spawnFruit();
}

function animate() {
  ctx.clearRect(0, 0, width, height);

  updateColors();

  drawParticles();
  drawMaze();
  drawFruit();
  updatePacman();
  drawPacman();

  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  resizeCanvasAndMaze();
});

resizeCanvasAndMaze();
animate();
