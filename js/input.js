/**
 * Input Handler for Keyboard and Touch Virtual Pad
 */
class InputHandler {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.touchActive = false;

    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling on game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keys[e.code]) {
        this.justPressed[e.code] = true;
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  initTouch() {
    const dpadBtns = document.querySelectorAll('.dpad-btn, .act-btn');
    dpadBtns.forEach(btn => {
      const code = btn.dataset.key;
      if (!code) return;

      const press = (e) => {
        e.preventDefault();
        if (!this.keys[code]) this.justPressed[code] = true;
        this.keys[code] = true;
      };

      const release = (e) => {
        e.preventDefault();
        this.keys[code] = false;
      };

      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  wasPressed(code) {
    if (this.justPressed[code]) {
      this.justPressed[code] = false;
      return true;
    }
    return false;
  }

  // Direction helpers
  getMovement() {
    let dx = 0;
    let dy = 0;

    if (this.isDown('ArrowLeft') || this.isDown('KeyA')) dx -= 1;
    if (this.isDown('ArrowRight') || this.isDown('KeyD')) dx += 1;
    if (this.isDown('ArrowUp') || this.isDown('KeyW')) dy -= 1;
    if (this.isDown('ArrowDown') || this.isDown('KeyS')) dy += 1;

    return { dx, dy };
  }

  isAction() {
    return this.wasPressed('Space') || this.wasPressed('KeyZ');
  }

  isDialogueAdvance() {
    return this.wasPressed('Space') || this.wasPressed('Enter') || this.wasPressed('KeyZ');
  }

  reset() {
    this.justPressed = {};
  }
}

window.inputHandler = new InputHandler();
