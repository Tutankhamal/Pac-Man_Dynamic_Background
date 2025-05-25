// Pac-Man Background com labirinto em estilo clássico aprimorado
const canvas = document.getElementById('retro-bg');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const tileSize = 20; // Diminui o tamanho dos blocos pela metade
const cols = Math.floor(width / tileSize);
const rows = Math.floor(height / tileSize);

const mazeColors = [
  '#fb234e15', '#f8862215', '#f0ed2115', '#47ef2115', '#23d6e315', '#2326e015', '#a221dd15'
];

let maze = [];
let baseMazeColor = mazeColors[Math.floor(Math.random() * mazeColors.length)];
let mazeColor = baseMazeColor;
let rgbMode = false;
let rgbHue = 0;
let fruit = null;

function generateClassicMaze() {
  maze = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => (x === 0 || y === 0 || x === cols - 1 || y === rows - 1 ? 1 : 1)));
  const stack = [{ x: 1, y: 1 }];
  maze[1][1] = 0;
  const directions = [
    { dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 }
  ];

  while (stack.length > 0) {
    const current = stack.pop();
    const { x, y } = current;
    const shuffled = directions.sort(() => Math.random() - 0.5);

    for (const { dx, dy } of shuffled) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && maze[ny][nx] === 1) {
        maze[ny][nx] = 0;
        maze[y + dy / 2][x + dx / 2] = 0;
        stack.push({ x: nx, y: ny });
      }
    }
  }

  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (maze[y][x] === 0 && Math.random() < 0.25) {
        [[1,0], [-1,0], [0,1], [0,-1]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          if (maze[ny] && maze[ny][nx] === 1) maze[ny][nx] = 0;
        });
      }
    }
  }

  maze[1][1] = maze[1][2] = maze[2][1] = 0;
}

// ... restante do código permanece inalterado até o final

// Atualiza e redimensiona o canvas
window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});
