const canvas = document.getElementById('retro-bg');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const tileSize = 40;
const cols = Math.floor(width / tileSize);
const rows = Math.floor(height / tileSize);

// Labirinto fixo clássico estilo Pac-Man (15x15, pode ser ajustado)
// 1 = parede, 0 = caminho
// Lembre de ajustar se o canvas for muito maior (será centralizado)
const fixedMaze = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
  [1,0,1,0,0,0,0,1,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
  [1,0,0,1,0,0,0,2,0,0,0,1,0,0,1], // 2 = posição inicial do Pac-Man
  [1,1,0,1,0,1,1,1,1,1,0,1,0,1,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,1,0,0,0,0,1,0,1],
  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Ajusta posição inicial do Pac-Man:
let pacman = {
  x: 7,
  y: 7,
  px: 7,
  py: 7,
  angle: 0,
  direction: 'right',
  path: [],
  speed: 0.07,
  moving: false,
  target: null
};

// Mouse (posição alvo):
const mouse = { x: pacman.x, y: pacman.y };
document.addEventListener('mousemove', e => {
  mouse.x = Math.min(cols - 1, Math.max(0, Math.floor(e.clientX / tileSize)));
  mouse.y = Math.min(rows - 1, Math.max(0, Math.floor(e.clientY / tileSize)));
});

// Partículas de fundo:
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

// Função para desenhar o labirinto:
function drawMaze() {
  ctx.fillStyle = '#001830'; // Fundo escuro
  ctx.fillRect(0, 0, width, height);
  for (let y = 0; y < fixedMaze.length; y++) {
    for (let x = 0; x < fixedMaze[y].length; x++) {
      if (fixedMaze[y][x] === 1) {
        ctx.fillStyle = '#173a7f'; // Cor da parede azul clássico
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        // Borda das paredes para efeito clássico
        ctx.strokeStyle = '#95a1d3';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }
}

// Função para encontrar caminho com A* (mesmo do código anterior)
function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function findPath(start, end) {
  const openSet = [start], cameFrom = {}, gScore = {}, fScore = {};
  const nodeKey = n => `${n.x},${n.y}`;
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
    [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ].forEach(neighbor => {
      if (neighbor.x < 0 || neighbor.x >= fixedMaze[0].length || neighbor.y < 0 || neighbor.y >= fixedMaze.length || fixedMaze[neighbor.y][neighbor.x] === 1) return;
      const tentativeG = gScore[nodeKey(current)] + 1;
      const key = nodeKey(neighbor);
      if (!(key in gScore) || tentativeG < gScore[key]) {
        cameFrom[key] = current;
        gScore[key] = tentativeG;
        fScore[key] = tentativeG + heuristic(neighbor, end);
        if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) openSet.push(neighbor);
      }
    });
  }
  return [];
}

// Atualiza Pac-Man
function updatePacman() {
  if (!pacman.moving) {
    const target = { x: mouse.x, y: mouse.y };
    // Só move se o destino for caminho e diferente do atual
    if (fixedMaze[target.y] && fixedMaze[target.y][target.x] === 0 && (target.x !== Math.round(pacman.px) || target.y !== Math.round(pacman.py))) {
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
    } else {
      pacman.px += (dx / dist) * pacman.speed;
      pacman.py += (dy / dist) * pacman.speed;
    }
  }
  pacman.angle += 0.2;
}

// Desenha Pac-Man
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

// Loop de animação:
function animate() {
  ctx.clearRect(0, 0, width, height);
  drawMaze();
  particles.forEach(p => { p.update(); p.draw(); });
  updatePacman();
  drawPacman();
  requestAnimationFrame(animate);
}

// Inicia
animate();

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});
