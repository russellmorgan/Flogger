import Phaser from "phaser";
import { laneConfigs } from "../data/lanes.js";
import { GoalSlot } from "../objects/GoalSlot.js";
import { Platform } from "../objects/Platform.js";
import { Player } from "../objects/Player.js";
import { Vehicle } from "../objects/Vehicle.js";
import { COLS, GAME_STATE, HEIGHT, LANE_ROWS, ROWS, TILE, WIDTH } from "../utils/constants.js";
import { gridToWorld, inBounds, worldToGrid } from "../utils/grid.js";

export class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");

        this.startLives = 3;
        this.roundBaseTimeMs = 30000;
        this.minRoundTimeMs = 15000;
        this.moveDurationMs = 100;
        this.hazardDensityMultiplier = 0.6;
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.resetKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        this.initializeRunState();

        this.drawLaneBackground();
        this.createGroups();
        this.createPlayer();
        this.createGoalSlots();
        this.setupCollisionHandlers();
        this.setupLevel();

        this.emitHud();
        this.events.emit("status-message", "Reach all 5 goals. Avoid roads and water.");
    }

    update(_time, delta) {
        this.processLaneSpawns(delta);
        this.updateLaneMovement(this.vehicles, delta);
        this.updateLaneMovement(this.platforms, delta);

        if (this.gameState === GAME_STATE.GAME_OVER) {
            if (Phaser.Input.Keyboard.JustDown(this.resetKey)) {
                this.scene.restart();
            }
            return;
        }

        if (this.gameState !== GAME_STATE.PLAYING) {
            return;
        }

        this.updateTimer(delta);
        this.applyPlatformCarry(delta);
        this.evaluateRiverOccupancy();

        if (this.player.isMoving) {
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.tryMovePlayer(-1, 0);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.tryMovePlayer(1, 0);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.tryMovePlayer(0, 1);
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.tryMovePlayer(0, -1);
        }
    }

    createGroups() {
        this.vehicles = this.physics.add.group({ allowGravity: false, immovable: true });
        this.platforms = this.physics.add.group({ allowGravity: false, immovable: true });
    }

    createPlayer() {
        this.player = new Player(this, Math.floor(COLS / 2), 0);
    }

    createGoalSlots() {
        this.goalSlots = [];
        const goalY = LANE_ROWS.GOAL;
        const positions = [1, 4, 7, 10, 13].map((colOneBased) => colOneBased - 1);

        positions.forEach((gridX) => {
            const slot = new GoalSlot(this, gridX, goalY);
            slot.setDepth(20);
            this.goalSlots.push(slot);
        });
    }

    setupCollisionHandlers() {
        this.physics.add.overlap(this.player, this.vehicles, () => {
            if (this.gameState === GAME_STATE.PLAYING && !this.player.isMoving) {
                this.handlePlayerDeath("Hit by vehicle");
            }
        });
    }

    setupLevel() {
        this.levelSpeedMultiplier = 1 + (this.level - 1) * 0.08;
        this.spawnCadenceMultiplier = Math.max(0.6, 1 - (this.level - 1) * 0.05);
        this.timerBaseMs = Math.max(this.minRoundTimeMs, this.roundBaseTimeMs - (this.level - 1) * 1000);
        this.timerMsRemaining = this.timerBaseMs;

        this.vehicles.clear(true, true);
        this.platforms.clear(true, true);
        this.buildLaneSystems();
        this.placePlayerAtStart();
        this.playerOnPlatform = null;
    }

    buildLaneSystems() {
        this.laneSystems = laneConfigs.map((lane) => {
            const speed = lane.speed * this.levelSpeedMultiplier;
            const spawnEveryMs = Math.max(
                350,
                (lane.spawnEveryMs * this.spawnCadenceMultiplier) / this.hazardDensityMultiplier
            );
            const widthTiles = lane.type === "ROAD" ? (lane.widthTiles ?? 1) : (lane.lengthTiles ?? 2);
            const spacing = Math.max(TILE * (widthTiles + 1.5), speed * (spawnEveryMs / 1000));
            const offsetMs = ((lane.row * 173) % 1000) / 1000 * spawnEveryMs;

            const laneSystem = {
                lane,
                speed,
                spawnEveryMs,
                spacing,
                timeUntilSpawnMs: offsetMs
            };

            this.seedLane(laneSystem);
            return laneSystem;
        });
    }

    seedLane(laneSystem) {
        const margin = TILE * 2;
        const phase = ((laneSystem.lane.row * 89) % 1000) / 1000 * laneSystem.spacing;

        if (laneSystem.lane.dir > 0) {
            for (let x = -margin + phase; x < WIDTH + margin; x += laneSystem.spacing) {
                this.spawnLaneEntity(laneSystem, x);
            }
            return;
        }

        for (let x = WIDTH + margin - phase; x > -margin; x -= laneSystem.spacing) {
            this.spawnLaneEntity(laneSystem, x);
        }
    }

    processLaneSpawns(delta) {
        if (!this.laneSystems) {
            return;
        }

        this.laneSystems.forEach((laneSystem) => {
            laneSystem.timeUntilSpawnMs -= delta;

            while (laneSystem.timeUntilSpawnMs <= 0) {
                const spawnX = laneSystem.lane.dir > 0
                    ? -(TILE * 2 + (laneSystem.lane.widthTiles ?? laneSystem.lane.lengthTiles ?? 1) * TILE)
                    : WIDTH + TILE * 2 + (laneSystem.lane.widthTiles ?? laneSystem.lane.lengthTiles ?? 1) * TILE;

                this.spawnLaneEntity(laneSystem, spawnX);
                laneSystem.timeUntilSpawnMs += laneSystem.spawnEveryMs;
            }
        });
    }

    spawnLaneEntity(laneSystem, worldX) {
        const gridX = (worldX - TILE / 2) / TILE;
        const { lane, speed } = laneSystem;

        if (lane.type === "ROAD") {
            const color = lane.widthTiles > 1 ? 0xdc2626 : 0xf97316;
            const vehicle = new Vehicle(this, gridX, lane.row, lane.widthTiles ?? 1, color);
            vehicle.vx = speed * lane.dir;
            vehicle.setDepth(10);
            this.vehicles.add(vehicle);
            return;
        }

        const color = lane.prefab === "turtle" ? 0x166534 : 0x92400e;
        const platform = new Platform(this, gridX, lane.row, lane.lengthTiles ?? 2, color);
        platform.vx = speed * lane.dir;
        platform.setDepth(10);
        this.platforms.add(platform);
    }

    tryMovePlayer(dx, dy) {
        if (this.gameState !== GAME_STATE.PLAYING || this.player.isMoving) {
            return;
        }

        const targetX = this.player.gridX + dx;
        const targetY = this.player.gridY + dy;

        if (!inBounds(targetX, targetY)) {
            return;
        }

        if (dy > 0) {
            this.score += 10;
        }

        this.playerOnPlatform = null;
        this.player.isMoving = true;
        this.player.onMoveStart(dx, dy);

        const destination = gridToWorld(targetX, targetY);
        this.tweens.add({
            targets: this.player,
            x: destination.x,
            y: destination.y,
            duration: this.moveDurationMs,
            ease: "Quad.Out",
            onComplete: () => {
                this.player.gridX = targetX;
                this.player.gridY = targetY;
                this.player.isMoving = false;
                this.player.onMoveEnd();

                this.evaluatePlayerPosition();
                this.emitHud();
                this.events.emit("player-moved", { gridX: this.player.gridX, gridY: this.player.gridY });
            }
        });
    }

    evaluatePlayerPosition() {
        if (this.gameState !== GAME_STATE.PLAYING) {
            return;
        }

        if (this.player.gridY === LANE_ROWS.GOAL) {
            this.resolveGoalRow();
            return;
        }

        if (LANE_ROWS.RIVER.includes(this.player.gridY)) {
            const platform = this.findOverlappingEntity(this.platforms);
            if (!platform) {
                this.handlePlayerDeath("Fell into water");
                return;
            }

            this.playerOnPlatform = platform;
        } else {
            this.playerOnPlatform = null;
        }

        const vehicle = this.findOverlappingEntity(this.vehicles);
        if (vehicle) {
            this.handlePlayerDeath("Hit by vehicle");
        }
    }

    evaluateRiverOccupancy() {
        if (this.gameState !== GAME_STATE.PLAYING || this.player.isMoving) {
            return;
        }

        if (!LANE_ROWS.RIVER.includes(this.player.gridY)) {
            this.playerOnPlatform = null;
            return;
        }

        const platform = this.findOverlappingEntity(this.platforms);
        if (!platform) {
            this.handlePlayerDeath("Fell into water");
            return;
        }

        this.playerOnPlatform = platform;
    }

    applyPlatformCarry(delta) {
        if (this.gameState !== GAME_STATE.PLAYING || this.player.isMoving || !this.playerOnPlatform) {
            return;
        }

        const deltaSec = delta / 1000;
        this.player.x += this.playerOnPlatform.vx * deltaSec;

        if (this.player.x < 0 || this.player.x > WIDTH) {
            this.handlePlayerDeath("Swept offscreen");
            return;
        }

        const { gridX } = worldToGrid(this.player.x, this.player.y);
        this.player.gridX = Phaser.Math.Clamp(gridX, 0, COLS - 1);
    }

    resolveGoalRow() {
        const hitGoal = this.goalSlots.find((slot) =>
            Phaser.Geom.Rectangle.Contains(slot.getBounds(), this.player.x, this.player.y)
        );

        if (!hitGoal || hitGoal.filled) {
            this.handlePlayerDeath("Invalid goal slot");
            return;
        }

        hitGoal.setFilled();
        const timeBonus = Math.floor(this.timerMsRemaining / 1000) * 10;
        this.score += 50 + timeBonus;
        this.events.emit("status-message", `Goal filled! +${50 + timeBonus} points`);

        if (this.goalSlots.every((slot) => slot.filled)) {
            this.completeRound();
            return;
        }

        this.respawnPlayer(true);
    }

    completeRound() {
        this.gameState = GAME_STATE.ROUND_COMPLETE;
        this.score += 1000;
        this.emitHud();
        this.events.emit("status-message", "Round complete! Next level...");

        this.time.delayedCall(1000, () => {
            this.level += 1;

            this.goalSlots.forEach((slot) => {
                slot.filled = false;
                slot.setFillStyle(0x1f2937);
            });

            this.setupLevel();
            this.gameState = GAME_STATE.PLAYING;
            this.emitHud();
            this.events.emit("status-message", `Level ${this.level} started`);
        });
    }

    handlePlayerDeath(reason) {
        if (this.gameState !== GAME_STATE.PLAYING) {
            return;
        }

        this.gameState = GAME_STATE.DYING;
        this.playerOnPlatform = null;
        this.lives -= 1;
        this.player.clearTint();
        this.player.playDeathAnimation(this.getDeathAnimationType(reason));
        this.events.emit("status-message", reason);
        this.emitHud();

        if (this.lives <= 0) {
            this.time.delayedCall(600, () => {
                this.gameState = GAME_STATE.GAME_OVER;
                this.events.emit("status-message", "Game over. Press R to restart.");
                this.emitHud();
            });
            return;
        }

        this.time.delayedCall(600, () => this.respawnPlayer(true));
    }

    respawnPlayer(resetTimer) {
        this.gameState = GAME_STATE.RESPAWNING;
        this.playerOnPlatform = null;
        this.placePlayerAtStart();
        if (resetTimer) {
            this.timerMsRemaining = this.timerBaseMs;
        }
        this.player.clearTint();
        this.player.onMoveEnd();

        this.time.delayedCall(250, () => {
            this.gameState = GAME_STATE.PLAYING;
            this.emitHud();
        });
    }

    placePlayerAtStart() {
        const startX = Math.floor(COLS / 2);
        const startY = 0;
        const destination = gridToWorld(startX, startY);

        this.player.x = destination.x;
        this.player.y = destination.y;
        this.player.gridX = startX;
        this.player.gridY = startY;
        this.player.isMoving = false;
    }

    updateLaneMovement(group, delta) {
        const deltaSec = delta / 1000;
        const entities = [...group.getChildren()];
        entities.forEach((entity) => {
            entity.x += entity.vx * deltaSec;
            this.cleanupOffscreenEntity(entity);
        });
    }

    cleanupOffscreenEntity(entity) {
        const halfWidth = entity.width / 2;
        const margin = TILE * 2;
        let shouldDestroy = false;

        if (entity.vx > 0) {
            shouldDestroy = entity.x - halfWidth > WIDTH + margin;
        } else if (entity.vx < 0) {
            shouldDestroy = entity.x + halfWidth < -margin;
        }

        if (!shouldDestroy) {
            return;
        }

        if (this.playerOnPlatform === entity) {
            this.playerOnPlatform = null;
        }

        entity.destroy();
    }

    findOverlappingEntity(group) {
        const playerBounds = this.player.getBounds();
        const entities = group.getChildren();

        for (let i = 0; i < entities.length; i += 1) {
            const entity = entities[i];
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, entity.getBounds())) {
                return entity;
            }
        }

        return null;
    }

    updateTimer(delta) {
        this.timerMsRemaining = Math.max(0, this.timerMsRemaining - delta);
        if (this.timerMsRemaining <= 0) {
            this.handlePlayerDeath("Out of time");
            return;
        }
        this.emitHud();
    }

    initializeRunState() {
        this.gameState = GAME_STATE.PLAYING;
        this.level = 1;
        this.score = 0;
        this.lives = this.startLives;
        this.levelSpeedMultiplier = 1;
        this.spawnCadenceMultiplier = 1;
        this.timerBaseMs = this.roundBaseTimeMs;
        this.timerMsRemaining = this.timerBaseMs;
        this.playerOnPlatform = null;
        this.laneSystems = [];
    }

    getDeathAnimationType(reason) {
        if (reason === "Fell into water" || reason === "Swept offscreen") {
            return "water";
        }

        return "road";
    }

    getHudState() {
        return {
            score: this.score,
            lives: this.lives,
            level: this.level,
            timerMsRemaining: this.timerMsRemaining,
            state: this.gameState
        };
    }

    emitHud() {
        this.events.emit("hud-update", this.getHudState());
    }

    drawLaneBackground() {
        for (let gridY = 0; gridY < ROWS; gridY += 1) {
            const rowTop = HEIGHT - (gridY + 1) * TILE;
            const rowCenterY = rowTop + TILE / 2;
            const color = this.getRowColor(gridY);
            this.add.rectangle(WIDTH / 2, rowCenterY, WIDTH, TILE, color).setOrigin(0.5);
        }
    }

    getRowColor(row) {
        if (row === 0 || row === 5) {
            return 0x14532d;
        }

        if (row === LANE_ROWS.GOAL || row === 12) {
            return 0x0f172a;
        }

        if (LANE_ROWS.ROAD.includes(row)) {
            return 0x374151;
        }

        if (LANE_ROWS.RIVER.includes(row)) {
            return 0x1d4ed8;
        }

        return 0x111827;
    }
}
