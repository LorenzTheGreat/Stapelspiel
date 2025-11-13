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
      // GAME OVER!
      gameOver = true;
      gameOverStart = performance.now ? performance.now() : Date.now();
      
      // Trigger sword slash and blood
      addBlood(canvas.width / 2, canvas.height / 2);
      addBlood(canvas.width / 3, canvas.height / 3);
      addBlood((canvas.width * 2) / 3, (canvas.height * 2) / 3);
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
  let gameOver = false;
  let gameOverStart = 0;

  function drawBlood(x, y, vx, vy, life){
    const alpha = life / 1000;
    ctx.fillStyle = `rgba(220, 20, 60, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  let bloodDrops = [];

  function addBlood(x, y){
    for(let i=0;i<12;i++){
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 3;
      bloodDrops.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1000 + Math.random() * 500
      });
    }
  }

  function updateBlood(dt){
    for(let i=bloodDrops.length-1;i>=0;i--){
      const b = bloodDrops[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.2; // gravity
      b.life -= dt;
      if(b.life <= 0) bloodDrops.splice(i, 1);
    }
  }

  function drawSwordSlash(progress){
    // Sword comes from top-right, slashes diagonally
    const startX = canvas.width + 50;
    const startY = -50;
    const endX = -50;
    const endY = canvas.height + 50;
    
    const currentX1 = startX + (endX - startX) * progress;
    const currentY1 = startY + (endY - startY) * progress;
    
    // Draw sword blade
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(startX + (endX - startX) * Math.max(0, progress - 0.2), 
               startY + (endY - startY) * Math.max(0, progress - 0.2));
    ctx.lineTo(currentX1, currentY1);
    ctx.stroke();

    // Draw glow/shine
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * (1 - progress)})`;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(startX + (endX - startX) * Math.max(0, progress - 0.15), 
               startY + (endY - startY) * Math.max(0, progress - 0.15));
    ctx.lineTo(currentX1, currentY1);
    ctx.stroke();

    // Slash line effect
    if(progress > 0.3 && progress < 0.7){
      ctx.strokeStyle = `rgba(255, 200, 0, ${0.8 * (1 - (progress - 0.3) / 0.4)})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(startX + (endX - startX) * progress, 
                 startY + (endY - startY) * progress);
      ctx.lineTo(currentX1 + 20, currentY1 + 20);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawGameOverScreen(progress){
    // Dim overlay
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.7, progress * 0.7)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if(progress < 0.6){
      drawSwordSlash(progress / 0.6);
    }

    if(progress > 0.3){
      const bloodProgress = (progress - 0.3) / 0.7;
      const bloodCount = Math.floor(bloodProgress * bloodDrops.length);
      for(let i=0;i<bloodCount;i++){
        if(bloodDrops[i]) drawBlood(bloodDrops[i].x, bloodDrops[i].y, bloodDrops[i].vx, bloodDrops[i].vy, bloodDrops[i].life);
      }
    }

    // "GAME OVER" text
    if(progress > 0.5){
      const textAlpha = Math.min(1, (progress - 0.5) / 0.5);
      ctx.fillStyle = `rgba(220, 20, 60, ${textAlpha})`;
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    }
  }

  function update(time=0){
    const delta = time - lastTime;
    lastTime = time;

    if(gameOver){
      // Game over animation
      const elapsed = time - gameOverStart;
      const progress = Math.min(1, elapsed / 1500);
      
      updateBlood(delta);
      draw();
      drawGameOverScreen(progress);

      if(progress >= 1){
        // Animation finished, restart on any key
        gameOver = false;
        gameOverStart = 0;
        bloodDrops = [];
        for(let y=0;y<arena.length;y++) arena[y].fill(0);
        score = 0; lines = 0; level = 1;
        dropInterval = 800;
        scoreEl.textContent = score; linesEl.textContent = lines; levelEl.textContent = level;
      }
    } else {
      dropCounter += delta;
      if(dropCounter > dropInterval){
        playerDrop();
      }
      draw();
    }

    requestAnimationFrame(update);
  }

  document.addEventListener('keydown', e=>{
    if(gameOver) return; // Block input during game over
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
