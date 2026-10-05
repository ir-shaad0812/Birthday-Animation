/**
 * @file fireworks.js
 * @description Canvas-based fireworks engine. Import FireworksEngine,
 * point it at a <canvas>, call .start() — everything else is internal.
 */

const TAU = Math.PI * 2;

/**
 * Returns a random integer in the range [min, max] (inclusive).
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const randomInt = (min, max) => (Math.random() * (max - min + 1) + min) | 0;

/**
 * A single point of light moving through the canvas.
 *
 * Two roles, distinguished by `spread`:
 *  - **Rocket** (`spread > 0`): rises toward a target, leaves a glowing trail,
 *    then fans out child sparks when it arrives.
 *  - **Spark** (`spread = 0`): one of those child sparks — a single fading dot.
 */
class Particle {
  /**
   * @param {number} x       - Launch x (usually near the bottom center).
   * @param {number} y       - Launch y (usually the bottom edge).
   * @param {number} targetX - Destination x to travel toward.
   * @param {number} targetY - Destination y to travel toward.
   * @param {number} hue     - HSL hue (0–360). Shared with child sparks so the burst is color-cohesive.
   * @param {number} spread  - Explosion radius in px. Use 0 for a plain spark with no children.
   */
  constructor(x, y, targetX, targetY, hue, spread) {
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.hue = hue;
    this.spread = spread;

    this.trail = [];       // position history, used to draw the rocket's streak
    this.hasExploded = false;
    this.isDead = false;
  }

  /**
   * Advances the particle by `delta` seconds and draws it.
   *
   * While traveling, positions are pushed into `this.trail` (capped at 20).
   * Once within 3 px of the target the rocket triggers its explosion, then
   * drains the trail one step per frame until nothing is left — at that
   * point `isDead` is set and the engine can discard this particle.
   *
   * @param {number}                  delta  - Seconds since the last frame.
   * @param {CanvasRenderingContext2D} ctx    - Canvas context to render onto.
   * @param {FireworksEngine}         engine - Parent engine, needed to push new sparks on explosion.
   */
  update(delta, ctx, engine) {
    if (this.isDead) return;

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const isTraveling = Math.abs(dx) > 3 || Math.abs(dy) > 3;

    if (isTraveling) {
      this.x += dx * 2 * delta;
      this.y += dy * 2 * delta;

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 20) this.trail.shift();
    } else {
      if (this.spread && !this.hasExploded) {
        this._explode(engine);
      }
      this.hasExploded = true;
      // Drain the trail one entry per frame so the streak fades naturally.
      this.trail.shift();
    }

    if (this.trail.length === 0) {
      this.isDead = true;
      return;
    }

    this._render(ctx);
  }

  /**
   * Fans out a ring of spark children evenly around the burst point.
   *
   * @param {FireworksEngine} engine
   */
  _explode(engine) {
    const childCount = this.spread / 2;
    for (let i = 0; i < childCount; i++) {
      const angle = (TAU * i) / childCount;
      const targetX = this.x + this.spread * Math.cos(angle);
      const targetY = this.y + this.spread * Math.sin(angle);
      // spread = 0 marks these as sparks — they won't explode again
      engine.particles.push(new Particle(this.x, this.y, targetX, targetY, this.hue, 0));
    }
  }

  /**
   * Draws this particle onto the canvas.
   *
   * Rockets: each trail point is painted with a lightness that goes from
   * 0 % (black, invisible) at the tail up to ~20 % at the head, giving the
   * streak a natural fade behind the rocket.
   *
   * Sparks: a single bright dot at the current position.
   *
   * @param {CanvasRenderingContext2D} ctx
   */
  _render(ctx) {
    if (this.spread) {
      for (let i = 0; i < this.trail.length; i++) {
        const point = this.trail[i];
        ctx.beginPath();
        ctx.fillStyle = `hsl(${this.hue}, 100%, ${i}%)`;
        ctx.arc(point.x, point.y, 1, 0, TAU);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
      ctx.arc(this.x, this.y, 1, 0, TAU);
      ctx.fill();
    }
  }
}

/**
 * Drives the entire fireworks simulation on a given canvas element.
 *
 * Responsibilities:
 *  - Owns the rAF loop and keeps delta time frame-rate-independent.
 *  - Resizes the canvas to fill the viewport on every window resize.
 *  - Pauses automatically when the browser tab becomes hidden (saves CPU/battery).
 *  - Halves the spawn rate when `prefers-reduced-motion` is active.
 */
