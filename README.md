# Ping Pong

A small browser-based Pong game built with HTML, CSS, and vanilla JavaScript. The game is drawn on an HTML canvas and can be served as a Progressive Web App (PWA) from a local web server or a compatible static host.

## Features

- Canvas-based table, paddles, ball, score, and hit effects.
- Left paddle controlled by the built-in AI; right paddle controlled by the player.
- Adjustable ball base speed with four options: 4, 6, 8, and 10.
- Paddle-hit physics that use impact position, incoming vertical momentum, and paddle movement.
- Pause and resume controls.
- Keyboard, mouse, and touch input for the player paddle.
- Portrait-mode reminder on mobile devices to rotate to landscape.
- Web app manifest, icons, and a service worker for caching when hosted in a supported context.

## Requirements

- A modern browser with HTML canvas and JavaScript support.
- Python 3 for the simple local server instructions below, or another static HTTP server.
- No package manager, build step, or third-party JavaScript dependencies are required.

## Run Locally

Service workers require a secure context. `localhost` is treated as secure by modern browsers, so use a local HTTP server rather than opening `index.html` directly when testing PWA behavior.

In PowerShell, open the project directory and start Python's built-in server:

```powershell
py -m http.server 8000
```

If the `py` launcher is unavailable but Python is installed, use:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000> in a browser. Stop the server with `Ctrl+C` in the PowerShell window.

## Controls

| Input | Action |
| --- | --- |
| Move the mouse over the right half of the game | Position the player paddle |
| Arrow Up / Arrow Down | Move the player paddle up or down |
| Touch the right half of the game on a touchscreen | Move the player paddle toward the touch position |
| Pause | Pause the game loop |
| Play | Resume a paused game |
| Slower / Faster | Select the next lower or higher base-speed setting |

The left paddle is AI-controlled. The on-canvas score labels identify the AI and Player sides. The game currently has no match-ending score target; play continues until it is paused or the page is closed.

## Ball Speed and Collision Model

The speed control selects a base speed of 4, 6, 8, or 10 canvas pixels per animation frame. Changing the setting immediately changes the ball's speed while preserving its current direction. The selected base speed is also used when the ball is reset after a point.

A paddle collision changes the ball's velocity using three factors:

1. The ball's vertical offset from the paddle center changes the outgoing vertical direction.
2. Some of the ball's incoming vertical velocity is retained.
3. Paddle vertical movement contributes to the outgoing vertical velocity, so a moving paddle can add or subtract momentum.

The resulting ball speed is capped at 16 pixels per animation frame. This is a lightweight, game-oriented physics model rather than a full simulation of table-tennis spin, restitution, or real-world units. Movement is currently updated once per animation frame, not scaled by elapsed time, so gameplay speed may vary with display frame rate.

## Mobile Behavior

On mobile or touch-first devices, the game displays a landscape-orientation reminder while the viewport is portrait. The reminder does not rotate or lock the device; the game remains responsive to the viewport, and the player paddle can be controlled by touching the right half of the canvas.

## Project Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, game canvas, controls, orientation reminder, and service-worker registration. |
| `styles.css` | Page styling, responsive canvas sizing, controls, and the mobile orientation overlay. |
| `pong.js` | Game state, input handling, AI movement, collision and scoring logic, drawing, speed controls, and animation loop. |
| `manifest.json` | PWA name, display settings, colors, start URL, and icon declarations. |
| `service-worker.js` | Install-time asset caching and cache-first fetch handling. |
| `real_paddle_left.png` | Image asset used to draw the left paddle. |
| `real_paddle_right.png` | Image asset used to draw the right paddle. |
| `icon-192.png` | 192 × 192 PWA icon. |
| `icon-512.png` | 512 × 512 PWA icon. |

## Implementation Notes

- The canvas uses an internal coordinate space of 800 × 500 pixels; CSS scales it to fit the available width.
- The game loop uses `requestAnimationFrame` and stores gameplay data in the `state` object in `pong.js`.
- The service worker uses a cache-first strategy and the cache name `pong-cache-v1`.
- The service worker's cache entries use root-relative URLs (for example, `/index.html`). Host the project at the web server root for those entries to resolve as written. If deploying under a URL subdirectory, update the service-worker paths and cache version accordingly.
- There is no automated test or build command configured in this repository. To check changes, serve the project locally and test controls, scoring, responsive layout, and PWA behavior in a browser.
