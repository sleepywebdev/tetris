const menu = document.getElementById("menu");
const gameContainer = document.getElementById("gameContainer");
const startBtn = document.getElementById("startBtn");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const COLS = 10;
const ROWS = 18;
const SIZE = 30;

let gameRunning = false;
let interval;

let muted = false;

// 🎵 Sounds
const sounds = {
  drop: new Audio("sounds/drop.wav"),
  clear: new Audio("sounds/clear.wav"),
  gameover: new Audio("sounds/gameover.wav")
};

// Unlock audio on first click
document.addEventListener("click", () => {
  Object.values(sounds).forEach(s => {
    s.play().then(()=>s.pause()).catch(()=>{});
  });
}, { once: true });

// 🎨 Colors
const COLORS = [
  null,
  "#FF0D72","#0DC2FF","#0DFF72",
  "#F538FF","#FF8E0D","#FFE138","#3877FF"
];

// 🧩 Shapes
const SHAPES = [
  [[1,1,1],[0,1,0]],
  [[2,2],[2,2]],
  [[0,0,3,0],[0,0,3,0],[0,0,3,0],[0,0,3,0]],
  [[0,4,0],[0,4,0],[0,4,4]],
  [[0,5,0],[0,5,0],[5,5,0]],
  [[0,6,6],[6,6,0],[0,0,0]],
  [[7,7,0],[0,7,7],[0,0,0]]
];

function createMatrix(w,h){
  return Array.from({length:h},()=>Array(w).fill(0));
}

let arena, player, nextPiece, holdPiece, canHold, particles;

// 🎮 START GAME
startBtn.onclick = () => {
  menu.classList.add("hidden");
  gameContainer.classList.remove("hidden");

  initGame();
  gameRunning = true;

  interval = setInterval(update, 500);
};

// 🔁 INIT
function initGame(){
  arena = createMatrix(COLS,ROWS);
  player = { x:3, y:0, shape: randomPiece() };
  nextPiece = randomPiece();
  holdPiece = null;
  canHold = true;
  particles = [];
}

// 🎲 Random
function randomPiece(){
  return JSON.parse(JSON.stringify(
    SHAPES[Math.floor(Math.random()*SHAPES.length)]
  ));
}

// ⚠️ Collision
function collide(arena, player){
  return player.shape.some((row,y)=>
    row.some((val,x)=>{
      return val &&
        (arena[y+player.y]?.[x+player.x] !== 0);
    })
  );
}

// 🧱 Merge
function merge(){
  player.shape.forEach((row,y)=>{
    row.forEach((val,x)=>{
      if(val){
        arena[y+player.y][x+player.x] = val;
      }
    });
  });
}

// ✨ Particles
function spawnParticles(y){
  for(let i=0;i<20;i++){
    particles.push({
      x: Math.random()*COLS*SIZE,
      y: y*SIZE,
      vx:(Math.random()-0.5)*4,
      vy:Math.random()*-4,
      life:30
    });
  }
}

// 🧹 Clear
function clearLines(){
  outer: for(let y=ROWS-1;y>=0;y--){
    for(let x=0;x<COLS;x++){
      if(arena[y][x]===0) continue outer;

      spawnParticles(y);
      arena.splice(y,1);
      arena.unshift(Array(COLS).fill(0));
      y--;

      if(!muted) sounds.clear.play();
    }
  }
}

// 👻 Ghost
function drawGhost(){
  const ghost = JSON.parse(JSON.stringify(player));
  while(!collide(arena,ghost)) ghost.y++;
  ghost.y--;
  drawMatrix(ghost.shape, ghost, 0.3);
}

// 🎨 Draw matrix
function drawMatrix(matrix, offset, alpha=1){
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

// 📐 Grid
function drawGrid(){
  ctx.strokeStyle="rgba(255,255,255,0.05)";
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

// ✨ Draw particles
function drawParticles(){
  particles.forEach(p=>{
    ctx.fillRect(p.x,p.y,3,3);
    p.x+=p.vx;
    p.y+=p.vy;
    p.life--;
  });
  particles = particles.filter(p=>p.life>0);
}

// 🔄 Hold
function hold(){
  if(!canHold) return;

  if(holdPiece){
    [player.shape, holdPiece] = [holdPiece, player.shape];
  } else {
    holdPiece = player.shape;
    player.shape = nextPiece;
    nextPiece = randomPiece();
  }

  player.x=3;
  player.y=0;
  canHold=false;
}

// 🎮 UPDATE
function update(){
  player.y++;

  if(collide(arena,player)){
    player.y--;
    merge();
    clearLines();

    player.shape = nextPiece;
    nextPiece = randomPiece();
    canHold = true;

    if(!muted) sounds.drop.play();

    if(collide(arena,player)){
      if(!muted) sounds.gameover.play();
      initGame();
    }
  }

  draw();
}

// 🎨 DRAW
function draw(){
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  drawGrid();
  drawMatrix(arena,{x:0,y:0});
  drawGhost();
  drawMatrix(player.shape,player);

  drawParticles();
}

// 🎹 Controls
document.addEventListener("keydown", e=>{
  if(!gameRunning) return;

  if(e.key==="ArrowLeft") player.x--;
  if(e.key==="ArrowRight") player.x++;
  if(e.key==="ArrowDown") player.y++;
  if(e.key==="Shift") hold();
});

// 🔇 Mute
document.getElementById("mute").onclick = (e)=>{
  muted=!muted;
  e.target.textContent = muted ? "🔇":"🔊";
};

// 🔁 Restart
document.getElementById("restart").onclick = ()=>{
  initGame();
};
