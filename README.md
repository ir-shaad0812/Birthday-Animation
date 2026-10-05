# 🎆 Birthday Animation

> An interactive, canvas-based fireworks celebration — personalized, polished, and production-ready.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

---

## Overview

Birthday Animation is a lightweight, zero-dependency interactive experience built entirely with vanilla HTML, CSS, and JavaScript. The visitor enters their name, which appears as a large editorial hero headline while a continuous fireworks show plays behind it on a `<canvas>`. Clicking or tapping anywhere on the page launches an additional firework aimed at the cursor position.

The design follows a 2026 studio aesthetic — dark editorial palette, variable-weight serif typography, IBM Plex Mono UI labels, and a single accent color used with restraint.

---

## Features

| Feature | Detail |
|---|---|
| **Personalized hero** | Guest name persists across visits via `localStorage` |
| **Click-to-ignite** | Every click / tap fires a rocket toward that point |
| **Cursor glow** | Ambient radial gradient tracks the pointer in real time |
| **Tab-aware loop** | Animation pauses when the tab is hidden — saves CPU & battery |
| **Reduced motion** | Spawn rate halved and all CSS animations disabled when the OS preference is set |
| **Responsive** | Fluid type scale with `clamp()`, breakpoints at 768 px and 480 px |
| **Accessible** | `aria-live`, `aria-modal`, `role="dialog"`, `:focus-visible` rings, `.visually-hidden` utility |
| **No build step** | Plain ES modules — open `index.html` in any modern browser |

---

## Tech Stack

- **HTML5** — semantic, accessible markup
- **CSS3** — custom properties (design tokens), `clamp()` fluid type, `backdrop-filter`, `mix-blend-mode`
- **JavaScript (ES2022)** — ES modules, `requestAnimationFrame`, Page Visibility API, `localStorage`
- **Google Fonts** — [Fraunces](https://fonts.google.com/specimen/Fraunces), [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono), [Inter](https://fonts.google.com/specimen/Inter)

No frameworks, no bundlers, no npm.

---

## Project Structure

```
Birthday-Animation/
├── index.html          # Entry point — markup, semantic structure, ARIA
├── css/
│   └── style.css       # Design tokens, layout, components, animations
├── js/
│   ├── fireworks.js    # FireworksEngine class + Particle physics (ES module)
│   └── app.js          # UI wiring, name panel, cursor glow, click-to-ignite
└── README.md
```

### Module responsibilities

**`fireworks.js`**
Owns the entire canvas simulation. Exports a single class `FireworksEngine` that manages the rAF loop, viewport sizing, particle lifecycle, and system-level behaviors (tab visibility, reduced motion). The `Particle` class is private — it is never exported.

**`app.js`**
The application shell. Imports `FireworksEngine`, starts the show, then wires three independent behaviors: the name-entry panel, the cursor-following ambient glow, and the click-to-ignite event listener. Each is isolated in its own `init*` function so they can be understood and modified independently.

**`style.css`**
Organized top-to-bottom: reset → design tokens → base → shared utilities → components → animations → responsive → accessibility overrides. All color, typography, and motion values are defined once as CSS custom properties in `:root`.

---

## Getting Started

No installation or build step required.

```bash
# Clone the repository
git clone https://github.com/ir-shaad0812/Birthday-Animation.git

# Open in your browser
cd Birthday-Animation
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

Or simply drag `index.html` into any modern browser.

> **Note:** The page uses ES modules (`type="module"`), which require a server context in some browsers. If the canvas is blank when opened as a `file://` URL, serve it locally instead:
> ```bash
> npx serve .
> # then open http://localhost:3000
> ```

---

## Usage

1. The fireworks start automatically when the page loads.
2. An invite panel asks for a name — type one and press **Enter** or click **Launch Fireworks**.
3. The name appears in the center of the hero. The panel is dismissed with an exit animation.
4. Click or tap anywhere on the canvas to ignite a firework at that exact point.
5. The name is remembered via `localStorage` — repeat visitors skip directly to the show with their name pre-filled.
6. Press **Escape** at any time to close the panel without entering a name.

---

## Design Decisions

### Typography system

Three complementary typefaces create a clear hierarchy:

- **Fraunces** (variable, optical-size, italic) — display type for the hero name and panel heading. The optical size axis makes it feel hand-set at large sizes.
- **IBM Plex Mono** — all small UI chrome: labels, eyebrows, the CTA button. Uppercase + `0.14em` letter-spacing mirrors the reference "badge" treatment.
- **Inter** — body copy and descriptive text. Neutral, highly legible.

### Color palette

```
--bg:      #07070a   (near-black with a faint blue tint — avoids flat pure black)
--ink:     #f3efe9   (warm off-white — less clinical than pure white on dark)
--accent:  #ff4d1c   (vivid orange-red — used on dots, eyebrows, button, glow only)
```

### Canvas fade technique

Each frame is not cleared — instead a near-opaque dark fill is composited with `hard-light`. This gradually dims previous frames, producing trailing glow without needing to track old positions. The fill opacity is scaled by `delta` time so the fade rate is frame-rate-independent.

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome / Edge 90+ | ✅ Full |
| Firefox 90+ | ✅ Full |
| Safari 15.4+ | ✅ Full (`backdrop-filter` requires this version) |
| Mobile Safari / Chrome Android | ✅ Full (touch events, cursor glow hidden) |

---

## License

[MIT](https://opensource.org/licenses/MIT) — free to use, modify, and distribute.

---

<p align="center">Built with vanilla web standards. No frameworks were harmed. Built by Mohammad Irshaad Aalam</p>

