# GAME DESIGN DOCUMENT (Implementation-Oriented)
# Frogger (Classic Arcade) — Target: Phaser 3 (PhaserJS)

> Goal: Provide a build-ready blueprint for implementing a Frogger-style game in Phaser 3.
> This document assumes **Phaser 3** with Arcade Physics and a tile/grid movement model.

---

## 1. High-Level Overview

**Genre:** Arcade action / crossing game  
**Camera:** Fixed single-screen  
**Perspective:** Top-down 2D  
**Primary Objective:** Move the frog from the bottom start area to one of 5 goal slots at the top, avoiding road hazards and water. Fill all goal slots to complete the round.

---

## 2. Core Pillars

- **Grid-step movement**: crisp, discrete jumps
- **Lane logic**: everything is lane-based (vehicles/platforms)
- **Timing pressure**: timer per life
- **Pattern recognition**: consistent yet escalating lane patterns

---

## 3. Screen Layout & Coordinate System

### 3.1 Grid
Use a grid to simplify movement/collisions.

**Recommended grid:**
- `COLS = 14`
- `ROWS = 13`
- `TILE = 48` (or 32; tune for resolution)

**World size:**
- `WIDTH = COLS * TILE`
- `HEIGHT = ROWS * TILE`

### 3.2 Row Definitions (bottom → top)
Define each row as a "lane" with a type:

| Row Index (0 bottom) | Type | Notes |
|---:|---|---|
| 0 | Start Safe | frog spawn |
| 1 | Road Lane | vehicles |
| 2 | Road Lane | vehicles |
| 3 | Road Lane | vehicles |
| 4 | Road Lane | vehicles |
| 5 | Median Safe | safe strip |
| 6 | River Lane | platforms |
| 7 | River Lane | platforms |
| 8 | River Lane | platforms |
| 9 | River Lane | platforms |
| 10 | River Lane | platforms |
| 11 | Goal Row | 5 slots |
| 12 | Top Border | decorative / buffer |

> You can adjust row mapping; keep it lane-driven.

---

## 4. Game States (Phaser Scene + State Machine)

### 4.1 Phaser Scenes
- `BootScene` (load minimal, set configs)
- `PreloadScene` (assets)
- `GameScene` (main gameplay)
- `UIScene` (score/lives/timer overlay; optional separate scene)

### 4.2 GameScene State Machine
**States:**
- `PLAYING`
- `DYING`
- `RESPAWNING`
- `ROUND_COMPLETE`
- `GAME_OVER`

**Transitions:**
- `PLAYING -> DYING` (collision/water/timer)
- `DYING -> RESPAWNING` (if lives remain)
- `RESPAWNING -> PLAYING`
- `PLAYING -> ROUND_COMPLETE` (all goals filled)
- `ROUND_COMPLETE -> PLAYING` (next round)
- `PLAYING -> GAME_OVER` (lives == 0)

---

## 5. Entities & Data Model

### 5.1 Player (Frog)
**Properties**
- `gridX, gridY`
- `sprite: Phaser.GameObjects.Sprite`
- `alive: boolean`
- `isMoving: boolean`
- `moveCooldownMs` (optional)
- `onPlatform: Platform|null`
- `lives`
- `score`
- `timerMsRemaining`

**Movement**
- Discrete step: one tile per key press.
- Interpolate sprite position over a short duration (e.g., 80–120ms) for “jump” feel.
- Movement is blocked if:
  - outside grid bounds
  - in `DYING/RESPAWNING` states
  - `isMoving == true`

### 5.2 Vehicles (Road Hazards)
**Properties**
- `laneRow`
- `speedPxPerSec`
- `direction` (`+1` right, `-1` left)
- `widthTiles` (1–3)
- `sprite(s)` or a single wide sprite
- `hitbox`: Arcade body size tuned to sprite

**Behavior**
- Constant horizontal velocity.
- Wrap-around when offscreen (teleport to opposite side with spacing).

### 5.3 Platforms (River)
**Properties**
- `laneRow`
- `speedPxPerSec`
- `direction`
- `lengthTiles`
- `type`: `LOG` or `TURTLE`
- `submergeCycle` (optional advanced)

**Behavior**
- Constant horizontal velocity.
- Wrap-around like vehicles.
- If player overlaps platform, player becomes `onPlatform` and inherits platform velocity.

### 5.4 Goal Slots
- 5 slots, each has:
  - `filled: boolean`
  - `rect` (grid-aligned area)
  - optional `flyActive: boolean` for bonus

---

## 6. Systems & Mechanics

