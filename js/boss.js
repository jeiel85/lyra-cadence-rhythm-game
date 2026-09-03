/**
 * Cadence Overlord - Final Boss AI and Battle Logic
 */
class BossManager {
  constructor() {
    this.active = false;
    this.hp = 20;
    this.maxHp = 20;
    this.phase = 1;
    this.state = 'idle'; // idle, charging, blast, stunned, defeated
    this.x = 10 * 16 - 24;
    this.y = 2 * 16;
    this.targetY = 2 * 16;
    this.width = 48;
    this.height = 48;

    this.shieldActive = true;
    this.stunTimer = 0;
    this.invulnerableTimer = 0;

    this.lastBeat = -1;
    this.beatCounter = 0;

    this.projectiles = [];
    this.warningZones = []; // { type: 'col'|'row', index: number, beatRemaining: number }
  }

  reset() {
    this.active = true;
    this.hp = 20;
    this.maxHp = 20;
    this.phase = 1;
    this.state = 'idle';
    this.x = 10 * 16 - 24;
    this.y = 2 * 16;
    this.shieldActive = true;
    this.projectiles = [];
    this.warningZones = [];
    this.beatCounter = 0;
    this.lastBeat = -1;
    this.stunTimer = 0;
    this.invulnerableTimer = 0;
  }

  update(game, currentBeat) {
    if (!this.active || this.state === 'defeated') return;

    const integerBeat = Math.floor(currentBeat);
    const beatTrigger = integerBeat !== this.lastBeat;
    if (beatTrigger) {
      this.lastBeat = integerBeat;
      this.onBeat(game, integerBeat);
    }

    // Invulnerability frames
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= 1 / 60;
    }

    // Stun recovery
    if (this.state === 'stunned') {
      this.stunTimer -= 1 / 60;
      if (this.stunTimer <= 0) {
        this.state = 'idle';
        if (this.phase === 1) this.shieldActive = true;
      }
    }

