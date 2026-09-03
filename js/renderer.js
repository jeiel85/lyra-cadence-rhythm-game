/**
 * Retro Pixel Art Canvas Renderer for Lyra's Cadence
 * Handles 320x180 canvas, camera, authentic dialogue box, HUD, and beat visualizer.
 */
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.showDebug = true;
    this.fps = 60;
    this.mspt = 16.6;

    // Dialogue typing state
    this.dialogueText = '';
    this.dialogueIndex = 0;
    this.dialogueTimer = 0;
    this.dialogueComplete = false;
  }

  clear() {
    this.ctx.fillStyle = '#0e1118';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Draw stage tilemap
  renderStage(stage, currentBeat, game) {
    const sm = window.spriteManager.cache;
    const waterFrame = Math.floor(currentBeat * 2) % 4;
    const tiles = stage.tiles;

    for (let r = 0; r < stage.rows; r++) {
      for (let c = 0; c < stage.cols; c++) {
        const t = tiles[r][c];
        const px = c * 16;
        const py = r * 16;

        switch (t) {
          case 0: // Grass
            this.ctx.drawImage(sm['tile_grass'], px, py);
            break;
          case 1: // Cliff top
            this.ctx.drawImage(sm['tile_cliff'], px, py);
            break;
          case 2: // Wooden fence (drawn on top of grass)
            this.ctx.drawImage(sm['tile_grass'], px, py);
            this.ctx.drawImage(sm['tile_fence'], px, py);
            break;
          case 3: // Animated River Water
            this.ctx.drawImage(sm['tile_water'][waterFrame], px, py);
            break;
          case 4: // Shoreline with animated foam
            this.ctx.drawImage(sm['tile_water_shore'][waterFrame], px, py);
            break;
          case 5: // Pier
            this.ctx.drawImage(sm['tile_pier'], px, py);
            break;
          case 6: // Floating Barrel with water bobbing
            this.ctx.drawImage(sm['tile_water'][waterFrame], px, py);
            const bob = Math.sin(currentBeat * Math.PI + c) * 1.5;
            this.ctx.drawImage(sm['tile_barrel'], px, py + bob);
            break;
          case 7: // Rock in river
            this.ctx.drawImage(sm['tile_water'][waterFrame], px, py);
            this.ctx.drawImage(sm['tile_rock'], px, py);
            break;
          case 8: // Lilypad in river
            this.ctx.drawImage(sm['tile_water'][waterFrame], px, py);
            this.ctx.drawImage(sm['tile_lilypad'], px, py);
            break;
          case 9: // Bush with flowers
            this.ctx.drawImage(sm['tile_grass'], px, py);
            this.ctx.drawImage(sm['tile_bush'], px, py);
            break;
          case 10: // ♪ Note Tile with glowing beat pulse
            this.ctx.drawImage(sm['tile_grass'], px, py);
            this.ctx.drawImage(sm['tile_note'], px, py);
            // Pulsing highlight ring on beat
            const prog = currentBeat % 1.0;
            if (prog < 0.3) {
              this.ctx.strokeStyle = 'rgba(255, 230, 100, ' + (1 - prog / 0.3) + ')';
              this.ctx.lineWidth = 1;
              this.ctx.strokeRect(px - 1, py - 1, 18, 18);
            }
            break;
          case 11: // Rhythm Spikes (Toggles on odd/even beat)
            const spikeUp = Math.floor(currentBeat) % 2 === 0;
            this.ctx.drawImage(spikeUp ? sm['tile_spike_up'] : sm['tile_spike_down'], px, py);
            break;
          case 12: // Ruins Wall
            this.ctx.drawImage(sm['tile_ruins_wall'], px, py);
            break;
          case 13: // Ruins Slate Floor
            this.ctx.drawImage(sm['tile_ruins_floor'], px, py);
            break;
        }
      }
    }

    // Render Stage 3 Sequence Pads
    if (stage.seqPads) {
      stage.seqPads.forEach(pad => {
        const px = pad.x * 16;
        const py = pad.y * 16;
        this.ctx.fillStyle = pad.pressed ? '#52b788' : '#2b3a4a';
        this.ctx.fillRect(px + 2, py + 2, 12, 12);
        this.ctx.strokeStyle = '#ffd166';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px + 2, py + 2, 12, 12);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '7px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(pad.num, px + 8, py + 11);
      });
    }

    // Render Stage 3 Laser Barrier
    if (stage.laserBarrierActive && stage.id === 3) {
      this.ctx.fillStyle = 'rgba(255, 0, 80, 0.75)';
      this.ctx.fillRect(16 * 16, 6 * 16, 4, 32);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(16 * 16 + 1, 6 * 16, 2, 32);
    }
  }

  // Render Items (Runes, etc.)
  renderItems(items, currentBeat) {
    if (!items) return;
    const float = Math.sin(currentBeat * Math.PI) * 2;
    items.forEach(item => {
      if (item.collected) return;
      const px = item.x * 16;
      const py = item.y * 16 + float;

      this.ctx.fillStyle = '#4cc9f0';
      this.ctx.beginPath();
      this.ctx.arc(px + 8, py + 8, 4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(px + 8, py + 8, 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  // Render Enemies
  renderEnemies(enemies, currentBeat) {
    if (!enemies) return;
    const sm = window.spriteManager.cache['enemies'];
    enemies.forEach(e => {
      if (e.hp <= 0) return;
      const hop = Math.abs(Math.sin(currentBeat * Math.PI)) * 3;
      const px = e.x * 16;
      const py = e.y * 16 - (e.type === 'slime' ? hop : 0);

      const sprite = sm[e.type];
      if (sprite) {
        this.ctx.drawImage(sprite, px, py);
      }

      // Small HP bar
      if (e.hp < e.maxHp) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(px, py - 4, 16, 3);
        this.ctx.fillStyle = '#ff0054';
        this.ctx.fillRect(px + 1, py - 3, (e.hp / e.maxHp) * 14, 1);
      }
    });
  }

  // Render Boss (Cadence Overlord)
  renderBoss(boss, currentBeat) {
    if (!boss || !boss.active || boss.state === 'defeated') return;
    const sm = window.spriteManager.cache;

    // Warning blast indicators
    boss.warningZones.forEach(wz => {
      const alpha = 0.25 + (Math.sin(currentBeat * Math.PI * 4) + 1) * 0.2;
      this.ctx.fillStyle = 'rgba(255, 0, 80, ' + alpha + ')';
      if (wz.type === 'col') {
        this.ctx.fillRect(wz.index * 16, 0, 16, 180);
      } else {
        this.ctx.fillRect(0, wz.index * 16, 320, 16);
      }
    });

    // Boss Sprite with hurt flashing
    const isFlashing = boss.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0;
    if (!isFlashing) {
      this.ctx.drawImage(sm['boss'], boss.x, boss.renderY || boss.y);
    }

    // Shield Aura in Phase 1
    if (boss.shieldActive && boss.phase === 1 && boss.state !== 'stunned') {
      this.ctx.strokeStyle = 'rgba(76, 201, 240, 0.7)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(boss.x + 24, (boss.renderY || boss.y) + 24, 28, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Projectiles
    boss.projectiles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius || 4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, (p.radius || 4) * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Boss Top HP Bar
    this.ctx.fillStyle = '#111624';
    this.ctx.fillRect(50, 6, 220, 10);
    this.ctx.strokeStyle = '#485773';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(50, 6, 220, 10);

    const hpPercent = Math.max(0, boss.hp / boss.maxHp);
    this.ctx.fillStyle = boss.phase === 2 ? '#ff0054' : '#ffd166';
    this.ctx.fillRect(52, 8, hpPercent * 216, 6);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '6px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      'CADENCE OVERLORD ' + (boss.phase === 2 ? '[ENRAGED]' : ''),
      160,
      13
    );
  }

  // Render Player (Lyra)
  renderPlayer(player, currentBeat) {
    const sm = window.spriteManager.cache['lyra'];
    if (!sm) return;

    // Rhythmic bobbing to the beat (1-pixel bounce)
    const bob = Math.round(Math.abs(Math.sin(currentBeat * Math.PI)));
    const px = Math.round(player.pixelX);
    const py = Math.round(player.pixelY) - bob;

    const dirSprites = sm[player.dir] || sm['down'];
    const frameIndex = player.isMoving ? player.walkFrame : 0;
    const sprite = dirSprites[frameIndex] || dirSprites[0];

    // Hurt invulnerability blinking
    const isBlinking = player.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0;
    if (!isBlinking && sprite) {
      this.ctx.drawImage(sprite, px, py - 4); // Player is 16x20
    }

    // Slash Arc Effect
    if (player.slashTimer > 0) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const slashDist = 12;
      let sx = px;
      let sy = py;
      if (player.dir === 'right') sx += slashDist;
      if (player.dir === 'left') sx -= slashDist;
      if (player.dir === 'down') sy += slashDist;
      if (player.dir === 'up') sy -= slashDist;

      this.ctx.beginPath();
      this.ctx.arc(sx + 8, sy + 8, 10, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#ffd166';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  // Render Particles
  renderParticles(particles) {
    const sm = window.spriteManager.cache;
    particles.forEach(p => {
      this.ctx.globalAlpha = Math.max(0, p.life);
      if (p.type === 'note' && sm['fx_note']) {
        this.ctx.drawImage(sm['fx_note'], p.x - 4, p.y - 4);
      } else if (p.type === 'spark' && sm['fx_spark']) {
        this.ctx.drawImage(sm['fx_spark'], p.x - 4, p.y - 4);
      } else {
        this.ctx.fillStyle = p.color || '#fff';
        this.ctx.fillRect(p.x, p.y, p.size || 2, p.size || 2);
      }
    });
    this.ctx.globalAlpha = 1.0;
  }

  // Render Floating Texts
  renderFloatingTexts(texts) {
    texts.forEach(ft => {
      this.ctx.globalAlpha = Math.min(1.0, ft.life);
      this.ctx.font = '7px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#000000';
      this.ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      this.ctx.fillStyle = ft.color || '#ffffff';
      this.ctx.fillText(ft.text, ft.x, ft.y);
    });
    this.ctx.globalAlpha = 1.0;
  }

  // Render Dialogue Box (Faithfully matches the Threads screenshot!)
  renderDialogue(speaker, text) {
    const boxX = 10;
    const boxY = 128;
    const boxW = 300;
    const boxH = 46;

    // Outer white box with subtle shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.fillRect(boxX + 2, boxY + 2, boxW, boxH);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.roundRect(boxX, boxY, boxW, boxH, 4);
    this.ctx.fill();

    // Dotted inner frame
    this.ctx.strokeStyle = '#b0c4de';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    this.ctx.strokeRect(boxX + 3, boxY + 3, boxW - 6, boxH - 6);
    this.ctx.setLineDash([]);

    // Speaker Nameplate (Orange badge on top-left, exactly matching screenshot!)
    const nameBadgeW = 54;
    const nameBadgeH = 14;
    this.ctx.fillStyle = '#d65a31';
    this.ctx.fillRect(boxX + 12, boxY - 7, nameBadgeW, nameBadgeH);
    this.ctx.strokeStyle = '#8a3416';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(boxX + 12, boxY - 7, nameBadgeW, nameBadgeH);

    this.ctx.fillStyle = '#000000';
    this.ctx.font = '7px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(speaker, boxX + 12 + nameBadgeW / 2, boxY + 3);

    // Dialogue typing text
    this.ctx.fillStyle = '#1c1e21';
    this.ctx.font = '8px "Press Start 2P", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(text, boxX + 14, boxY + 24);

    // Flashing Enter prompt on bottom right
    if (Math.floor(Date.now() / 400) % 2 === 0) {
      this.ctx.fillStyle = '#d65a31';
      this.ctx.font = '6px "Press Start 2P", monospace';
      this.ctx.textAlign = 'right';
      this.ctx.fillText('▼ ENT', boxX + boxW - 8, boxY + boxH - 6);
    }
  }

  // Render HUD & Rhythm Beat Bar
  renderHUD(player, currentBeat, combo) {
    const sm = window.spriteManager.cache;

    // Hearts on top-left
    const maxHearts = 3;
    for (let i = 0; i < maxHearts; i++) {
      const isFull = player.hp > i;
      const heart = isFull ? sm['heart_full'] : sm['heart_empty'];
      if (heart) {
        this.ctx.drawImage(heart, 8 + i * 11, 6);
      }
    }

    // Combo counter
    if (combo > 1) {
      this.ctx.font = '7px "Press Start 2P", monospace';
      this.ctx.textAlign = 'left';
      this.ctx.fillStyle = combo > 10 ? '#ffd166' : '#8ac926';
      this.ctx.fillText(`COMBO ${combo}x`, 46, 13);
    }

    // --- RHYTHM BEAT BAR AT BOTTOM ---
    const barY = 172;
    const barCenter = 160;
    const barWidth = 140;

    // Track line
    this.ctx.fillStyle = 'rgba(15, 20, 30, 0.7)';
    this.ctx.fillRect(barCenter - barWidth / 2, barY - 4, barWidth, 9);
    this.ctx.strokeStyle = '#3c4966';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barCenter - barWidth / 2, barY - 4, barWidth, 9);

    // Hit Center target
    const prog = currentBeat % 1.0;
    const pulseSize = Math.max(0, 1 - prog / 0.3) * 2;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(barCenter, barY, 4 + pulseSize, 0, Math.PI * 2);
    this.ctx.fill();

    // Notes sliding from left and right towards center
    const numMarkers = 3;
    for (let i = -numMarkers; i <= numMarkers; i++) {
      if (i === 0) continue;
      // Distance based on beat fractional progress
      const noteOffset = (i - (prog - 0.5)) * 24;
      const noteX = barCenter + noteOffset;

      if (noteX >= barCenter - barWidth / 2 + 4 && noteX <= barCenter + barWidth / 2 - 4) {
        this.ctx.fillStyle = '#ffbe0b';
        this.ctx.beginPath();
        this.ctx.arc(noteX, barY, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Debug Overlay (Top Right, exactly matching screenshot: "21.0 FPS 12.28 mspt (Sync)")
    if (this.showDebug) {
      this.ctx.font = '6px monospace';
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = '#6da278';
      this.ctx.fillText(`${this.fps.toFixed(1)} FPS  ${this.mspt.toFixed(2)} mspt (Sync)`, 314, 10);
    }
  }
}

window.Renderer = Renderer;