export class FireworksEngine {
  /**
   * @param {HTMLCanvasElement} canvas - The canvas to draw onto.
   *   Its `width` and `height` attributes are managed by the engine.
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.particles = [];
    this.spawnTimer = 0;
    this.lastFrameTime = 0;
    this.rafId = null;
    this.isRunning = false;

    // Respect the OS-level motion preference.
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.spawnRate = this.prefersReducedMotion ? 4 : 10;

    // Pre-bind so the same function references can be removed later.
    this._handleResize = this._handleResize.bind(this);
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    this._loop = this._loop.bind(this);

    this._handleResize();
    window.addEventListener('resize', this._handleResize);
    document.addEventListener('visibilitychange', this._handleVisibilityChange);
  }

  /**
   * Syncs the canvas size to the viewport and recalculates the spawn zone.
   * Fireworks launch from a central band at the bottom and burst in the upper half.
   */
  _handleResize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;

    const centerX = this.width / 2;
    this.spawnLeft  = centerX - centerX / 4;
    this.spawnRight = centerX + centerX / 4;

    this.spawnTop    = this.height * 0.1;
    this.spawnBottom = this.height * 0.5;
  }

  /**
   * Pauses when the tab goes into the background; resumes when it comes back.
   * `lastFrameTime` is reset on resume so the first delta is 0 ms, not the
   * full duration the tab was hidden.
   */
  _handleVisibilityChange() {
    if (document.hidden) {
      this._pause();
    } else if (this.isRunning) {
      this._resume();
    }
  }

  /** Begins the animation loop. Calling this more than once is a no-op. */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this._loop);
  }

  /** Suspends the rAF loop without resetting engine state. */
  _pause() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _resume() {
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame(this._loop);
  }

  /**
   * Permanently stops the engine and cleans up its event listeners.
   * Call this before removing the canvas from the DOM.
   */
  destroy() {
    this._pause();
    this.isRunning = false;
    window.removeEventListener('resize', this._handleResize);
    document.removeEventListener('visibilitychange', this._handleVisibilityChange);
  }

  /**
   * Raw rAF callback. Converts the high-res timestamp to a delta in seconds
   * so all physics and timers are frame-rate-independent.
   *
   * @param {DOMHighResTimeStamp} now
   */
  _loop(now) {
    this.rafId = requestAnimationFrame(this._loop);

    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this._update(delta);
  }

  /**
   * One full simulation tick: fades the frame, steps every particle,
   * spawns new rockets on a timer, and prunes dead particles.
   *
   * The frame fade uses `hard-light` compositing with a near-opaque dark fill.
   * Multiplying by `delta` keeps the fade speed consistent across frame rates —
   * at 60 fps (delta ≈ 0.016) the fill opacity is ~0.11 per frame.
   *
   * @param {number} delta - Seconds since the last frame.
   */
  _update(delta) {
    const { ctx, width, height } = this;

    ctx.globalCompositeOperation = 'hard-light';
    ctx.fillStyle = `rgba(7, 7, 10, ${7 * delta})`;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'lighter';
    for (const particle of this.particles) particle.update(delta, ctx, this);

    this.spawnTimer += delta * this.spawnRate;
    if (this.spawnTimer >= 1) {
      this._spawnFirework();
      this.spawnTimer = 0;
    }

    // Filter only when the list is large to avoid allocating a new array every frame.
    if (this.particles.length > 1000) {
      this.particles = this.particles.filter((p) => !p.isDead);
    }
  }

  /**
   * Adds one auto-spawned rocket.
   * Launch x is biased toward the center; burst target x spans the full width
   * so explosions are spread across the sky without rockets flying in from the edges.
   */
  _spawnFirework() {
    this.particles.push(
      new Particle(
        randomInt(this.spawnLeft, this.spawnRight),
        this.height,
        randomInt(0, this.width),
        randomInt(this.spawnTop, this.spawnBottom),
        randomInt(0, 360),
        randomInt(30, 110)
      )
    );
  }

  /**
   * Launches a rocket toward a specific point — called when the visitor
   * clicks or taps the canvas.
   *
   * The rocket always lifts off from the bottom of the viewport directly
   * below the click so it arcs up naturally to the target.
   *
   * @param {number} x - Horizontal target in px from the left edge.
   * @param {number} y - Vertical target in px from the top edge.
   */
  spawnBurstAt(x, y) {
    this.particles.push(
      new Particle(x, this.height, x, y, randomInt(0, 360), randomInt(40, 100))
    );
  }
}
