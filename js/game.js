// Pistol Tetris — simple implementation
(function(){
  const COLS = 10;
  const ROWS = 20;
  const CELL = 24; // pixels
  const canvas = document.getElementById('board');
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');

  // Load pistol image (SVG)
  const pistol = new Image();
  pistol.src = 'assets/pistol.svg';

  function makeMatrix(w,h){
    const m = [];
    while(h--) m.push(new Array(w).fill(0));
    return m;
  }

  const arena = makeMatrix(COLS, ROWS);

  const pieces = {
    I: [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    J: [[1,0,0],[1,1,1],[0,0,0]],
    L: [[0,0,1],[1,1,1],[0,0,0]],
    O: [[1,1],[1,1]],
    S: [[0,1,1],[1,1,0],[0,0,0]],
    T: [[0,1,0],[1,1,1],[0,0,0]],
    Z: [[1,1,0],[0,1,1],[0,0,0]]
  };

  function createPiece(type){
    const matrix = pieces[type].map(r=>r.slice());
    return {matrix, pos:{x:Math.floor(COLS/2)-Math.ceil(matrix[0].length/2), y:0}};
  }

  function collide(arena, player){
    const m = player.matrix;
    for(let y=0;y<m.length;y++){
      for(let x=0;x<m[y].length;x++){
        if(m[y][x] && (arena[player.pos.y+y] && arena[player.pos.y+y][player.pos.x+x])!==0){
          return true;
        }
      }
    }
    return false;
  }

  function merge(arena, player){
    const m = player.matrix;
    for(let y=0;y<m.length;y++){
      for(let x=0;x<m[y].length;x++){
        if(m[y][x]) arena[player.pos.y+y][player.pos.x+x] = 1;
      }
    }
  }

  function rotate(matrix, dir){
    for(let y=0;y<matrix.length;y++){
      for(let x=0;x<y;x++){
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
    }
    if(dir>0) matrix.forEach(row=>row.reverse()); else matrix.reverse();
  }

  function playerRotate(dir){
    const posX = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while(collide(arena, player)){
      player.pos.x += offset;
      offset = -(offset + (offset>0?1:-1));
      if(Math.abs(offset) > player.matrix[0].length){
        rotate(player.matrix, -dir);
        player.pos.x = posX;
        return;
      }
    }
  }

  function clearLines(){
    let rowCount = 0;
    outer: for(let y=arena.length-1;y>=0;y--){
      for(let x=0;x<arena[y].length;x++){
        if(arena[y][x] === 0) continue outer;
      }
      const row = arena.splice(y,1)[0].fill(0);
      arena.unshift(row);
      y++;
      rowCount++;
    }
    if(rowCount>0){
      lines += rowCount;
      score += (rowCount * 100) * level;
      level = Math.floor(lines/10)+1;
      scoreEl.textContent = score;
      linesEl.textContent = lines;
      levelEl.textContent = level;
      dropInterval = Math.max(100, 800 - (level-1)*60);
    }
  }

  function playerDrop(){
    player.pos.y++;
    if(collide(arena, player)){
      player.pos.y--;
      merge(arena, player);
      resetPlayer();
      clearLines();
    }
    dropCounter = 0;
  }

  function hardDrop(){
    while(!collide(arena, player)) player.pos.y++;
    player.pos.y--;
    merge(arena, player);
    resetPlayer();
    clearLines();
    dropCounter = 0;
  }

  function resetPlayer(){
    const types = Object.keys(pieces);
    player = createPiece(types[Math.floor(Math.random()*types.length)]);
    if(collide(arena, player)){
      // game over -> clear arena
      for(let y=0;y<arena.length;y++) arena[y].fill(0);
      score = 0; lines = 0; level = 1;
      scoreEl.textContent = score; linesEl.textContent = lines; levelEl.textContent = level;
    }
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // draw arena background grid
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        if(arena[y][x]) drawPistol(x,y);
      }
    }
    // draw player
    const m = player.matrix;
    for(let y=0;y<m.length;y++){
      for(let x=0;x<m[y].length;x++){
        if(m[y][x]) drawPistol(player.pos.x + x, player.pos.y + y);
      }
    }
  }

  function drawPistol(gridX, gridY){
    const px = gridX * CELL;
    const py = gridY * CELL;
    // draw subtle cell background
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(px+1,py+1,CELL-2,CELL-2);
    // draw image scaled to cell
    if(pistol.complete){
      ctx.drawImage(pistol, px+2, py+2, CELL-4, CELL-4);
    } else {
      // fallback: draw a small rectangle
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px+4,py+4,CELL-8,CELL-8);
    }
  }

  let dropCounter = 0;
  let dropInterval = 800;
  let lastTime = 0;

  let score = 0; let lines = 0; let level = 1;
  let player = null;

  function update(time=0){
    const delta = time - lastTime;
    lastTime = time;
    dropCounter += delta;
    if(dropCounter > dropInterval){
      playerDrop();
    }
    draw();
    requestAnimationFrame(update);
  }

  document.addEventListener('keydown', e=>{
    if(e.key === 'ArrowLeft'){ player.pos.x--; if(collide(arena, player)) player.pos.x++; }
    else if(e.key === 'ArrowRight'){ player.pos.x++; if(collide(arena, player)) player.pos.x--; }
    else if(e.key === 'ArrowDown'){ playerDrop(); }
    else if(e.key === 'ArrowUp'){ playerRotate(1); }
    else if(e.code === 'Space'){ e.preventDefault(); hardDrop(); }
  });

  // start
  resetPlayer();
  requestAnimationFrame(update);

})();
