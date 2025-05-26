>
const canvas = document.getElementById('retro-bg');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

let tileSize = Math.floor(Math.max(20, Math.min(60, Math.min(width, height) / 20)));
let cols = Math.floor(width / tileSize);
let rows = Math.floor(height / tileSize);
let halfCols = Math.floor(cols / 2);

const mazeColors = [
  '#fb234e15', '#f8862215', '#f0ed2115',
  '#47ef2115', '#23d6e315', '#2326e015', '#a221dd15'
];

let maze = [];
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
    return (cols % 2 === 0) ? mirroredRow.concat(rightHalf) : mirroredRow.concat([0], rightHalf);
  });

  addExtraOpenings(0.08);

  // Caminho horizontal central
  const midY = Math.floor(rows / 2);
  for (let x = 0; x < cols; x++) {
    if (maze[midY][x] === 1 && x % 2 === 1) maze[midY][x] = 0;
  }

  // Entrada garantida
  maze[1][1] = 0;
  maze[2][1] = 0;
  maze[1][2] = 0;
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
  mouse.x = Math.floor(e.clientX / tileSize);
  mouse.y = Math.floor(e.clientY / tileSize);
});

document.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  mouse.x = Math.floor(touch.clientX / tileSize);
  mouse.y = Math.floor(touch.clientY / tileSize);
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

let particles = Array.from({ length: 100 }, () => new Particle());

const pacman = {
  x: 1, y: 1, px: 1, py: 1,
  angle: 0, direction: 'right',
  path: [], speed: 0.1,
  moving: false, target: null
};

function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function findPath(start, end) {
  const openSet = [start];
  const cameFrom = {};
  const gScore = { [`${start.x},${start.y}`]: 0 };
  const fScore = { [`${start.x},${start.y}`]: heuristic(start, end) };

  while (openSet.length > 0) {
    openSet.sort((a, b) => fScore[`${a.x},${a.y}`] - fScore[`${b.x},${b.y}`]);
    const current = openSet.shift();
    if (current.x === end.x && current.y === end.y) {
      const path = [];
      let temp = `${current.x},${current.y}`;
      while (cameFrom[temp]) {
        path.unshift(cameFrom[temp]);
        temp = `${cameFrom[temp].x},${cameFrom[temp].y}`;
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

      const key = `${neighbor.x},${neighbor.y}`;
      const tentativeG = gScore[`${current.x},${current.y}`] + 1;
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

function updatePacman() {
  if (!pacman.moving && (!pacman.target || (pacman.x === mouse.x && pacman.y === mouse.y))) {
    const path = findPath({ x: pacman.x, y: pacman.y }, { x: mouse.x, y: mouse.y });
    if (path.length > 0) {
      pacman.path = path;
      pacman.target = pacman.path.shift();
      pacman.moving = true;
    }
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
      pacman.target = pacman.path.shift();
      pacman.moving = !!pacman.target;
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
  if (pacman.target) {
    const dx = pacman.target.x - pacman.x;
    const dy = pacman.target.y - pacman.y;
    if (dx === 1) rotation = 0;
    else if (dx === -1) rotation = Math.PI;
    else if (dy === -1) rotation = -Math.PI / 2;
    else if (dy === 1) rotation = Math.PI / 2;
  }
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
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
}

function hslToHexWithAlpha(hsl, alphaHex) {
  const temp = document.createElement('div');
  temp.style.color = hsl;
  document.body.appendChild(temp);
  const rgb = window.getComputedStyle(temp).color;
  document.body.removeChild(temp);

  const [r, g, b] = rgb.match(/\d+/g).map(n => parseInt(n).toString(16).padStart(2, '0'));
  return `#${r}${g}${b}${alphaHex}`;
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawMaze();
  updatePacman();
  drawPacman();
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => location.reload());
