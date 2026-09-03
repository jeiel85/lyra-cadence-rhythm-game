/**
 * Procedural Pixel Art Sprite Generator for Lyra's Cadence
 * Creates sharp, authentic 16-bit retro sprites matching the Threads post.
 */
class SpriteManager {
  constructor() {
    this.cache = {};
  }

  // Create an offscreen canvas
  createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: ctx };
  }

  init() {
    this.generateTerrainTiles();
    this.generateLyraSprites();
    this.generateEnemySprites();
    this.generateBossSprites();
    this.generateFX();
    console.log('SpriteManager initialized with pixel assets');
  }

  // Draw a grid of pixels from a string array
  drawPixelPattern(ctx, pattern, palette, offsetX = 0, offsetY = 0) {
    for (let r = 0; r < pattern.length; r++) {
      const row = pattern[r];
      for (let c = 0; c < row.length; c++) {
        const char = row[c];
        if (char !== ' ' && char !== '.' && palette[char]) {
          ctx.fillStyle = palette[char];
          ctx.fillRect(offsetX + c, offsetY + r, 1, 1);
        }
      }
    }
  }

  // 1. Terrain & World Tiles (16x16)
  generateTerrainTiles() {
    // --- GRASS ---
    const grass = this.createCanvas(16, 16);
    grass.ctx.fillStyle = '#559c2a'; // Base grass green
    grass.ctx.fillRect(0, 0, 16, 16);
    // Darker grass tufts
    grass.ctx.fillStyle = '#427c20';
    grass.ctx.fillRect(2, 3, 2, 1); grass.ctx.fillRect(3, 2, 1, 1);
    grass.ctx.fillRect(10, 8, 2, 1); grass.ctx.fillRect(11, 7, 1, 1);
    grass.ctx.fillRect(6, 12, 2, 1); grass.ctx.fillRect(7, 11, 1, 1);
    // Light highlights
    grass.ctx.fillStyle = '#6cb738';
    grass.ctx.fillRect(4, 4, 1, 1);
    grass.ctx.fillRect(12, 9, 1, 1);
    grass.ctx.fillRect(8, 13, 1, 1);
    this.cache['tile_grass'] = grass.canvas;

    // --- CLIFF (Top / Ridge) ---
    const cliff = this.createCanvas(16, 16);
    cliff.ctx.fillStyle = '#3a1b10'; // Dark outline
    cliff.ctx.fillRect(0, 0, 16, 16);
    const cliffP = [
      "RRRRRRRRRRRRRRRR",
      "RrrRrrRrrRrrRrrR",
      "rddrddrddrddrddr",
      "rddrddrddrddrddr",
      "d..d..d..d..d..d",
      "RRRRRRRRRRRRRRRR",
      "RrrRrrRrrRrrRrrR",
      "rddrddrddrddrddr",
      "d..d..d..d..d..d",
      "RRRRRRRRRRRRRRRR",
      "RrrRrrRrrRrrRrrR",
      "rddrddrddrddrddr",
      "d..d..d..d..d..d",
      "d..d..d..d..d..d",
      "................",
      "................"
    ];
    this.drawPixelPattern(cliff.ctx, cliffP, {
      'R': '#c26236',
      'r': '#94441f',
      'd': '#632810',
      '.': '#361406'
    });
    this.cache['tile_cliff'] = cliff.canvas;

    // --- WOODEN FENCE (Post & Rails) ---
    const fence = this.createCanvas(16, 16);
    const fenceP = [
      "                ",
      "   .pp.         ",
      "  .pppp.        ",
      "  .PppP.        ",
      "  .pppp.rrrrrrrr",
      "  .pppp.RRRRRRRR",
      "  .pppp.rrrrrrrr",
      "  .pppp.        ",
      "  .pppp.rrrrrrrr",
      "  .pppp.RRRRRRRR",
      "  .pppp.rrrrrrrr",
      "  .pppp.        ",
      "  .pppp.        ",
      "  .pppp.        ",
      "  .pppp.        ",
      "  ......        "
    ];
    this.drawPixelPattern(fence.ctx, fenceP, {
      'p': '#9b5b29',
      'P': '#c47d3d',
      '.': '#442109',
      'R': '#b87233',
      'r': '#743c16'
    });
    this.cache['tile_fence'] = fence.canvas;

    // --- WATER (River) with animation frames ---
    this.cache['tile_water'] = [];
    for (let f = 0; f < 4; f++) {
      const wC = this.createCanvas(16, 16);
      wC.ctx.fillStyle = '#2d77b8';
      wC.ctx.fillRect(0, 0, 16, 16);
      wC.ctx.fillStyle = '#4fa1df';
      const offset = f * 4;
      wC.ctx.fillRect((2 + offset) % 16, 3, 4, 1);
      wC.ctx.fillRect((8 + offset) % 16, 7, 5, 1);
      wC.ctx.fillRect((1 + offset) % 16, 11, 4, 1);
      wC.ctx.fillRect((10 + offset) % 16, 14, 3, 1);
      wC.ctx.fillStyle = '#1c5284';
      wC.ctx.fillRect((2 + offset) % 16, 4, 4, 1);
      wC.ctx.fillRect((8 + offset) % 16, 8, 5, 1);
      wC.ctx.fillRect((1 + offset) % 16, 12, 4, 1);
      this.cache['tile_water'].push(wC.canvas);
    }

    // --- WATER SHORE (White Foam Edge on Grass) ---
    this.cache['tile_water_shore'] = [];
    for (let f = 0; f < 4; f++) {
      const ws = this.createCanvas(16, 16);
      ws.ctx.fillStyle = '#559c2a';
      ws.ctx.fillRect(0, 0, 8, 16);
      ws.ctx.fillStyle = '#2d77b8';
      ws.ctx.fillRect(8, 0, 8, 16);

      ws.ctx.fillStyle = '#ffffff';
      const waveShift = Math.sin((f / 4) * Math.PI * 2) * 1.5;
      for (let y = 0; y < 16; y++) {
        const x = Math.round(7 + waveShift + (y % 4 === 0 ? 1 : 0));
        ws.ctx.fillRect(x, y, 2, 1);
      }
      ws.ctx.fillStyle = '#9fe1f5';
      for (let y = 0; y < 16; y++) {
        const x = Math.round(9 + waveShift);
        ws.ctx.fillRect(x, y, 1, 1);
      }
      this.cache['tile_water_shore'].push(ws.canvas);
    }

    // --- FLOATING WOODEN BARREL (Bridge Element) ---
    const barrel = this.createCanvas(16, 16);
    const barrelP = [
      "    ......      ",
      "  ..bbbbbb..    ",
      " .bbdhhhhdbb.   ",
      ".bbdhhhhhhdbb.  ",
      ".mmMMMMMMMMmm.  ",
      ".bbdhhhhhhdbb.  ",
      ".bbdhhhhhhdbb.  ",
      ".bbdhhhhhhdbb.  ",
      ".mmMMMMMMMMmm.  ",
      ".bbdhhhhhhdbb.  ",
      " .bbdhhhhdbb.   ",
      "  ..bbbbbb..    ",
      "    ......      ",
      "   ~~~~~~~~     ",
      "  ~~~~~~~~~~    ",
      "                "
    ];
    this.drawPixelPattern(barrel.ctx, barrelP, {
      '.': '#291404',
      'b': '#5b3212',
      'd': '#432109',
      'h': '#8a5223',
      'm': '#3e454d',
      'M': '#6a7582',
      '~': '#4fa1df'
    });
    this.cache['tile_barrel'] = barrel.canvas;

    // --- PIER / DOCK ---
    const pier = this.createCanvas(16, 16);
    pier.ctx.fillStyle = '#2d77b8';
    pier.ctx.fillRect(0, 0, 16, 16);
    const pierP = [
      "                ",
      "                ",
      "................",
      ".pppp.pppp.pppp.",
      ".PPPP.PPPP.PPPP.",
      ".PPPP.PPPP.PPPP.",
      ".pppp.pppp.pppp.",
      ".PPPP.PPPP.PPPP.",
      ".PPPP.PPPP.PPPP.",
      ".pppp.pppp.pppp.",
      ".PPPP.PPPP.PPPP.",
      ".PPPP.PPPP.PPPP.",
      ".pppp.pppp.pppp.",
      "................",
      "    ||    ||    ",
      "    ||    ||    "
    ];
    this.drawPixelPattern(pier.ctx, pierP, {
      '.': '#2c1508',
      'p': '#653a1a',
      'P': '#8d552c',
      '|': '#221107'
    });
    this.cache['tile_pier'] = pier.canvas;

    // --- NOTE TILE (♪ Pedestal Plate) ---
    const noteTile = this.createCanvas(16, 16);
    const noteP = [
      " .............  ",
      ".sssssssssssss. ",
      ".sSSSSSSSSSSSs. ",
      ".sS         Ss. ",
      ".sS   ###   Ss. ",
      ".sS   ###   Ss. ",
      ".sS    ##   Ss. ",
      ".sS    ##   Ss. ",
      ".sS  ####   Ss. ",
      ".sS ######  Ss. ",
      ".sS ######  Ss. ",
      ".sS  ####   Ss. ",
      ".sSSSSSSSSSSSs. ",
      ".sssssssssssss. ",
      " .............  ",
      "                "
    ];
    this.drawPixelPattern(noteTile.ctx, noteP, {
      '.': '#313f48',
      's': '#627a8a',
      'S': '#96b0c2',
      '#': '#ffffff',
      ' ': '#4a5d6a'
    });
    this.cache['tile_note'] = noteTile.canvas;

    // --- BUSH WITH FLOWERS (Screenshot Hedge) ---
    const bush = this.createCanvas(16, 16);
    const bushP = [
      "    .......     ",
      "  ..ggggggg..   ",
      " .gggwwgggggg.  ",
      ".ggggwwggggggg. ",
      ".ggwYYwggggggg. ",
      ".ggwYYwggwwggg. ",
      ".gggwwgggwwggg. ",
      ".gggggggGYYGgg. ",
      ".gggggggGYYGgg. ",
      ".gGYYGgggwwggg. ",
      ".gGYYGgggggggg. ",
      " .gggGggGGggg.  ",
      "  ..gGGGGgg..   ",
      "    .......     ",
      "                ",
      "                "
    ];
    this.drawPixelPattern(bush.ctx, bushP, {
      '.': '#13280c',
      'g': '#2c611f',
      'G': '#1b4012',
      'w': '#ffffff',
      'Y': '#fce253'
    });
    this.cache['tile_bush'] = bush.canvas;

    // --- RIVER ROCK & LILYPAD ---
    const rock = this.createCanvas(16, 16);
    rock.ctx.fillStyle = '#2d77b8';
    rock.ctx.fillRect(0, 0, 16, 16);
    const rockP = [
      "                ",
      "     .....      ",
      "   ..RRRRR..    ",
      "  .RRrrrrrRR.   ",
      " .RRrrrrrrrRR.  ",
      " .RRrrrrrrrRR.  ",
      "  .RRrrrrrRR.   ",
      "   ..RRRRR..    ",
      "    ~.....~     ",
      "   ~~~~~~~~~    ",
      "                ",
      "                ",
      "                ",
      "                ",
      "                ",
      "                "
    ];
    this.drawPixelPattern(rock.ctx, rockP, {
      '.': '#1c2933',
      'R': '#8193a0',
      'r': '#a9b8c2',
      '~': '#4fa1df'
    });
    this.cache['tile_rock'] = rock.canvas;

    const lily = this.createCanvas(16, 16);
    lily.ctx.fillStyle = '#2d77b8';
    lily.ctx.fillRect(0, 0, 16, 16);
    const lilyP = [
      "                ",
      "     .....      ",
      "   ..GGGGG..    ",
      "  .GGGGGGG.G.   ",
      " .GGGGGGGG. G.  ",
      " .GGGGGGG.  G.  ",
      "  .GGGGGG. G.   ",
      "   ..GGGGG..    ",
      "     .....      ",
      "                ",
      "                ",
      "                ",
      "                ",
      "                ",
      "                ",
      "                "
    ];
    this.drawPixelPattern(lily.ctx, lilyP, {
      '.': '#0f3811',
      'G': '#2da132'
    });
    this.cache['tile_lilypad'] = lily.canvas;

    // --- RUINS BRICK WALL & FLOOR (Stages 3 & 4) ---
    const ruinsWall = this.createCanvas(16, 16);
    const rWallP = [
      "................",
      ".bbbbbb.bbbbbb..",
      ".bBBBBb.bBBBBb..",
      ".bbbbbb.bbbbbb..",
      "................",
      ".bbb.bbbbbb.bbb.",
      ".bBb.bBBBBb.bBb.",
      ".bbb.bbbbbb.bbb.",
      "................",
      ".bbbbbb.bbbbbb..",
      ".bBBBBb.bBBBBb..",
      ".bbbbbb.bbbbbb..",
      "................",
      ".bbb.bbbbbb.bbb.",
      ".bBb.bBBBBb.bBb.",
      "................"
    ];
    this.drawPixelPattern(ruinsWall.ctx, rWallP, {
      '.': '#141824',
      'b': '#2c354a',
      'B': '#46536e'
    });
    this.cache['tile_ruins_wall'] = ruinsWall.canvas;

    const ruinsFloor = this.createCanvas(16, 16);
    ruinsFloor.ctx.fillStyle = '#1c2230';
    ruinsFloor.ctx.fillRect(0, 0, 16, 16);
    ruinsFloor.ctx.fillStyle = '#283144';
    ruinsFloor.ctx.fillRect(1, 1, 14, 14);
    ruinsFloor.ctx.fillStyle = '#181d29';
    ruinsFloor.ctx.fillRect(0, 0, 16, 1);
    ruinsFloor.ctx.fillRect(0, 0, 1, 16);
    this.cache['tile_ruins_floor'] = ruinsFloor.canvas;

    // --- RHYTHM SPIKE TRAP ---
    const spikeUp = this.createCanvas(16, 16);
    spikeUp.ctx.drawImage(ruinsFloor.canvas, 0, 0);
    const spikeP = [
      "                ",
      "   /L     /L    ",
      "  /##L   /##L   ",
      "  |##|   |##|   ",
      "  |##|   |##|   ",
      "                ",
      "     /L     /L  ",
      "    /##L   /##L ",
      "    |##|   |##| ",
      "    |##|   |##| ",
      "                ",
      "   /L     /L    ",
      "  /##L   /##L   ",
      "  |##|   |##|   ",
      "  |##|   |##|   ",
      "                "
    ];
    this.drawPixelPattern(spikeUp.ctx, spikeP, {
      '/': '#d6e2e9',
      'L': '#94a7b3',
      '|': '#62737f',
      '#': '#e63946'
    });
    this.cache['tile_spike_up'] = spikeUp.canvas;

    const spikeDown = this.createCanvas(16, 16);
    spikeDown.ctx.drawImage(ruinsFloor.canvas, 0, 0);
    spikeDown.ctx.fillStyle = '#0f121a';
    spikeDown.ctx.fillRect(4, 4, 2, 2);
    spikeDown.ctx.fillRect(10, 4, 2, 2);
    spikeDown.ctx.fillRect(7, 8, 2, 2);
    spikeDown.ctx.fillRect(4, 12, 2, 2);
    spikeDown.ctx.fillRect(10, 12, 2, 2);
    this.cache['tile_spike_down'] = spikeDown.canvas;
  }

  // 2. Lyra Character Sprites (16x20)
  generateLyraSprites() {
    this.cache['lyra'] = {
      down: [],
      up: [],
      left: [],
      right: [],
      attack: []
    };

    const palette = {
      '.': '#1a0e08',
      'H': '#2b1910',
      'R': '#d65a31',
      's': '#fcd7b6',
      'S': '#e2b38e',
      'E': '#0e0b09',
      'b': '#f78878',
      'T': '#4a3023',
      't': '#684534',
      'w': '#ffffff',
      'B': '#99632f',
      'P': '#201610'
    };

    const lyraDown0 = [
      "     ......     ",
      "    .RR..RR.    ",
      "   .HHHHHHHH.   ",
      "  .HHHHHHHHHH.  ",
      "  .HHssssssHH.  ",
      "  .HsEs..sEsH.  ",
      "  .HssssssssH.  ",
      "  .Hsbs..sbsh.  ",
      "   .HssssssH.   ",
      "    .wwwwww.    ",
      "   .tTTTTTTt.   ",
      "   .TTTTTTTT.   ",
      "   .TTTBBTTT.   ",
      "   .TTTTTTTT.   ",
      "   .TTTTTTTT.   ",
      "    .PPPPPP.    ",
      "    .PP..PP.    ",
      "    .PP..PP.    ",
      "    ....  ..    ",
      "                "
    ];

    const lyraDown1 = [
      "     ......     ",
      "    .RR..RR.    ",
      "   .HHHHHHHH.   ",
      "  .HHHHHHHHHH.  ",
      "  .HHssssssHH.  ",
      "  .HsEs..sEsH.  ",
      "  .HssssssssH.  ",
      "  .Hsbs..sbsh.  ",
      "   .HssssssH.   ",
      "    .wwwwww.    ",
      "   .tTTTTTTt.   ",
      "   .TTTTTTTT.   ",
      "   .TTTBBTTT.   ",
      "   .TTTTTTTT.   ",
      "   .TTTTTTTT.   ",
      "    .PPPPP.     ",
      "   .PPP..P.     ",
      "   .PPP..P.     ",
      "   ....  .      ",
      "                "
    ];

    const lyraDown2 = [
      "     ......     ",
      "    .RR..RR.    ",
      "   .HHHHHHHH.   ",
      "  .HHHHHHHHHH.  ",
      "  .HHssssssHH.  ",
      "  .HsEs..sEsH.  ",
      "  .HssssssssH.  ",
      "  .Hsbs..sbsh.  ",
      "   .HssssssH.   ",
      "    .wwwwww.    ",
      "   .tTTTTTTt.   ",
      "   .TTTTTTTT.   ",
      "   .TTTBBTTT.   ",
      "   .TTTTTTTT.   ",
      "   .TTTTTTTT.   ",
      "     .PPPPP.    ",
      "     .P..PPP.   ",
      "     .P..PPP.   ",
      "      .  ....   ",
      "                "
    ];

    [lyraDown0, lyraDown1, lyraDown2].forEach(pat => {
      const c = this.createCanvas(16, 20);
      this.drawPixelPattern(c.ctx, pat, palette);
      this.cache['lyra'].down.push(c.canvas);
    });

    const lyraUp0 = [
      "     ......     ",
      "    .RR..RR.    ",
      "   .HHHHHHHH.   ",
      "  .HHHHHHHHHH.  ",
      "  .HHHHHHHHHH.  ",
      "  .HHHHHHHHHH.  ",
      "  .HHHHHHHHHH.  ",
      "  .HHHHHHHHHH.  ",
      "   .HHHHHHHH.   ",
      "    .wwwwww.    ",
      "   .tTTTTTTt.   ",
      "   .TTTTTTTT.   ",
      "   .TTTBBTTT.   ",
      "   .TTTTTTTT.   ",
      "   .TTTTTTTT.   ",
      "    .PPPPPP.    ",
      "    .PP..PP.    ",
      "    .PP..PP.    ",
      "    ....  ..    ",
      "                "
    ];
    [lyraUp0, lyraDown1, lyraDown2].forEach(pat => {
      const c = this.createCanvas(16, 20);
      this.drawPixelPattern(c.ctx, pat, palette);
      this.cache['lyra'].up.push(c.canvas);
    });

    const lyraRight0 = [
      "     ......     ",
      "     .RR...     ",
      "    .HHHHH.     ",
      "   .HHHHHHH.    ",
      "   .HHHHsss.    ",
      "   .HHHHsEs.    ",
      "   .HHHHsss.    ",
      "   .HHHHssb.    ",
      "    .HHHHs.     ",
      "     .www.      ",
      "    .tTTTt.     ",
      "    .TTTTT.     ",
      "    .TTBBT.     ",
      "    .TTTTT.     ",
      "    .TTTTT.     ",
      "     .PPP.      ",
      "     .PPP.      ",
      "     .PPP.      ",
      "     ....       ",
      "                "
    ];
    [lyraRight0, lyraDown1, lyraDown2].forEach(pat => {
      const c = this.createCanvas(16, 20);
      this.drawPixelPattern(c.ctx, pat, palette);
      this.cache['lyra'].right.push(c.canvas);
    });

    this.cache['lyra'].right.forEach(canvasRight => {
      const c = this.createCanvas(16, 20);
      c.ctx.translate(16, 0);
      c.ctx.scale(-1, 1);
      c.ctx.drawImage(canvasRight, 0, 0);
      this.cache['lyra'].left.push(c.canvas);
    });
  }

  // 3. Enemy Sprites
  generateEnemySprites() {
    this.cache['enemies'] = {};

    const slimeP = [
      "                ",
      "     ......     ",
      "   ..gggggg..   ",
      "  .gggggggggg.  ",
      " .ggggGGgggggg. ",
      ".ggwwgGGgwwgggg.",
      ".gwbwgGGgwbwggg.",
      ".gwbwgGGgwbwggg.",
      ".ggwwggggwwgggg.",
      ".gggggggggggggg.",
      ".gggggggggggggg.",
      " .gggggggggggg. ",
      "  ..gggggggg..  ",
      "    ........    ",
      "                ",
      "                "
    ];
    const slimePalette = {
      '.': '#0d3810',
      'g': '#38b000',
      'G': '#70e000',
      'w': '#ffffff',
      'b': '#000000'
    };
    const sC = this.createCanvas(16, 16);
    this.drawPixelPattern(sC.ctx, slimeP, slimePalette);
    this.cache['enemies']['slime'] = sC.canvas;

    const batP = [
      " .  .      .  . ",
      ".p..p.    .p..p.",
      ".ppppp....ppppp.",
      " .pppppppppppp. ",
      "  .pprpprpppp.  ",
      "  .pprpprpppp.  ",
      "   .pppppppp.   ",
      "    .pppppp.    ",
      "    ..pppp..    ",
      "     .pppp.     ",
      "      ....      ",
      "                ",
      "                ",
      "                ",
      "                ",
      "                "
    ];
    const batPalette = {
      '.': '#1c0f24',
      'p': '#5a189a',
      'r': '#ff0054'
    };
    const bC = this.createCanvas(16, 16);
    this.drawPixelPattern(bC.ctx, batP, batPalette);
    this.cache['enemies']['bat'] = bC.canvas;
  }

  // 4. Final Boss: Cadence Overlord (48x48)
  generateBossSprites() {
    const boss = this.createCanvas(48, 48);
    const ctx = boss.ctx;

    const bp = {
      '.': '#0b0914',
      'M': '#e8ecef',
      'm': '#b0b8c4',
      'G': '#ffd166',
      'C': '#6a040f',
      'c': '#9d0208',
      'P': '#10002b',
      'p': '#240046',
      'R': '#ff0054',
      'W': '#ffffff'
    };

    const bossPattern = [
      "                   ..........                   ",
      "                 ..GGGGGGGGGG..                 ",
      "                .GGGGGGGGGGGGGG.                ",
      "               .GG...GGGGGG...GG.               ",
      "              .GG.   .GGGG.   .GG.              ",
      "              ...    .GGGG.    ...              ",
      "                   ..MMMMMM..                   ",
      "                 ..MMMMMMMMMM..                 ",
      "                .MMMMMMMMMMMMMM.                ",
      "               .MMMmMMMMMMMMmMMM.               ",
      "              .MMMMMMMMMMMMMMMMMM.              ",
      "             .MMMMMRRMMMMMMRRMMMMM.             ",
      "             .MMMMMRWMMMMMMRWMMMMM.             ",
      "             .MMMMMRRMMMMMMRRMMMMM.             ",
      "              .MMMMMMMMMMMMMMMMMM.              ",
      "               .MMMMMM.  .MMMMMM.               ",
      "                .MMMMMM..MMMMMM.                ",
      "                 ..MMMMMMMMMM..                 ",
      "     .....         ..MMMMMM..         .....     ",
      "   ..GGGGG..         ......         ..GGGGG..   ",
      "  .GGWWWWGGG.     ...CCCCCC...     .GGWWWWGGG.  ",
      " .GGWWWWWWGGG.  ..CCCCCCCCCCCC..  .GGWWWWWWGGG. ",
      " .GGWWWWWWGGG..CCCCCCCCCCCCCCCCCC..GGWWWWWWGGG. ",
      "  .GGWWWWGGG. .CCCCCCCCCCCCCCCCCC. .GGWWWWGGG.  ",
      "   ..GGGGG..  .CCPPCCCCCCCCCCPPCC.  ..GGGGG..   ",
      "     .....   .CCPPPPCCCCCCCCPPPPCC.   .....     ",
      "             .CCPPPPPCCCCCCPPPPPPCC.            ",
      "            .CCCPPPPPCCCCCCPPPPPPCCC.           ",
      "            .CCCPPPPPPCCCCPPPPPPCCCC.           ",
      "            .CCCCPPPPPPCCPPPPPPCCCCC.           ",
      "            .CCCCCPPPPPPPPPPPPCCCCCC.           ",
      "            .CCCCCCPPPPPPPPPPCCCCCCC.           ",
      "            .CCCCCCC..PPPP..CCCCCCCC.           ",
      "            .CCCCCCCC......CCCCCCCCC.           ",
      "            .CCCCCCCCCCCCCCCCCCCCCCC.           ",
      "             .CCCCCCCCCCCCCCCCCCCCC.            ",
      "              .CCCCCCCCCCCCCCCCCCC.             ",
      "               .CCCCCCCCCCCCCCCCC.              ",
      "                .CCCCCCCCCCCCCCC.               ",
      "                 ...............                ",
      "                                                ",
      "                                                "
    ];

    this.drawPixelPattern(ctx, bossPattern, bp);
    this.cache['boss'] = boss.canvas;
  }

  // 5. FX & Particle Sprites
  generateFX() {
    const noteFX = this.createCanvas(8, 8);
    const noteP = [
      "   ##   ",
      "   ##   ",
      "   #    ",
      "   #    ",
      " ###    ",
      "#####   ",
      "#####   ",
      " ###    "
    ];
    this.drawPixelPattern(noteFX.ctx, noteP, { '#': '#ffbe0b' });
    this.cache['fx_note'] = noteFX.canvas;

    const sparkFX = this.createCanvas(8, 8);
    const sparkP = [
      "   #    ",
      "  ###   ",
      " #######",
      "  ##### ",
      " #######",
      "  ###   ",
      "   #    ",
      "        "
    ];
    this.drawPixelPattern(sparkFX.ctx, sparkP, { '#': '#ffffff' });
    this.cache['fx_spark'] = sparkFX.canvas;

    const heartF = this.createCanvas(9, 9);
    const heartP = [
      " .r. .r. ",
      ".rrr.rrr.",
      ".rrrrrrr.",
      ".rrrrrrr.",
      ".rrrrrrr.",
      " .rrrrr. ",
      "  .rrr.  ",
      "   .r.   ",
      "    .    "
    ];
    this.drawPixelPattern(heartF.ctx, heartP, { '.': '#200505', 'r': '#e63946' });
    this.cache['heart_full'] = heartF.canvas;

    const heartE = this.createCanvas(9, 9);
    this.drawPixelPattern(heartE.ctx, heartP, { '.': '#200505', 'r': '#4a4e69' });
    this.cache['heart_empty'] = heartE.canvas;
  }
}

window.spriteManager = new SpriteManager();
