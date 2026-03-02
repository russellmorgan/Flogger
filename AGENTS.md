# Repository Guidelines

## Project Context
`Flogger` is a Frogger-style clone targeting Phaser 3 with Arcade Physics and lane-based, grid-step gameplay.  
Design and implementation guidance lives in root docs:
- `gdd.md`: gameplay rules, states, systems, and balancing targets.
- `file_structure.md`: intended source/module layout.
- `README.md`: high-level project description.

## Project Structure & Module Organization
Implement code under `src/` using the structure defined in `file_structure.md`:
- `src/main.js`
- `src/scenes/`: `BootScene.js`, `PreloadScene.js`, `GameScene.js`, optional `UIScene.js`
- `src/objects/`: `Player.js`, `Vehicle.js`, `Platform.js`, `GoalSlot.js`
- `src/data/`: lane definitions (for example `lanes.js`)
- `src/utils/`: shared helpers/constants (for example `grid.js`, `constants.js`)

Keep modules focused and single-purpose. Prefer adding new files to one of the existing feature folders over creating ad hoc top-level files.

## Gameplay Architecture Rules
Use `gdd.md` as the source of truth for core behavior:
- Use discrete grid-step movement and lane-driven game logic.
- Keep `GameScene` state-driven (`PLAYING`, `DYING`, `RESPAWNING`, `ROUND_COMPLETE`, `GAME_OVER`).
- Evaluate hazards after movement resolves.
- Keep road/river behaviors data-driven via lane config objects.
- Treat timer, lives, score, goal slots, and level scaling as first-class systems.

If implementation decisions differ from `gdd.md`, update the doc in the same change or explain the deviation in the PR.

## Build, Test, and Development Commands
No build system or test runner is configured yet. Until one is added:
- `dir` (PowerShell): inspect repository contents.
- `git status`: inspect working tree changes.
- `git log --oneline -n 10`: review recent commit history.

When tooling is introduced (for example npm scripts), add exact commands here and in `README.md`.

## Coding Style & Naming Conventions
- Indentation: 4 spaces, no tabs.
- JavaScript naming: `camelCase` for variables/functions, `PascalCase` for classes, and descriptive names.
- File/folder naming: use one lowercase separator style (`kebab-case` or `snake_case`) consistently for non-class files.
- Keep constants and tuning values centralized (for example in `src/utils/constants.js`).

## Testing Guidelines
No framework is configured yet. When tests are added:
- Place tests in `tests/` mirroring `src/` (for example `tests/scenes/`, `tests/objects/`, `tests/utils/`).
- Name tests by behavior (example: `player_dies_when_in_water_without_platform`).
- Prioritize core game rules:
  - grid movement bounds and input handling
  - road collision and river/platform logic
  - goal slot resolution and scoring
  - timer/lives/state transitions

## Commit & Pull Request Guidelines
- Commit messages: short imperative subject (example: `Implement river platform carry`).
- Keep commits focused by system/feature.
- PRs should include:
  - summary of gameplay/system changes
  - tests run (or explicit note if none exist yet)
  - screenshots/GIFs for visual or feel changes
  - linked issue/task when available
