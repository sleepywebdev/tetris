const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 18;
const SIZE = 30;

let muted = false;

// 🎵 Sounds
const sounds = {
  drop: new Audio("sounds/drop.wav"),
  clear: new Audio("sounds/clear.wav"),
  gameover: new Audio("sounds/gameover.wav")
};

// 🧱 Arena
const arena = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const COLORS = [
  null,
  "#FF0D72","#0DC2FF","#0DFF72",
  "#F538FF","#FF8E0D","#FFE138","#3877FF"
];

const SHAPES = [
  [],
  [[1,1,1],[0,1,0]],
  [[2,2],[2,2]],
  [[0,0,3,0],[0,0,3,0],[0,0,3,0],[0,0,3,0]],
];

let player = createPlayer();

// 👤 Player
function createPlayer() {
  return {
    x: 3,
    y: 0,
    shape: SHAPES[Math.floor(Math.random()*SHAPES.length)]
  };
}

// 🧩 Draw matrix
function drawMatrix(matrix, offset, alpha=1) {
  ctx.globalAlpha = alpha;
  matrix.forEach((row,y)=>{
    row.forEach((val,x)=>{
      if(val){
        ctx.fillStyle = COLORS[val];
        ctx.fillRect((x+offset.x)*SIZE,(y+offset.y)*SIZE,SIZE,SIZE);
      }
    });
  });
  ctx.globalAlpha = 1;
}

// 👻 Ghost
function drawGhost() {
  const ghost = JSON.parse(JSON.stringify(player));
  while (!collide(arena, ghost)) ghost.y++;
  ghost.y--;
  drawMatrix(ghost.shape, ghost, 0.3);
}

// ⚠️ Collision
function collide(arena, player) {
  return player.shape.some((row,y)=>
    row.some((val,x)=>{
      return val &&
        (arena[y+player.y]?.[x+player.x] !== 0);
    })
  );
}

// 🧱 Merge
function merge() {
  player.shape.forEach((row,y)=>{
    row.forEach((val,x)=>{
      if(val){
        arena[y+player.y][x+player.x] = val;
      }
    });
  });
}

// 🧹 Clear lines
function clearLines() {
  let cleared = 0;

  outer: for(let y=arena.length-1;y>=0;y--){
    for(let x=0;x<COLS;x++){
      if(arena[y][x]===0) continue outer;
    }

    arena.splice(y,1);
    arena.unshift(Array(COLS).fill(0));
    cleared++;
    y++;
  }

  if(cleared && !muted) sounds.clear.play();
}

// 📐 Grid
function drawGrid() {
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  for(let x=0;x<=COLS;x++){
    ctx.beginPath();
    ctx.moveTo(x*SIZE,0);
    ctx.lineTo(x*SIZE,ROWS*SIZE);
    ctx.stroke();
  }
  for(let y=0;y<=ROWS;y++){
    ctx.beginPath();
    ctx.moveTo(0,y*SIZE);
    ctx.lineTo(COLS*SIZE,y*SIZE);
    ctx.stroke();
  }
}

// 🎮 Update loop
function update() {
  player.y++;
  if(collide(arena, player)){
    player.y--;
    merge();
    clearLines();

    if(!muted) sounds.drop.play();

    player = createPlayer();

    if(collide(arena, player)){
      if(!muted) sounds.gameover.play();
      localStorage.removeItem("tetris-save");
      arena.forEach(row=>row.fill(0));
    }
  }

  saveGame();
  draw();
}

setInterval(update, 500);

// 🎨 Draw
function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  drawGrid();
  drawMatrix(arena,{x:0,y:0});
  drawGhost();
  drawMatrix(player.shape, player);
}

// 💾 Save
function saveGame() {
  localStorage.setItem("tetris-save", JSON.stringify({arena, player}));
}

// 📥 Load
function loadGame() {
  const saved = localStorage.getItem("tetris-save");
  if(saved){
    const data = JSON.parse(saved);
    data.arena.forEach((row,y)=>arena[y]=row);
    player = data.player;
  }
}
loadGame();

// 🎹 Controls
document.addEventListener("keydown", e=>{
  if(e.key==="ArrowLeft") player.x--;
  if(e.key==="ArrowRight") player.x++;
  if(e.key==="ArrowDown") player.y++;
});

// 🔁 Restart
document.getElementById("restart").onclick = ()=>{
  arena.forEach(row=>row.fill(0));
};

// 🔇 Mute
document.getElementById("mute").onclick = (e)=>{
  muted = !muted;
  e.target.textContent = muted ? "🔇" : "🔊";
};
