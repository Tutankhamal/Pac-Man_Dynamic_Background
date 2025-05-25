const canvas = document.getElementById('retro-bg');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const tileSize = 40;
const cols = Math.floor(width / tileSize);
const rows = Math.floor(height / tileSize);
const halfCols = Math.floor(cols / 2);

const mazeColors = [
  '#fb234e15', '#f8862215', '#f0ed2115',
  '#47ef2115', '#23d6e315', '#2326e015', '#a221dd15'
];

let maze = [];
let baseMazeColor = mazeColors[Math.floor(Math.random() * mazeColors.length)];
let mazeColor = baseMazeColor;
let rgbMode = false;
let rgbHue = 0;

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

    const directions = shuffle([
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ]);

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

  // Espelha e cria o labirinto completo
  maze = Array.from({ length: rows }, (_, y) => {
    const mirroredRow = [...leftMaze[y]];
    const middleCol = Math.floor(cols / 2);

    // Se cols é ímpar, adiciona coluna central
    let row = (cols % 2 === 0)
      ? mirroredRow.concat([...mirroredRow].reverse())
      : mirroredRow.concat([1], [...mirroredRow].reverse());

    // Abre caminho no túnel central em 3 linhas centrais,
    // abrindo 2 blocos para a esquerda e 2 para a direita do centro
    const tunnelRows = [Math.floor(rows / 2) - 1, Math.floor(rows / 2), Math.floor(rows / 2) + 1];
    if (tunnelRows.includes(y)) {
      for (let offset = -2; offset <= 2; offset++) {
        if (middleCol + offset >= 0 && middleCol + offset < cols) {
          row[middleCol + offset] = 0;
        }
      }
    }
    return row;
  });

  // Garante acessibilidade inicial
  maze[1][1] = 0;
  maze[1][2] = 0;
  maze[2][1] = 0;

  // Adiciona aberturas extras para melhorar caminhos
  addExtraOpenings(0.08);
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
  x: 1, y: 1, px: 1, py: 1,
  direction: 'right',
  path: [], speed: 0.07,
  moving: false, target: null
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
      let temp = nodeKey(current);
      while (temp in cameFrom) {
        path.unshift(cameFrom[temp]);
        temp = nodeKey(cameFrom[temp]);
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

let fruit = null;
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
    const opacityHex = baseMazeColor.slice(-2);
    const rgb = `hsl(${rgbHue}, 100%, 55%)`;
    mazeColor = hslToHexWithAlpha(rgb, opacityHex);
    rgbHue = (rgbHue + 1) % 360;
  } else {
    mazeColor = baseMazeColor;
  }
}

function drawMaze() {
  updateMazeColor();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (maze[y][x] === 1) {
        ctx.fillStyle = mazeColor;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        ctx.strokeStyle = mazeColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
}

function updatePacman() {
  if (!pacman.moving) {
    const target = { x: mouse.x, y: mouse.y };
    if (pacman.path.length === 0 || Math.random() < 0.02) {
      pacman.path = findPath({ x: Math.round(pacman.px), y: Math.round(pacman.py) }, target);
    }
    if (pacman.path.length > 0) {
      pacman.target = pacman.path.shift();
      pacman.moving = true;
      if (pacman.target.x > pacman.px) pacman.direction = 'right';
      else if (pacman.target.x < pacman.px) pacman.direction = 'left';
      else if (pacman.target.y > pacman.py) pacman.direction = 'down';
      else if (pacman.target.y < pacman.py) pacman.direction = 'up';
    }
  }

  if (pacman.moving && pacman.target) {
    const dx = pacman.target.x - pacman.px;
    const dy = pacman.target.y - pacman.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < pacman.speed) {
      pacman.px = pacman.target.x;
      pacman.py = pacman.target.y;
      pacman.moving = false;
      pacman.x = pacman.target.x;
      pacman.y = pacman.target.y;
      pacman.target = null;

      if (fruit && pacman.x === fruit.x && pacman.y === fruit.y) {
        fruit = null;
        rgbMode = true;
        setTimeout(() => { rgbMode = false; }, 7000);
        placeFruit();
      }
    } else {
      pacman.px += dx / dist * pacman.speed;
      pacman.py += dy / dist * pacman.speed;
    }
  }
}

function drawPacman() {
  const centerX = pacman.px * tileSize + tileSize / 2;
  const centerY = pacman.py * tileSize + tileSize / 2;
  const radius = tileSize / 2.5;

  ctx.fillStyle = '#FCE303';
  ctx.shadowColor = 'yellow';
  ctx.shadowBlur = 15;

  ctx.beginPath();
  let mouthAngle = Math.abs(Math.sin(Date.now() / 150)) * 0.3 + 0.1;

  // Define ângulo de boca dependendo da direção
  let startAngle, endAngle;
  switch (pacman.direction) {
    case 'right':
      startAngle = mouthAngle;
      endAngle = 2 * Math.PI - mouthAngle;
      break;
    case 'left':
      startAngle = Math.PI + mouthAngle;
      endAngle = Math.PI * 2 - mouthAngle;
      break;
    case 'up':
      startAngle = 1.5 * Math.PI + mouthAngle;
      endAngle = 0.5 * Math.PI - mouthAngle;
      break;
    case 'down':
      startAngle = 0.5 * Math.PI + mouthAngle;
      endAngle = 1.5 * Math.PI - mouthAngle;
      break;
    default:
      startAngle = mouthAngle;
      endAngle = 2 * Math.PI - mouthAngle;
  }

  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
  ctx.closePath();
  ctx.fill();

  // Olho
  ctx.beginPath();
  ctx.fillStyle = '#000';
  let eyeOffsetX = 0;
  let eyeOffsetY = -radius / 3;
  switch (pacman.direction) {
    case 'right': eyeOffsetX = radius / 3; break;
    case 'left': eyeOffsetX = -radius / 3; break;
    case 'up': eyeOffsetX = 0; eyeOffsetY = -radius / 2; break;
    case 'down': eyeOffsetX = 0; eyeOffsetY = 0; break;
  }
  ctx.arc(centerX + eyeOffsetX, centerY + eyeOffsetY, radius / 6, 0, 2 * Math.PI);
  ctx.fill();
}

function hslToHexWithAlpha(hsl, alphaHex) {
  const ctxTemp = document.createElement('canvas').getContext('2d');
  ctxTemp.fillStyle = hsl;
  const rgb = ctxTemp.fillStyle;
  const rgbValues = rgb.match(/\d+/g);
  const r = parseInt(rgbValues[0]).toString(16).padStart(2, '0');
  const g = parseInt(rgbValues[1]).toString(16).padStart(2, '0');
  const b = parseInt(rgbValues[2]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}${alphaHex}`;
}

function loop() {
  ctx.clearRect(0, 0, width, height);

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  drawMaze();
  drawFruit();
  updatePacman();
  drawPacman();

  requestAnimationFrame(loop);
}

placeFruit();
loop();

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});
