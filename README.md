# SprayWorks — Factory Crew

A miniature 3D factory-cleaning and machine-repair strategy puzzle from Hambone Software, built with Babylon.js for static GitHub Pages hosting.

## Gameplay

Command a crew of five miniature specialists in an isometric factory:

- **Pip and Mox (washers):** clean the dirty intake, filter, and exhaust.
- **Tug (hauler):** remove both sludge piles and return waste to the collection bin.
- **Bolt (mechanic):** install the bearing, coupling, and impeller in order.
- **Lux (technician):** restart the repaired pump to win.

Select a worker from the crew bar or tap the 3D character, then tap a highlighted task marker or a work order. Tap a floor tile to move the selected worker. Click **Assign next job** if you want a matching crew member automatically assigned to the next unlocked work order. You can only assign work to a worker with the appropriate specialization.

The workers navigate around the pump with a deterministic A* grid. Cleaning and installation take time, and sludge must physically be carried to the waste bin. Tasks unlock when prerequisites are complete.

## Controls

- Touch: tap a crew member, task, or floor location; use the camera buttons to rotate or zoom.
- Mouse: left-click to command; use the camera buttons, scroll wheel to zoom, or right-button drag to orbit.
- Keyboard: 1 through 5 selects a worker, Space pauses, R restarts.
- Pause, help, mission restart, and camera controls appear on the screen.

## GitHub Pages

Settings → Pages → Build and deployment → **GitHub Actions**.

The workflow installs pinned Babylon.js / esbuild packages, runs simulation tests, bundles the game into a static folder, and deploys it when changes land on the main branch. External runtime CDNs, backend services, user accounts and analytics are not required.

Primary game: https://hambonesoftware.github.io/sprayworks/

Original spray-gun / paddle-wheel experiment: https://hambonesoftware.github.io/sprayworks/legacy.html

These addresses require successful deployment and Pages to be enabled.

## Local development

Requires Node.js 22 or later:

```sh
npm install
npm run check
npm test
npm run build
python3 -m http.server 8080 -d public
```

Open http://localhost:8080 to play. On Windows, if python3 is unavailable, use a local static server to serve the public folder. Browser ES modules do not reliably work directly from file:// URLs.

The build uses @babylonjs/core and esbuild to tree-shake and package the engine and game together. The original Three.js assets remain in vendor/ for the legacy experiment.

## Structure

- index.html / crew.css: touch-first interface and responsive heads-up display.
- factory.js: Babylon.js factory environment, miniature crew, picking, camera, animations, task UI, mission completion.
- crew-logic.js: independent grid navigation, task prerequisites, worker roles, hauling, time simulation.
- crew-logic.test.js: automated pathfinding and end-to-end mission tests.
- scripts/build.mjs: static bundle generation.
- legacy.html / game.js / physics.js / style.css / vendor/three.module.js: preserved first experiment.

## Technical boundaries

This is a playable first prototype, not a fluid solver. Oil residue, cleaning, maintenance interactions and animated characters are stylized approximations. Workers use A* paths over a navigation grid and simple task-state animation; Babylon physics plugins and realistic hydraulic pressure simulation are not included. No paid models or external 3D assets are required. All characters and machinery are procedural.

For performance, keep the render loop efficient and use physics only when introducing loose-parts interactions that justify it. Test visual performance and touch UX on real iPhone and iPad hardware before calling the device experience fully verified.

## Privacy and licenses

The game stores only an optional best completion time in local browser storage. It does not transmit personal data. Clearing site data clears that time.

Babylon.js is licensed under Apache-2.0. The original experiment uses Three.js under the MIT license; see vendor/THREE-LICENSE.txt. Both dependencies are installed or served locally in the deployed site.
