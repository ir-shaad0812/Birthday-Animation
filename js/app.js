/**
 * @file app.js
 * @description Application entry point. Starts the fireworks engine, wires
 * the name-entry panel, persists the guest's name across visits, and sets up
 * two ambient interactions: a cursor-following glow and click-to-ignite fireworks.
 */

import { FireworksEngine } from './fireworks.js';

// Namespaced key avoids collisions if other apps share the same origin.
const STORAGE_KEY = 'birthday:guest-name';

/** Cached DOM references — queried once at startup, never again. */
const elements = {
  canvas:      document.getElementById('fireworks-canvas'),
  nameHeading: document.getElementById('guest-name'),
  modal:       document.getElementById('name-modal'),
  form:        document.getElementById('name-form'),
  input:       document.getElementById('name-input'),
  cursorGlow:  document.querySelector('.cursor-glow'),
};

// Start the show immediately so the canvas is already alive
// when the visitor sees the name-entry panel.
const engine = new FireworksEngine(elements.canvas);
engine.start();

/**
 * Writes the guest's name into the hero heading.
 * Trimming prevents invisible whitespace-only content from occupying space.
 *
 * @param {string} name
 */
function setGuestName(name) {
  elements.nameHeading.textContent = name.trim();
}

/**
 * Runs the panel's exit animation, then removes it from the DOM.
 *
 * Guarded by `isConnected` so it's safe to call from multiple paths
 * (form submit, Escape key) without double-animating or erroring.
 */
function closeModal() {
  if (!elements.modal.isConnected) return;
  elements.modal.classList.add('is-closing');
  elements.modal.addEventListener('animationend', () => elements.modal.remove(), { once: true });
}

/**
 * Initialises the name-entry panel.
 *
 * On first visit the input is blank. On return visits the saved name is
 * pre-filled so the guest can simply press Enter to continue.
 *
 * Escape closes the panel without saving — the hero name stays empty,
 * which is a valid state (the fireworks still run).
 */
function initNamePanel() {
  const savedName = localStorage.getItem(STORAGE_KEY);
  if (savedName) {
    setGuestName(savedName);
    elements.input.value = savedName;
  }

  // rAF ensures the input is focused after the panel's entrance animation
  // starts — autofocus alone can be ignored by browsers inside dialogs.
  requestAnimationFrame(() => elements.input.focus());

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = elements.input.value;
    if (name.trim()) {
      localStorage.setItem(STORAGE_KEY, name.trim());
    }

    setGuestName(name);
    closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
}

/**
 * Tracks the pointer and updates `--x` / `--y` on the glow element.
 * CSS reads those properties via `translate(var(--x), var(--y))`, so
 * the position update happens in the compositor without triggering layout.
 *
 * Skipped entirely on touch-only devices and when the user prefers reduced motion.
 */
function initCursorGlow() {
  if (!elements.cursorGlow) return;

  const isHoverDevice     = window.matchMedia('(hover: hover)').matches;
  const wantsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isHoverDevice || wantsReducedMotion) return;

  window.addEventListener('pointermove', (event) => {
    elements.cursorGlow.style.setProperty('--x', `${event.clientX}px`);
    elements.cursorGlow.style.setProperty('--y', `${event.clientY}px`);
  });
}

/**
 * Fires a rocket toward the click/tap point.
 *
 * Clicks inside the invite panel are excluded so typing a name doesn't
 * accidentally launch fireworks and obscure the input.
 */
function initClickToIgnite() {
  window.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.invite-panel')) return;
    engine.spawnBurstAt(event.clientX, event.clientY);
  });
}

initNamePanel();
initCursorGlow();
initClickToIgnite();
