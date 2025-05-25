(() => {
  const canvas = document.getElementById('retro-bg');
  const ctx = canvas.getContext('2d');

  const tileSize = 20;
  const cols = 28;
  const rows = 31;

  canvas.width = cols * tileSize;
  canvas.height = rows * tileSize;

  // Labirinto clássico 28x31: 0 = caminho livre, 1 = parede
  const mazeClassic = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,1,0,1,0,1],
    [1,0,1,1,0,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1],
    [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
    [1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,1,0,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0],
    [1,1,1,1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  // Partículas simples de fundo
  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 1;
      this.color = `rgba(100,100,150,${Math.random() * 0.3 + 0.1})`;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 5;
      ctx.fill();
    }
  }

  const particles = [];
  for (let i = 0; i < 100; i++) particles.push(new Particle());

  // Pacman
  const pacman = {
    x: 13,
    y: 23,
    px: 13,
    py: 23,
    speed: 0.1,
    path: [],
    mouthAngle: 0,
    mouthOpening: 0.2,
    direction: 'left',
    moving: false,
  };

  // A* Pathfinding
  function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function findPath(start, end) {
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();

    const gScore = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(Infinity));
    const fScore = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(Infinity));

    gScore[start.y][start.x] = 0;
    fScore[start.y][start.x] = heuristic(start, end);

    openSet.push(start);

    function neighbors(n) {
      const ns = [];
      if (n.x > 0) ns.push({ x: n.x - 1, y: n.y });
      if (n.x < cols - 1) ns.push({ x: n.x + 1, y: n.y });
      if (n.y > 0) ns.push({ x: n.x, y: n.y - 1 });
      if (n.y < rows - 1) ns.push({ x: n.x, y: n.y + 1 });
      return ns;
    }

    function key(pos) {
      return pos.x + ',' + pos.y;
    }

    while (openSet.length > 0) {
      let currentIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        const c = openSet[i],
          best = openSet[currentIdx];
        if (fScore[c.y][c.x] < fScore[best.y][best.x]) currentIdx = i;
      }
      let current = openSet[currentIdx];

      if (current.x === end.x && current.y === end.y) {
        // Reconstroi caminho
        const path = [];
        let currKey = key(current);
        while (cameFrom.has(currKey)) {
          path.unshift(current);
          current = cameFrom.get(currKey);
          currKey = key(current);
        }
        return path;
      }

      openSet.splice(currentIdx, 1);
      closedSet.add(key(current));

      for (const neighbor of neighbors(current)) {
        if (mazeClassic[neighbor.y][neighbor.x] === 1) continue;
        if (closedSet.has(key(neighbor))) continue;

        const tentative_gScore = gScore[current.y][current.x] + 1;

        if (tentative_gScore < gScore[neighbor.y][neighbor.x]) {
          cameFrom.set(key(neighbor), current);
          gScore[neighbor.y][neighbor.x] = tentative_gScore;
          fScore[neighbor.y][neighbor.x] =
            tentative_gScore + heuristic(neighbor, end);

          if (!openSet.some((n) => n.x === neighbor.x && n.y === neighbor.y)) {
            openSet.push(neighbor);
          }
        }
      }
    }
    return [];
  }

  function drawMaze() {
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0011cc';
    ctx.shadowColor = '#0044ff';
    ctx.shadowBlur = 10;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (mazeClassic[y][x] === 1) {
          // Parede - bloco sólido arredondado estilo pacman
          const px = x * tileSize;
          const py = y * tileSize;
          ctx.beginPath();
          ctx.moveTo(px + 3, py);
          ctx.lineTo(px + tileSize - 3, py);
          ctx.quadraticCurveTo(px + tileSize, py, px + tileSize, py + 3);
          ctx.lineTo(px + tileSize, py + tileSize - 3);
          ctx.quadraticCurveTo(px + tileSize, py + tileSize, px + tileSize - 3, py + tileSize);
          ctx.lineTo(px + 3, py + tileSize);
          ctx.quadraticCurveTo(px, py + tileSize, px, py + tileSize - 3);
          ctx.lineTo(px, py + 3);
          ctx.quadraticCurveTo(px, py, px + 3, py);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    ctx.shadowBlur = 0;
  }

  function drawParticles() {
    for (const p of particles) {
      p.update();
      p.draw();
    }
  }

  function drawPacman() {
    const px = pacman.px * tileSize + tileSize / 2;
    const py = pacman.py * tileSize + tileSize / 2;

    // Animação boca
    pacman.mouthAngle += pacman.moving ? 0.15 : 0;
    const mouthOpen = Math.abs(Math.sin(pacman.mouthAngle)) * 0.5 + pacman.mouthOpening;

    // Direção do Pacman para a boca
    let angleStart = 0;
    let angleEnd = Math.PI * 2;

    switch (pacman.direction) {
      case 'right':
        angleStart = mouthOpen * Math.PI;
        angleEnd = (2 - mouthOpen) * Math.PI;
        break;
      case 'left':
        angleStart = Math.PI + mouthOpen * Math.PI;
        angleEnd = Math.PI * (3 - mouthOpen);
        break;
      case 'up':
        angleStart = 1.5 * Math.PI + mouthOpen * Math.PI;
        angleEnd = 1.5 * Math.PI + (2 - mouthOpen) * Math.PI;
        break;
      case 'down':
        angleStart = 0.5 * Math.PI + mouthOpen * Math.PI;
        angleEnd = 0.5 * Math.PI + (2 - mouthOpen) * Math.PI;
        break;
    }

    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff66';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, tileSize / 2 - 2, angleStart, angleEnd, false);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function updatePacman() {
    if (pacman.path.length > 0) {
      pacman.moving = true;
      const next = pacman.path[0];
      const dx = next.x - pacman.px;
      const dy = next.y - pacman.py;

      // Direção do Pacman
      if (dx > 0) pacman.direction = 'right';
      else if (dx < 0) pacman.direction = 'left';
      else if (dy > 0) pacman.direction = 'down';
      else if (dy < 0) pacman.direction = 'up';

      // Move pacman lentamente
      pacman.x += dx * pacman.speed;
      pacman.y += dy * pacman.speed;

      // Atualiza a célula atual quando próximo o suficiente
      if (Math.abs(pacman.x - next.x) < 0.1 && Math.abs(pacman.y - next.y) < 0.1) {
        pacman.px = next.x;
        pacman.py = next.y;
        pacman.x = pacman.px;
        pacman.y = pacman.py;
        pacman.path.shift();
      }
    } else {
      pacman.moving = false;
    }
  }

  let targetCell = { x: pacman.px, y: pacman.py };

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cellX = Math.floor(mouseX / tileSize);
    const cellY = Math.floor(mouseY / tileSize);

    // Só atualiza se for um caminho livre
    if (cellX >= 0 && cellX < cols && cellY >= 0 && cellY < rows) {
      if (mazeClassic[cellY][cellX] === 0) {
        targetCell = { x: cellX, y: cellY };
        pacman.path = findPath({ x: pacman.px, y: pacman.py }, targetCell);
      }
    }
  });

  function animate() {
    drawMaze();
    drawParticles();
    updatePacman();
    drawPacman();

    requestAnimationFrame(animate);
  }

  // Inicializa a posição física igual a célula inicial
  pacman.x = pacman.px;
  pacman.y = pacman.py;

  animate();
})();