### 6.1 Input System (Phaser)
Use keyboard cursors:
- `this.input.keyboard.createCursorKeys()`

Movement intent is processed on **justDown** events:
- `Phaser.Input.Keyboard.JustDown(cursors.left)`

### 6.2 Movement System (Grid-Step)
When a move key is pressed:
1. compute target `(gridX + dx, gridY + dy)`
2. validate bounds
3. update score (+10 for upward move only, classic rule)
4. tween sprite to `(targetX * TILE + TILE/2, targetY * TILE + TILE/2)`
5. on tween complete: set `gridX/Y`, `isMoving=false`, then evaluate hazards

> Important: apply hazard evaluation AFTER movement completes.

### 6.3 Timer System
- Timer counts down in `PLAYING`.
- Reset timer on respawn.
- If timer hits 0 -> death.

**Typical values:**
- Round 1: 30s per life (tune)

### 6.4 Road Collision
- Use Arcade overlap between player and vehicle group:
  - `this.physics.add.overlap(player, vehicles, onPlayerHitVehicle)`

On overlap -> `DYING`.

### 6.5 River Rule (Water Kill)
When player is in a river lane row:
- If overlapping **no** platform -> death
- Else attach to overlapped platform

Implementation detail:
- At end of each frame (or after movement):
  - If `isRiverRow(gridY)`:
    - find platform overlapped (use overlap checks or `physics.overlapRect`)
    - if none: die
    - else: `player.onPlatform = thatPlatform`
  - else: `player.onPlatform = null`

### 6.6 Platform Carry (Inherit Velocity)
If `player.onPlatform != null` and state is `PLAYING`:
- Each update: `player.sprite.x += platform.vx * dt`
- Also update `gridX` approximately, OR treat `gridX` as derived and only use world position for collisions while on platform.

**Recommended approach (simple + robust):**
- Maintain **world position** continuously.
- Maintain `gridY` as lane indicator.
- Compute `gridX = Math.round((player.x - TILE/2) / TILE)` only when needed for clamping / goals.

### 6.7 Offscreen Death (Carried Away)
If player is on platform and `player.x < 0` or `> WIDTH` -> death.

### 6.8 Goals
When player reaches goal row:
- Determine which goal slot region the frog is in.
- If slot is empty -> fill slot and score +50 (plus time bonus).
- If slot is already filled or frog is not inside any slot -> death OR reject move (classic usually kills if landing in blocked area; choose one).

**Time bonus:**
- `bonus = Math.floor(timerMsRemaining / 1000) * 10` (tune)
- Add on successful goal.

### 6.9 Round Completion
When all 5 slots are filled:
- score +1000
- increase difficulty
- reset goal slots (or keep filled for a brief celebration, then reset)
- respawn frog

---

## 7. Difficulty Scaling

Define a `level` starting at 1.

Per level:
- multiply lane speeds: `speed *= (1 + level * 0.08)` (tune)
- reduce timer: `timerBaseSec = max(15, 30 - level)`
- optionally introduce:
  - turtle submerging after level 3
  - tighter vehicle spacing

---

## 8. Lane Spawning & Patterns

### 8.1 Lane Config Data
Represent lanes as JSON-like config:

```js
const laneConfigs = [
  // Road lanes
  { row: 1, type: 'ROAD', dir: -1, speed: 120, spawnEveryMs: 900, prefab: 'car', widthTiles: 1 },
  { row: 2, type: 'ROAD', dir: +1, speed: 160, spawnEveryMs: 1200, prefab: 'truck', widthTiles: 2 },
  { row: 3, type: 'ROAD', dir: -1, speed: 200, spawnEveryMs: 800, prefab: 'car', widthTiles: 1 },
  { row: 4, type: 'ROAD', dir: +1, speed: 140, spawnEveryMs: 1000, prefab: 'bulldozer', widthTiles: 2 },

  // River lanes
  { row: 6, type: 'RIVER', dir: +1, speed: 90, spawnEveryMs: 1400, prefab: 'log', lengthTiles: 3 },
  { row: 7, type: 'RIVER', dir: -1, speed: 110, spawnEveryMs: 1600, prefab: 'turtle', lengthTiles: 2 },
  { row: 8, type: 'RIVER', dir: +1, speed: 130, spawnEveryMs: 1200, prefab: 'log', lengthTiles: 4 },
  { row: 9, type: 'RIVER', dir: -1, speed: 100, spawnEveryMs: 1500, prefab: 'log', lengthTiles: 3 },
  { row: 10, type: 'RIVER', dir: +1, speed: 140, spawnEveryMs: 1300, prefab: 'turtle', lengthTiles: 2 },
];