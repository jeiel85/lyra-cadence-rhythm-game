/**
 * Stage Definitions, Tilemaps, Events, and Dialogues for Lyra's Cadence
 */
class StageManager {
  constructor() {
    this.currentStageId = 1;
    this.stages = {};
  }

  init() {
    this.stages = {
      1: this.createStage1(),
      2: this.createStage2(),
      3: this.createStage3(),
      4: this.createStage4()
    };
  }

  getStage(id) {
    return this.stages[id] || null;
  }

  // --- STAGE 1: Riverside Meadow (Faithful Screenshot Reproduction) ---
  createStage1() {
    const cols = 20;
    const rows = 12;
    // Base tile layer: 0=grass, 1=cliff, 2=fence, 3=water, 4=water_shore, 5=pier, 6=barrel, 7=rock, 8=lilypad, 9=bush, 10=note
    const map = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (r < 3) {
          row.push(1); // Cliff top
        } else if (c >= 14) {
          row.push(3); // River water
        } else if (c === 13 && r >= 3) {
          row.push(4); // Water shoreline
        } else {
          row.push(0); // Grass meadow
        }
      }
      map.push(row);
    }

    // Place Fences (matching screenshot)
    for (let c = 6; c <= 13; c++) {
      map[3][c] = 2;
    }
    map[7][6] = 2;
    map[8][6] = 2;

    // Place Note Tile at (5, 5)
    map[5][5] = 10;

    // Place Pier at (13, 6)
    map[6][13] = 5;

    // Place Floating Barrels at (16, 6) and (17, 6)
    map[6][16] = 6;
    map[6][17] = 6;

    // Place River Rock & Lilypads (matching screenshot)
    map[4][17] = 7; // Rock
    map[5][18] = 8; // Lilypad

    // Place Bushes with Flowers (matching screenshot)
    map[8][8] = 9;
    map[8][9] = 9;

    return {
      id: 1,
      name: 'Riverside Meadow',
      sidebarTitle: 'Introduction',
      musicKey: 'stage1',
      cols: cols,
      rows: rows,
      tiles: map,
      playerStart: { x: 12, y: 6, dir: 'right' }, // Right next to pier looking at river
      noteTile: { x: 5, y: 5, activated: false },
      bridgeAligned: false,
      exitTrigger: { x: 19, y: 6 },
      dialogues: [
        { speaker: 'Lyra', text: 'Moving in the rhythm now.' },
        { speaker: 'Lyra', text: 'If I step in time with the music, my steps resonate with the earth!' },
        { speaker: 'Lyra', text: 'That ♪ note tile... Stepping on it on beat should align the barrels to cross!' }
      ],
      enemies: [],
      items: [],
      // Update logic per frame
      update(game) {
        // Check if player steps on note tile
        if (!this.noteTile.activated && game.player.tileX === this.noteTile.x && game.player.tileY === this.noteTile.y) {
          const hit = window.soundEngine.checkBeatAccuracy();
          if (hit.rating !== 'MISS') {
            this.noteTile.activated = true;
            this.bridgeAligned = true;
            window.soundEngine.playNoteTileChime();
            game.addParticles(this.noteTile.x * 16 + 8, this.noteTile.y * 16 + 8, 'note', 8);
            game.showFloatingText('BRIDGE ALIGNED!', this.noteTile.x * 16 + 8, this.noteTile.y * 16 - 4, '#ffca3a');

            // Complete the barrel bridge from x=14 to x=19 on row 6
            for (let c = 14; c < 19; c++) {
              this.tiles[6][c] = 6;
            }
          } else {
            game.showFloatingText('OFF BEAT!', this.noteTile.x * 16 + 8, this.noteTile.y * 16 - 4, '#e63946');
          }
        }

        // Check if player reached the exit across river
        if (this.bridgeAligned && game.player.tileX >= 18 && game.player.tileY === 6) {
          game.loadStage(2);
        }
      }
    };
  }

  // --- STAGE 2: Whispering Woods (Forest Maze & Slimes) ---
  createStage2() {
    const cols = 22;
    const rows = 14;
    const map = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          row.push(9); // Dense tree borders
        } else {
          row.push(0); // Forest ground
        }
      }
      map.push(row);
    }

    // Inner forest maze hedges
    for (let c = 4; c < 18; c += 4) {
      for (let r = 2; r < 10; r++) {
        if (r !== 5 && r !== 6) map[r][c] = 9;
      }
    }

    // Spikes (11 = spike)
    map[5][8] = 11;
    map[6][8] = 11;
    map[8][12] = 11;

    return {
      id: 2,
      name: 'Whispering Woods',
      sidebarTitle: 'Whispering Woods',
      musicKey: 'stage2',
      cols: cols,
      rows: rows,
      tiles: map,
      playerStart: { x: 2, y: 5, dir: 'right' },
      runesNeeded: 3,
      runesCollected: 0,
      gateOpen: false,
      dialogues: [
        { speaker: 'Lyra', text: 'The Whispering Woods... The tempo is speeding up.' },
        { speaker: 'Lyra', text: 'Those slimes hop to the beat! Attack them on beat to clear the way.' },
        { speaker: 'Lyra', text: 'I need to collect 3 Harmonic Runes to open the ancient gate ahead.' }
      ],
      items: [
        { id: 'rune1', type: 'rune', x: 6, y: 2, collected: false },
        { id: 'rune2', type: 'rune', x: 10, y: 11, collected: false },
        { id: 'rune3', type: 'rune', x: 18, y: 3, collected: false }
      ],
      enemies: [
        { id: 's1', type: 'slime', x: 6, y: 6, hp: 2, maxHp: 2, beatInterval: 2, dir: 1 },
        { id: 's2', type: 'slime', x: 14, y: 7, hp: 2, maxHp: 2, beatInterval: 2, dir: -1 },
        { id: 'b1', type: 'bat', x: 10, y: 4, hp: 2, maxHp: 2, beatInterval: 1, dir: 1 }
      ],
      update(game) {
        // Collect runes
        this.items.forEach(item => {
          if (!item.collected && game.player.tileX === item.x && game.player.tileY === item.y) {
            item.collected = true;
            this.runesCollected++;
            window.soundEngine.playNoteTileChime();
            game.addParticles(item.x * 16 + 8, item.y * 16 + 8, 'spark', 10);
            game.showFloatingText(`RUNE ${this.runesCollected}/3!`, item.x * 16 + 8, item.y * 16 - 4, '#48cae4');
            
            if (this.runesCollected >= this.runesNeeded) {
              this.gateOpen = true;
              game.showFloatingText('GATE OPENED!', cols * 16 / 2, 30, '#52b788');
            }
          }
        });

        // Exit at right gate (20, 6)
        if (this.gateOpen && game.player.tileX >= cols - 2 && (game.player.tileY === 6 || game.player.tileY === 7)) {
          game.loadStage(3);
        }
      }
    };
  }

  // --- STAGE 3: Echo Ruins (Tempo Shift & Step-Sequence Puzzle) ---
  createStage3() {
    const cols = 22;
    const rows = 14;
    const map = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          row.push(12); // Ancient brick walls
        } else {
          row.push(13); // Ruins slate floor
        }
      }
      map.push(row);
    }

    // Sanctuary barrier row
    for (let r = 1; r < rows - 1; r++) {
      if (r !== 6 && r !== 7) {
        map[r][16] = 12;
      }
    }

    // Numbered Sequence Pads (1, 2, 3, 4)
    const seqPads = [
      { num: 1, x: 5, y: 4, pressed: false },
      { num: 2, x: 9, y: 4, pressed: false },
      { num: 3, x: 9, y: 9, pressed: false },
      { num: 4, x: 5, y: 9, pressed: false }
    ];

    return {
      id: 3,
      name: 'Echo Ruins',
      sidebarTitle: 'Echo Ruins',
      musicKey: 'stage3',
      cols: cols,
      rows: rows,
      tiles: map,
      playerStart: { x: 2, y: 6, dir: 'right' },
      seqPads: seqPads,
      currentStep: 1,
      laserBarrierActive: true,
      dialogues: [
        { speaker: 'Lyra', text: 'Echo Ruins... The pulse is 130 BPM! Faster and fierce.' },
        { speaker: 'Lyra', text: 'Notice the 4 rhythmic pads on the floor (1-2-3-4).' },
        { speaker: 'Lyra', text: 'Step on them in order on consecutive beats to dispel the barrier!' }
      ],
      enemies: [
        { id: 'bat1', type: 'bat', x: 7, y: 6, hp: 3, maxHp: 3, beatInterval: 1, dir: 1 },
        { id: 'slime1', type: 'slime', x: 12, y: 6, hp: 3, maxHp: 3, beatInterval: 2, dir: -1 }
      ],
      items: [],
      update(game) {
        // Check pad steps
        this.seqPads.forEach(pad => {
          if (game.player.tileX === pad.x && game.player.tileY === pad.y) {
            if (!pad.pressed) {
              if (pad.num === this.currentStep) {
                const hit = window.soundEngine.checkBeatAccuracy();
                if (hit.rating !== 'MISS') {
                  pad.pressed = true;
                  this.currentStep++;
                  window.soundEngine.playBeatStep('PERFECT');
                  game.addParticles(pad.x * 16 + 8, pad.y * 16 + 8, 'note', 6);
                  game.showFloatingText(`STEP ${pad.num}!`, pad.x * 16 + 8, pad.y * 16 - 4, '#52b788');

                  if (this.currentStep > 4) {
                    this.laserBarrierActive = false;
                    window.soundEngine.playNoteTileChime();
                    game.showFloatingText('SANCTUARY UNSEALED!', cols * 16 / 2, 30, '#ffd166');
                  }
                } else {
                  // Failed beat, reset sequence
                  game.showFloatingText('BROKE RHYTHM! RESET!', pad.x * 16 + 8, pad.y * 16 - 4, '#e63946');
                  this.seqPads.forEach(p => p.pressed = false);
                  this.currentStep = 1;
                }
              }
            }
          }
        });

        // Exit at right barrier (16, 6-7) to Boss
        if (!this.laserBarrierActive && game.player.tileX >= cols - 2 && (game.player.tileY === 6 || game.player.tileY === 7)) {
          game.loadStage(4);
        }
      }
    };
  }

  // --- STAGE 4: The Maestro's Sanctuary (Grand Boss Arena) ---
  createStage4() {
    const cols = 20;
    const rows = 12;
    const map = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          row.push(12); // Grand arena walls
        } else {
          row.push(13); // Arena floor
        }
      }
      map.push(row);
    }

    return {
      id: 4,
      name: "The Maestro's Core",
      sidebarTitle: 'Boss Arena',
      musicKey: 'boss',
      cols: cols,
      rows: rows,
      tiles: map,
      playerStart: { x: 10, y: 9, dir: 'up' },
      isBossStage: true,
      dialogues: [
        { speaker: 'Cadence Overlord', text: 'You dare disturb the eternal rhythm of this sanctuary?' },
        { speaker: 'Lyra', text: 'Your discordant waves are breaking the world apart!' },
        { speaker: 'Cadence Overlord', text: 'Then dance to the final symphony... if your pulse can endure!' }
      ],
      enemies: [],
      items: [],
      update(game) {
        // Boss update is driven by BossManager
      }
    };
  }
}

window.stageManager = new StageManager();
