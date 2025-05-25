const canvas = document.getElementById('retro-bg');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const tileSize = 40;
const cols = Math.floor(width / tileSize);
const rows = Math.floor(height / tileSize);

// Cores do labirinto
const mazeColors = [
  '#fb234e15', '#f8862215', '#f0ed2115', '#47ef2115', '#23d6e315', '#2326e015', '#a221dd15'
];

let maze = [];
let baseMazeColor = mazeColors[Math.floor(Math.random() * mazeColors.length)];
let mazeColor = baseMazeColor;
let rgbMode = false;
let rgbHue = 0;
let fruit = null;

function generateMaze() {
  maze = Array.from({ length: rows }, () => Array(cols).fill(1));

  function carvePath(x, y) {
    maze[y][x] = 0;
    
    const directions = [
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
      const nx = x + dx, ny = y + dy;
      
      if (nx > 0 && ny > 0 && nx < cols - 1 && ny < rows - 1 && maze[ny][nx] === 1) {
        maze[ny][nx] = 0;
        maze[y + dy / 2][x + dx / 2] = 0;
        carvePath(nx, ny);
      }
    }
  }

  carvePath(1, 1);
  maze[1][1] = 0;
}

generateMaze();

function placeFruit() {
  while (true) {
    const fx = Math.floor(Math.random() * cols);
    const fy = Math.floor(Math.random() * rows);
    if (maze[fy][fx] === 0) {
      fruit = { x: fx, y: fy };
      break;
    }
  }
}

const mouse = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };

document.addEventListener('mousemove', e => {
  mouse.x = Math.min(cols - 1, Math.max(0, Math.floor(e.clientX / tileSize)));
  mouse.y = Math.min(rows - 1, Math.max(0, Math.floor(e.clientY / tileSize)));
});

const pacman = {
  x: 1, y: 1, px: 1, py: 1,
  angle: 0, direction: 'right',
  path: [], speed: 0.07,
  moving: false, target: null
};

function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function findPath(start, end) {
  const openSet = [start];
  const cameFrom = {};
  const gScore = {}, fScore = {};

  function nodeKey(n) {
    return `${n.x},${n.y}`;
  }

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
      if (neighbor.x < 0 || neighbor.x >= cols ||
          neighbor.y < 0 || neighbor.y >= rows ||
          maze[neighbor.y][neighbor.x] === 1) continue;

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

function updatePacman() {
  if (!pacman.moving) {
    if (!fruit) placeFruit();
    const target = { x: fruit.x, y: fruit.y };
    pacman.path = findPath({ x: Math.round(pacman.px), y: Math.round(pacman.py) }, target);
    
    if (pacman.path.length > 0) {
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
      pacman.moving = false;
      pacman.x = pacman.target.x;
      pacman.y = pacman.target.y;
      pacman.target = null;
    } else {
      pacman.px += (dx / dist) * pacman.speed;
      pacman.py += (dy / dist) * pacman.speed;
    }
  }

  pacman.angle += 0.2;
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

function drawPacman() {
  const cx = pacman.px * tileSize + tileSize / 2;
  const cy = pacman.py * tileSize + tileSize / 2;
  const r = tileSize / 2 - 4;
  const mouth = Math.abs(Math.sin(pacman.angle)) * Math.PI / 5;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.arc(0, 0, r, mouth, 2 * Math.PI - mouth);
  ctx.fillStyle = 'yellow';
  ctx.fill();
  ctx.restore();
}

function animate() {
  ctx.clearRect(0, 0, width, height);
  drawMaze();
  updatePacman();
  drawPacman();
  drawFruit();
  requestAnimationFrame(animate);
}

animate();
