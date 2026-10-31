# SprayWorks: Machine Rescue

A light RTS inside a giant machine. Command five tiny workers to take out dirty parts, clean them, and rebuild the mechanism. Play: https://hambonesoftware.github.io/sprayworks/

## Pump 07: inside the casing

The level is an open cutaway of one pump, with curved inner walls, oversized threads, cast channels, a giant gasket, an exposed rotor seat and removable components. The old factory-floor stage has been replaced.

1. **Open & remove.** Use an orange mechanic to unbolt the access cover. Extract the filter and rotor. Mechanics carry the parts to service trays inside the casing.
2. **Wash.** Use the two blue sprayers on the removed parts and empty chamber. Mop, the teal vacuum operator, collects the loosened oil.
3. **Refit & test.** Return the clean filter and rotor to their slots. Turn the rotor arrow to match the housing's 90° mark, replace the cover, and test the rebuilt pump.

Tasks show their prerequisites. The job board displays the current phase, and the next-step line explains what to do. The machine cannot be closed with a misaligned rotor or restarted with missing parts. Testing a faulty assembly gives instructions without resetting progress.

## Controls

Tap a worker or crew card, then tap a part, task marker, job-board order, or open floor. Workers find paths and complete their orders. Drag to pan; pinch or scroll to zoom; use the camera buttons to zoom/center. Pause to issue orders without time advancing. Keys 1–5 select crew, Space pauses, S stops, Escape closes task details. Sound is opt-in.

Progress and positions save locally. Returning clears in-flight orders but retains completed work; interrupted part deliveries can be reassigned. Clearing site data removes the save. Use Help → Start a fresh shift to reset.

## Build and deployment

Node 22 recommended. `npm ci`, `npm run check`, `npm test`, then `npm run build`. Serve the generated `public/` folder. The existing GitHub Actions workflow builds and deploys main to GitHub Pages. Legacy spray physics remains at `legacy.html`.

Babylon.js 9.33.1 uses explicit module imports. The production JS bundle is about 1.7 MB before compression. Startup reports real initialization milestones and reveals the start button only after the first frame. No runtime dependency downloads are required except optional Google Fonts (system fallbacks included).

A fully playable Canvas tactical view is provided when the browser cannot initialize WebGL. The main scene is procedural 3D with simplified particles and grime deposits; it does not claim CFD, fluid dynamics, or generated concept-image fidelity. The five workers have three roles: two sprayers, two mechanics, one vacuum operator.

## Source and checks

- `src/simulation.js`: tasks, prerequisites, part delivery, pathfinding, alignment and persistence.
- `src/world.js`: Babylon cutaway machine, removable components, tiny crew and effects.
- `src/tactical.js`: no-WebGL fallback with the same state and controls.
- `src/main.js` and `src/style.css`: touch input, staged job board, HUD and audio cues.
- `factory.js`: current build entry point.

The test suite includes the legacy simulation regressions plus new checks for reachability, dirty-part restrictions, physical delivery phases, full disassembly/reassembly, pause/stop, startup diagnostics, saved work, and Babylon scene construction/render traversal through NullEngine. NullEngine verifies scene logic, not GPU appearance. The available QA browser disables WebGL, so GPU rendering and performance still need device testing.
