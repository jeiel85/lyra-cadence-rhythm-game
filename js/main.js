/**
 * Lyra's Cadence - Main Game Controller & Game Loop
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);
    this.state = 'TITLE'; // TITLE, PLAYING, DIALOGUE, VICTORY, GAMEOVER

    // Player State
    this.player = {
      tileX: 12,
      tileY: 6,
      pixelX: 12 * 16,
      pixelY: 6 * 16,
      dir: 'right',
      hp: 3,
      maxHp: 3,
      isMoving: false,
      moveProgress: 0,
      targetPixelX: 12 * 16,
      targetPixelY: 6 * 16,
      walkFrame: 0,
      slashTimer: 0,
      invulnerableTimer: 0
    };

    // Stage & Boss
    this.currentStage = null;
    this.stageId = 1;

    // Rhythm Stats
    this.combo = 0;
    this.maxCombo = 0;
    this.score = 0;
    this.totalNotes = 0;
    this.perfectNotes = 0;

    // FX
    this.particles = [];
    this.floatingTexts = [];
    this.cameraShake = 0;

    // Dialogue Queue
    this.dialogueQueue = [];
    this.currentDialogue = null;
    this.dialogueCharIndex = 0;
    this.dialogueTimer = 0;

    // FPS Counter
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fpsTimer = 0;

    this.initUI();
  }

  start() {
    try {
      window.soundEngine.init();
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
    window.spriteManager.init();
    window.stageManager.init();

    const overlay = document.getElementById('start-overlay');
    if (overlay) overlay.style.display = 'none';

    this.state = 'PLAYING';
    this.loadStage(1);

    // Trigger initial dialog
    if (this.currentStage && this.currentStage.dialogues) {
      this.startDialogueSequence(this.currentStage.dialogues);
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  initUI() {
    // Start button & overlay click
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        this.start();
      });
    }

    const startOverlay = document.getElementById('start-overlay');
    if (startOverlay) {
      startOverlay.addEventListener('click', () => {
        this.start();
      });
    }

    // Keydown start (Space or Enter on title screen)
    window.addEventListener('keydown', (e) => {
      if (this.state === 'TITLE') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
          this.start();
        }
      }
    });

    // Controls bar buttons
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        const active = window.soundEngine.toggleMute();
        e.target.textContent = active ? '🔊 Sound: On' : '🔇 Sound: Muted';
      });
    }

    const crtBtn = document.getElementById('btn-crt');
    if (crtBtn) {
      crtBtn.addEventListener('click', (e) => {
        const crt = document.getElementById('crt-overlay');
        if (crt) {
          crt.classList.toggle('disabled');
          e.target.textContent = crt.classList.contains('disabled') ? '📺 CRT: Off' : '📺 CRT: On';
        }
      });
    }

    const touchBtn = document.getElementById('btn-touch');
    if (touchBtn) {
      touchBtn.addEventListener('click', (e) => {
        const pad = document.getElementById('touch-controls');
        if (pad) pad.classList.toggle('active');
      });
    }

    const debugBtn = document.getElementById('btn-debug');
    if (debugBtn) {
      debugBtn.addEventListener('click', (e) => {
        this.renderer.showDebug = !this.renderer.showDebug;
        e.target.textContent = this.renderer.showDebug ? '🛠️ FPS: On' : '🛠️ FPS: Off';
      });
    }

    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.loadStage(this.stageId);
      });
    }
  }

  loadStage(stageNum) {
    this.stageId = stageNum;
    this.currentStage = window.stageManager.getStage(stageNum);
    if (!this.currentStage) return;

    // Update sidebar label
    const sideLabel = document.getElementById('stage-label');
    if (sideLabel) {
      sideLabel.textContent = this.currentStage.sidebarTitle;
    }

    // Set player start
    this.player.tileX = this.currentStage.playerStart.x;
    this.player.tileY = this.currentStage.playerStart.y;
    this.player.pixelX = this.player.tileX * 16;
    this.player.pixelY = this.player.tileY * 16;
    this.player.targetPixelX = this.player.pixelX;
    this.player.targetPixelY = this.player.pixelY;
    this.player.dir = this.currentStage.playerStart.dir || 'down';
    this.player.isMoving = false;
    this.player.hp = this.player.maxHp;

    // Particles & Floating texts
    this.particles = [];
    this.floatingTexts = [];

    // Switch Music
    if (window.soundEngine) {
      window.soundEngine.playTrack(this.currentStage.musicKey);
    }

    // If boss stage, activate boss
    if (this.currentStage.isBossStage && window.bossManager) {
      window.bossManager.reset();
    }

    // Start stage dialogue
    if (this.currentStage.dialogues && this.currentStage.dialogues.length > 0) {
      this.startDialogueSequence(this.currentStage.dialogues);
    }
  }

  startDialogueSequence(dialogues) {
    this.dialogueQueue = [...dialogues];
    this.advanceDialogue();
  }

  advanceDialogue() {
    if (this.dialogueQueue.length > 0) {
      this.currentDialogue = this.dialogueQueue.shift();
      this.dialogueCharIndex = 0;
      this.dialogueTimer = 0;
      this.state = 'DIALOGUE';
    } else {
      this.currentDialogue = null;
      this.state = 'PLAYING';
    }
  }

  // Combat & Movement
  handlePlayerMovement() {
    if (this.player.isMoving) {
      const speed = 2.5;
      const dx = this.player.targetPixelX - this.player.pixelX;
      const dy = this.player.targetPixelY - this.player.pixelY;
      const dist = Math.hypot(dx, dy);

      if (dist <= speed) {
        this.player.pixelX = this.player.targetPixelX;
        this.player.pixelY = this.player.targetPixelY;
        this.player.isMoving = false;
      } else {
        this.player.pixelX += (dx / dist) * speed;
        this.player.pixelY += (dy / dist) * speed;
      }
      return;
    }

    const move = window.inputHandler.getMovement();
    if (move.dx !== 0 || move.dy !== 0) {
      // Set facing direction
      if (Math.abs(move.dx) > Math.abs(move.dy)) {
        this.player.dir = move.dx > 0 ? 'right' : 'left';
      } else {
        this.player.dir = move.dy > 0 ? 'down' : 'up';
      }

      // Check rhythm accuracy for movement
      const accuracy = window.soundEngine.checkBeatAccuracy();
      this.totalNotes++;

      if (accuracy.rating !== 'MISS') {
        this.combo += accuracy.comboAdd;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.score += accuracy.score;
        if (accuracy.rating === 'PERFECT') this.perfectNotes++;
        window.soundEngine.playBeatStep(accuracy.rating);
        this.showFloatingText(accuracy.rating + '!', this.player.pixelX + 8, this.player.pixelY - 4, accuracy.rating === 'PERFECT' ? '#ffd166' : '#06d6a0');
      } else {
        this.combo = 0;
        window.soundEngine.playBeatStep('MISS');
        this.showFloatingText('OFF BEAT', this.player.pixelX + 8, this.player.pixelY - 4, '#e63946');
      }

      // Target tile
      const nextX = this.player.tileX + move.dx;
      const nextY = this.player.tileY + move.dy;

      // Check walkable tile
      if (this.isTileWalkable(nextX, nextY)) {
        this.player.tileX = nextX;
        this.player.tileY = nextY;
        this.player.targetPixelX = nextX * 16;
        this.player.targetPixelY = nextY * 16;
        this.player.isMoving = true;
        this.player.walkFrame = (this.player.walkFrame + 1) % 3;
      }
    }
  }

  isTileWalkable(x, y) {
    if (!this.currentStage) return false;
    if (x < 0 || x >= this.currentStage.cols || y < 0 || y >= this.currentStage.rows) return false;

    const tile = this.currentStage.tiles[y][x];
    // Blocked: 1=cliff, 2=fence, 3=water, 4=water_shore, 9=bush, 12=ruins_wall
    if ([1, 2, 3, 4, 9, 12].includes(tile)) return false;

    // Laser barrier in stage 3
    if (this.currentStage.id === 3 && this.currentStage.laserBarrierActive && x === 16 && (y === 6 || y === 7)) {
      return false;
    }

    return true;
  }

  handlePlayerAction() {
    if (window.inputHandler.isAction()) {
      this.player.slashTimer = 0.2;
      window.soundEngine.playSlash();

      const accuracy = window.soundEngine.checkBeatAccuracy();
      this.totalNotes++;

      if (accuracy.rating !== 'MISS') {
        this.combo += accuracy.comboAdd;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.score += accuracy.score;
        this.showFloatingText(accuracy.rating + '!', this.player.pixelX + 8, this.player.pixelY - 4, '#ffd166');
      } else {
        this.combo = 0;
        this.showFloatingText('OFF BEAT', this.player.pixelX + 8, this.player.pixelY - 4, '#e63946');
      }

      // Attack Hitbox in front of player
      const reach = 16;
      let ax = this.player.pixelX;
      let ay = this.player.pixelY;
      if (this.player.dir === 'right') ax += reach;
      if (this.player.dir === 'left') ax -= reach;
      if (this.player.dir === 'down') ay += reach;
      if (this.player.dir === 'up') ay -= reach;

      const playerBox = { x: ax, y: ay, w: 16, h: 16 };

      // Damage enemies
      if (this.currentStage.enemies) {
        this.currentStage.enemies.forEach(e => {
          if (e.hp <= 0) return;
          const eBox = { x: e.x * 16, y: e.y * 16, w: 16, h: 16 };
          if (
            playerBox.x < eBox.x + eBox.w &&
            playerBox.x + playerBox.w > eBox.x &&
            playerBox.y < eBox.y + eBox.h &&
            playerBox.y + playerBox.h > eBox.y
          ) {
            e.hp -= (accuracy.rating === 'PERFECT' ? 2 : 1);
            window.soundEngine.playHit();
            this.addParticles(eBox.x + 8, eBox.y + 8, 'spark', 8);
            this.showFloatingText('-1 HP', eBox.x + 8, eBox.y - 4, '#ff0054');
          }
        });
      }

      // Damage or deflect Boss
      if (this.currentStage.isBossStage && window.bossManager) {
        window.bossManager.checkMeleeHit(this, playerBox, accuracy);
      }
    }
  }

  damagePlayer(amount) {
    if (this.player.invulnerableTimer > 0) return;
    this.player.hp -= amount;
    this.player.invulnerableTimer = 1.0;
    this.combo = 0;
    window.soundEngine.playHurt();
    this.addCameraShake(6);

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.state = 'GAMEOVER';
      this.showFloatingText('GAME OVER', 160, 90, '#e63946');
    }
  }

  onBossDefeated() {
    this.state = 'VICTORY';
    window.soundEngine.playVictory();
    for (let i = 0; i < 30; i++) {
      this.addParticles(160 + (Math.random() - 0.5) * 80, 80 + (Math.random() - 0.5) * 60, 'note', 1);
    }
  }

  // Particle & FX Helpers
  addParticles(x, y, type, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.5 + Math.random() * 2.0;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        type: type,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  showFloatingText(text, x, y, color = '#ffffff') {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      color: color,
      life: 1.0
    });
  }

  addCameraShake(amount) {
    this.cameraShake = amount;
  }

  // Main Loop
  loop(timestamp) {
    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // FPS & MSPT calculation
    this.frameCount++;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 0.5) {
      this.renderer.fps = this.frameCount / this.fpsTimer;
      this.renderer.mspt = delta * 1000;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    const currentBeat = window.soundEngine ? window.soundEngine.getCurrentBeat() : 0;

    // Update Game Logic
    this.update(delta, currentBeat);

    // Render Frame
    this.render(currentBeat);

    requestAnimationFrame((t) => this.loop(t));
  }

  update(delta, currentBeat) {
    // Restart stage on R
    if (window.inputHandler && window.inputHandler.wasPressed('KeyR')) {
      this.loadStage(this.stageId);
      return;
    }

    // Camera shake decay
    if (this.cameraShake > 0) {
      this.cameraShake = Math.max(0, this.cameraShake - delta * 15);
    }

    // Slash timer decay
    if (this.player.slashTimer > 0) {
      this.player.slashTimer -= delta;
    }

    // Player invulnerability decay
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= delta;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= delta * 18;
      ft.life -= delta * 1.5;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // State handling
    if (this.state === 'DIALOGUE') {
      if (this.currentDialogue) {
        this.dialogueTimer += delta;
        if (this.dialogueTimer >= 0.03 && this.dialogueCharIndex < this.currentDialogue.text.length) {
          this.dialogueCharIndex++;
          this.dialogueTimer = 0;
          if (this.dialogueCharIndex % 2 === 0 && window.soundEngine) {
            window.soundEngine.playDialogBlip();
          }
        }

        if (window.inputHandler && window.inputHandler.isDialogueAdvance()) {
          if (this.dialogueCharIndex < this.currentDialogue.text.length) {
            this.dialogueCharIndex = this.currentDialogue.text.length;
          } else {
            this.advanceDialogue();
          }
        }
      }
      return;
    }

    if (this.state === 'PLAYING') {
      this.handlePlayerMovement();
      this.handlePlayerAction();

      if (this.currentStage) {
        this.currentStage.update(this);
      }

      if (this.currentStage && this.currentStage.isBossStage && window.bossManager) {
        window.bossManager.update(this, currentBeat);
      }
    }

    if (this.state === 'GAMEOVER' || this.state === 'VICTORY') {
      if (window.inputHandler && window.inputHandler.isDialogueAdvance()) {
        if (this.state === 'GAMEOVER') {
          this.loadStage(this.stageId);
          this.state = 'PLAYING';
        } else if (this.state === 'VICTORY') {
          this.loadStage(1);
          this.state = 'PLAYING';
        }
      }
    }
  }

  render(currentBeat) {
    this.renderer.clear();

    const ctx = this.renderer.ctx;
    ctx.save();

    // Camera Shake
    if (this.cameraShake > 0) {
      const sx = (Math.random() - 0.5) * this.cameraShake;
      const sy = (Math.random() - 0.5) * this.cameraShake;
      ctx.translate(sx, sy);
    }

    if (this.currentStage) {
      this.renderer.renderStage(this.currentStage, currentBeat, this);
      this.renderer.renderItems(this.currentStage.items, currentBeat);
      this.renderer.renderEnemies(this.currentStage.enemies, currentBeat);

      if (this.currentStage.isBossStage && window.bossManager) {
        this.renderer.renderBoss(window.bossManager, currentBeat);
      }

      this.renderer.renderPlayer(this.player, currentBeat);
    }

    this.renderer.renderParticles(this.particles);
    this.renderer.renderFloatingTexts(this.floatingTexts);
    this.renderer.renderHUD(this.player, currentBeat, this.combo);

    // Dialogue Overlay
    if (this.state === 'DIALOGUE' && this.currentDialogue) {
      const displayText = this.currentDialogue.text.substring(0, this.dialogueCharIndex);
      this.renderer.renderDialogue(this.currentDialogue.speaker, displayText);
    }

    // Victory Screen Overlay
    if (this.state === 'VICTORY') {
      ctx.fillStyle = 'rgba(10, 14, 24, 0.85)';
      ctx.fillRect(20, 20, 280, 140);
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 280, 140);

      ctx.fillStyle = '#ffd166';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CONGRATULATIONS!', 160, 48);

      ctx.fillStyle = '#8ac926';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('SANCTUARY RESTORED!', 160, 68);

      const accRate = this.totalNotes > 0 ? Math.round((this.perfectNotes / this.totalNotes) * 100) : 100;
      let rank = 'C';
      if (accRate >= 90) rank = 'S';
      else if (accRate >= 75) rank = 'A';
      else if (accRate >= 60) rank = 'B';

      ctx.fillStyle = '#ffffff';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText(`SCORE: ${this.score}`, 160, 90);
      ctx.fillText(`MAX COMBO: ${this.maxCombo}x`, 160, 104);
      ctx.fillText(`BEAT ACCURACY: ${accRate}% (RANK ${rank})`, 160, 118);

      ctx.fillStyle = '#d65a31';
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.fillText('PRESS SPACE / ENTER TO RESTART', 160, 142);
    }

    // Game Over Overlay
    if (this.state === 'GAMEOVER') {
      ctx.fillStyle = 'rgba(20, 5, 10, 0.85)';
      ctx.fillRect(40, 40, 240, 100);
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, 240, 100);

      ctx.fillStyle = '#e63946';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('FALLEN IN BATTLE', 160, 75);

      ctx.fillStyle = '#ffffff';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText('YOUR CADENCE FADED AWAY...', 160, 96);

      ctx.fillStyle = '#ffd166';
      ctx.font = '6px "Press Start 2P", monospace';
      ctx.fillText('PRESS SPACE OR R TO RETRY', 160, 122);
    }

    ctx.restore();
  }
}

window.Game = Game;

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