    // Smooth hover motion
    const hoverOffset = Math.sin(currentBeat * Math.PI) * 3;
    this.renderY = this.y + hoverOffset;

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Check collision with player
      const pBox = { x: game.player.pixelX + 2, y: game.player.pixelY + 4, w: 12, h: 14 };
      if (
        p.x >= pBox.x &&
        p.x <= pBox.x + pBox.w &&
        p.y >= pBox.y &&
        p.y <= pBox.y + pBox.h
      ) {
        if (!p.reflected) {
          game.damagePlayer(1);
          game.addParticles(p.x, p.y, 'spark', 6);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Check reflected projectile hitting boss
      if (p.reflected) {
        if (
          p.x >= this.x + 8 &&
          p.x <= this.x + 40 &&
          p.y >= this.y &&
          p.y <= this.y + 40
        ) {
          this.takeDamage(game, 2, true);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Boundary check
      if (p.x < 0 || p.x > 320 || p.y < 0 || p.y > 200) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  onBeat(game, beat) {
    this.beatCounter++;

    // Update warning zones
    for (let i = this.warningZones.length - 1; i >= 0; i--) {
      const wz = this.warningZones[i];
      wz.beatRemaining--;
      if (wz.beatRemaining <= 0) {
        // Execute Blast!
        this.executeBlast(game, wz);
        this.warningZones.splice(i, 1);
      }
    }

    if (this.state === 'stunned') return;

    // --- PHASE 1: Shield & Echo Orbs (HP > 10) ---
    if (this.phase === 1) {
      // Every 4 beats: Telegraph a column or row shockwave
      if (this.beatCounter % 4 === 0) {
        const playerCol = game.player.tileX;
        const playerRow = game.player.tileY;
        const isCol = Math.random() > 0.5;
        this.warningZones.push({
          type: isCol ? 'col' : 'row',
          index: isCol ? playerCol : playerRow,
          beatRemaining: 2 // Strikes in 2 beats
        });
        window.soundEngine.playBeatStep('GREAT');
      }

      // Every 8 beats: Fire reflectable Echo Orb
      if (this.beatCounter % 8 === 0) {
        const targetX = game.player.pixelX + 8;
        const targetY = game.player.pixelY + 8;
        const angle = Math.atan2(targetY - (this.y + 24), targetX - (this.x + 24));
        const speed = 1.6;
        this.projectiles.push({
          x: this.x + 24,
          y: this.y + 24,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: '#ffd166',
          reflected: false,
          radius: 4
        });
        window.soundEngine.playBeatStep('PERFECT');
      }
    }

    // --- PHASE 2: Spiral Bullet Hell & Direct Vulnerability (HP <= 10) ---
    else if (this.phase === 2) {
      // Fire spiral musical notes on every 2 beats
      if (this.beatCounter % 2 === 0) {
        const numBullets = 6;
        const baseAngle = (beat * 0.4);
        for (let i = 0; i < numBullets; i++) {
          const angle = baseAngle + (i * Math.PI * 2) / numBullets;
          const speed = 1.3;
          this.projectiles.push({
            x: this.x + 24,
            y: this.y + 24,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#ff0054',
            reflected: false,
            radius: 3
          });
        }
        window.soundEngine.playBeatStep('GREAT');
      }

      // Shockwave lane every 4 beats
      if (this.beatCounter % 4 === 0) {
        const rndCol = 4 + Math.floor(Math.random() * 12);
        this.warningZones.push({
          type: 'col',
          index: rndCol,
          beatRemaining: 2
        });
      }
    }
  }

  executeBlast(game, wz) {
    window.soundEngine.playSlash();
    game.addCameraShake(5);

    if (wz.type === 'col') {
      const colX = wz.index * 16;
      for (let y = 16; y < 180; y += 16) {
        game.addParticles(colX + 8, y + 8, 'spark', 4);
      }
      if (game.player.tileX === wz.index) {
        game.damagePlayer(1);
      }
    } else {
      const rowY = wz.index * 16;
      for (let x = 16; x < 300; x += 16) {
        game.addParticles(x + 8, rowY + 8, 'spark', 4);
      }
      if (game.player.tileY === wz.index) {
        game.damagePlayer(1);
      }
    }
  }

  // Player attacks towards boss
  checkMeleeHit(game, playerBox, accuracy) {
    if (!this.active || this.state === 'defeated' || this.invulnerableTimer > 0) return;

    // Check hit on boss body
    const bossBox = { x: this.x + 4, y: this.y + 4, w: 40, h: 40 };
    if (
      playerBox.x < bossBox.x + bossBox.w &&
      playerBox.x + playerBox.w > bossBox.x &&
      playerBox.y < bossBox.y + bossBox.h &&
      playerBox.y + playerBox.h > bossBox.y
    ) {
      if (this.shieldActive && this.phase === 1 && this.state !== 'stunned') {
        window.soundEngine.playHit();
        game.showFloatingText('SHIELDED!', this.x + 24, this.y - 4, '#4cc9f0');
        game.addParticles(playerBox.x + 8, playerBox.y + 8, 'spark', 6);
      } else {
        const dmg = accuracy.rating === 'PERFECT' ? 3 : 2;
        this.takeDamage(game, dmg, false);
      }
    }

    // Check deflecting projectiles
    this.projectiles.forEach(p => {
      if (!p.reflected) {
        const dist = Math.hypot(p.x - (playerBox.x + 8), p.y - (playerBox.y + 8));
        if (dist < 18) {
          p.reflected = true;
          p.color = '#06d6a0';
          // Aim directly at Boss!
          const angle = Math.atan2((this.y + 24) - p.y, (this.x + 24) - p.x);
          const speed = 3.5;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          window.soundEngine.playSlash();
          game.addParticles(p.x, p.y, 'note', 8);
          game.showFloatingText('DEFLECTED!', p.x, p.y - 4, '#06d6a0');
        }
      }
    });
  }

  takeDamage(game, amount, wasReflect) {
    this.hp -= amount;
    this.invulnerableTimer = 0.5;
    window.soundEngine.playHit();
    game.addCameraShake(6);
    game.addParticles(this.x + 24, this.y + 24, 'spark', 14);

    if (wasReflect) {
      this.state = 'stunned';
      this.stunTimer = 2.5; // Stunned for 2.5 seconds
      this.shieldActive = false;
      game.showFloatingText('STUNNED!', this.x + 24, this.y - 6, '#ffd166');
    } else {
      game.showFloatingText(`-${amount} HP`, this.x + 24, this.y - 6, '#ff0054');
    }

    // Phase transition check
    if (this.hp <= 10 && this.phase === 1) {
      this.phase = 2;
      this.shieldActive = false;
      this.state = 'idle';
      this.y = 4 * 16; // Move closer to arena center
      window.soundEngine.playBossRoar();
      game.showFloatingText('PHASE 2: CADENCE ENRAGE!', 160, 40, '#ff0054');
      game.addParticles(this.x + 24, this.y + 24, 'note', 20);
    }

    // Boss Defeat
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'defeated';
      this.active = false;
      game.onBossDefeated();
    }
  }
}

window.bossManager = new BossManager();
