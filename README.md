# SprayWorks — Paddle Power

A browser-based 3D spray physics puzzle from Hambone Software. No build, account, external CDN, or paid service is required. Three.js is vendored with its MIT license.

## Play

1. Select MOVE and drag to reposition the gun left/right and forward/back. Expand Gun position & height for exact sliders. Select AIM and drag to steer without snapping. Fine slows adjustments; Spray lock frees your thumb. The Aim: wheel button aligns a starting shot.
2. Hold SPRAY (or Space) to hit the outer red paddles. Momentum spins the wheel and its ratchet lifts the gate.
3. Once the gate latches open, aim at the orange funnel. Aim: funnel provides a starting alignment.
4. Fill the receiver to 75% before exhausting the supply. JET is easiest for the first attempt.

JET is precise; FAN spreads horizontally; CONE spreads in both axes. Pressure changes flow and launch speed. Free play gives unlimited fluid and opens the gate. View changes the camera. Sound is off until enabled. Restart resets the scene. Keyboard arrows control the selected mode; M selects Move, A selects Aim, Shift slows adjustments, 1/2/3 selects a nozzle, R restarts, and Escape pauses. The page prevents touch scrolling and releases the trigger on focus loss.

## GitHub Pages

Upload the complete contents of this folder to the `main` branch of a public repository, including `.github/workflows/pages.yml` and `vendor/`.

In repository **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. Run **Actions → Deploy SprayWorks to GitHub Pages → Run workflow** if needed. The workflow validates the simulation and publishes only runtime assets. Its deployment result contains the playable address. Relative asset paths support a repository subpath.

## Local development

Serve the folder using an HTTP static server, such as `python3 -m http.server 8080`, then visit `http://localhost:8080`. Opening `index.html` directly from a file manager does not support ES module imports reliably.

Run checks with `node --test physics.test.js` and `node --check game.js`. No npm install is needed.

## Simulation and scope

This first version includes a 3D workbench, pivoting gun, three spray patterns, 300 sampled droplets/second, gravity, swept gate and paddle collisions, momentum-based wheel torque, a lifting gate, funnel collection, visible receiver fill, floor splats, sound, challenge and sandbox modes.

The simulation runs at a fixed 120 Hz with capped frame catch-up. Particles are drawn in one GPU point-cloud draw call and capped at 5,200. Splash particles are visual only; liquid accounting occurs at emission and collection. Tank volume and funnel drainage are approximated. This is a game, not validated CFD. Surface coating, robot recording and a course editor are future features and are not present in this release.

## Verification

Eight automated tests cover closed-gate occlusion, a complete winnable challenge, torque differences between hub and tip, unlimited sandbox supply, exhausted-supply behavior, high-speed gate collision, moving emission origins, and bounded independent gun positions. All passed during development. A deterministic 17-second scripted run filled the receiver with approximately 33% supply remaining.

Browser rendering and touch-device performance remain unverified: the available remote QA browser reported WebGL disabled and could not create a graphics context. Test on a WebGL 2-capable Safari/Chrome/Edge device before considering the visual experience validated.

## Privacy

No analytics or network calls. Only the best remaining-fluid score is stored locally when storage is available. Clearing website data removes it.

## Third-party license

Three.js: see `vendor/THREE-LICENSE.txt`. All game geometry is procedural; no generated concept image is needed to run the game.
