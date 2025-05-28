const canvas = document.getElementById("pacman-background");
const ctx = canvas.getContext("2d");

let tileSize;
let rows;
let cols;
let maze = [];
let particles = [];

let pacman = {
    x: 0,
    y: 0,
    size: 0,
    path: [],
    speed: 2,
};

let mousePos = { x: 0, y: 0 };
let lastMoveTime = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Aumentar tileSize em 25% apenas em dispositivos não móveis
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    tileSize = Math.floor(isMobile ? window.innerWidth / 30 : window.innerWidth / 37.5);
    rows = Math.floor(canvas.height / tileSize);
    cols = Math.floor(canvas.width / tileSize);

    pacman.size = tileSize * 0.6;

    generateMaze();
    placePacman();
    generateParticles(); // regenerar partículas ao redimensionar
}
window.addEventListener("resize", resizeCanvas);

function generateMaze() {
    maze = [];
    for (let y = 0; y < rows; y++) {
        maze[y] = [];
        for (let x = 0; x < cols; x++) {
            // Gerar paredes nas bordas e aleatoriamente dentro
            if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) {
                maze[y][x] = 1;
            } else {
                let isWall = Math.random() < 0.22 ? 1 : 0;

                // Evitar paredes centrais para travessia lateral
                const centralCol = Math.floor(cols / 2);
                const middleRows = [Math.floor(rows / 2) - 1, Math.floor(rows / 2), Math.floor(rows / 2) + 1];
                if (
                    (x === centralCol || x === centralCol - 1 || x === centralCol + 1) &&
                    middleRows.includes(y)
                ) {
                    isWall = 0;
                }

                maze[y][x] = isWall;
            }
        }
    }
}

function placePacman() {
    // Encontrar uma posição livre no topo
    for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
            if (maze[y][x] === 0) {
                pacman.x = x;
                pacman.y = y;
                return;
            }
        }
    }
}

function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#003";

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (maze[y][x] === 1) {
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    }
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function findPath(start, end) {
    let openSet = [start];
    let cameFrom = {};
    let gScore = {};
    let fScore = {};

    const key = (p) => `${p.x},${p.y}`;

    gScore[key(start)] = 0;
    fScore[key(start)] = heuristic(start, end);

    while (openSet.length > 0) {
        openSet.sort((a, b) => fScore[key(a)] - fScore[key(b)]);
        let current = openSet.shift();
        if (current.x === end.x && current.y === end.y) {
            let path = [];
            let k = key(current);
            while (cameFrom[k]) {
                path.unshift(current);
                current = cameFrom[k];
                k = key(current);
            }
            return path;
        }

        for (let dir of [
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
        ]) {
            let neighbor = { x: current.x + dir.x, y: current.y + dir.y };
            if (
                neighbor.x >= 0 &&
                neighbor.x < cols &&
                neighbor.y >= 0 &&
                neighbor.y < rows &&
                maze[neighbor.y][neighbor.x] === 0
            ) {
                let tentativeG = gScore[key(current)] + 1;
                let nKey = key(neighbor);
                if (tentativeG < (gScore[nKey] || Infinity)) {
                    cameFrom[nKey] = current;
                    gScore[nKey] = tentativeG;
                    fScore[nKey] = tentativeG + heuristic(neighbor, end);
                    if (!openSet.some((p) => p.x === neighbor.x && p.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
    }
    return [];
}

function movePacman() {
    if (pacman.path.length > 0) {
        let next = pacman.path[0];
        let dx = next.x - pacman.x;
        let dy = next.y - pacman.y;

        if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
            pacman.x = next.x;
            pacman.y = next.y;
            pacman.path.shift();
        } else {
            pacman.x += dx * 0.2;
            pacman.y += dy * 0.2;
        }
    }
}

function drawPacman() {
    ctx.beginPath();
    let centerX = pacman.x * tileSize + tileSize / 2;
    let centerY = pacman.y * tileSize + tileSize / 2;
    ctx.arc(centerX, centerY, pacman.size / 2, 0.25 * Math.PI, 1.75 * Math.PI);
    ctx.lineTo(centerX, centerY);
    ctx.fillStyle = "yellow";
    ctx.fill();
}

function generateParticles() {
    const baseCount = Math.floor((canvas.width * canvas.height) / 12000); // mais partículas
    particles = [];

    for (let i = 0; i < baseCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 0.5,
            dx: Math.random() * 0.3 - 0.15,
            dy: Math.random() * 0.3 - 0.15,
        });
    }
}

function drawParticles() {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Atração sutil ao mouse
        let dx = mousePos.x - p.x;
        let dy = mousePos.y - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
            p.x += dx * 0.01;
            p.y += dy * 0.01;
        }

        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    }
}

canvas.addEventListener("mousemove", (e) => {
    mousePos = { x: e.clientX, y: e.clientY };
    const tileX = Math.floor(e.clientX / tileSize);
    const tileY = Math.floor(e.clientY / tileSize);
    const now = Date.now();
    if (now - lastMoveTime > 200) {
        pacman.path = findPath(
            { x: Math.floor(pacman.x), y: Math.floor(pacman.y) },
            { x: tileX, y: tileY }
        );
        lastMoveTime = now;
    }
});

function animate() {
    drawMaze();
    drawParticles();
    movePacman();
    drawPacman();
    requestAnimationFrame(animate);
}

resizeCanvas();
animate();
