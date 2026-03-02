import Phaser from "phaser";
import { TILE } from "../utils/constants.js";
import { gridToWorld } from "../utils/grid.js";

export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, gridX, gridY) {
        const { x, y } = gridToWorld(gridX, gridY);
        super(scene, x, y, "player-frog", 0);

        this.gridX = gridX;
        this.gridY = gridY;
        this.isMoving = false;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale((TILE * 0.8) / 256);
        this.setOrigin(0.5, 0.5);
        this.setDepth(30);

        this.body.setAllowGravity(false);
        this.body.setCollideWorldBounds(true);
        this.body.setSize(this.displayWidth * 0.55, this.displayHeight * 0.55, true);

        this.createAnimations(scene);
        this.play("frog-idle");
    }

    createAnimations(scene) {
        if (!scene.anims.exists("frog-idle")) {
            scene.anims.create({
                key: "frog-idle",
                frames: scene.anims.generateFrameNumbers("player-frog", { frames: [32, 33, 34, 35, 36, 37] }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!scene.anims.exists("frog-hop-up")) {
            scene.anims.create({
                key: "frog-hop-up",
                frames: scene.anims.generateFrameNumbers("player-frog", { frames: [2, 3, 4, 5] }),
                frameRate: 18,
                repeat: 0
            });
        }

        if (!scene.anims.exists("frog-hop-down")) {
            scene.anims.create({
                key: "frog-hop-down",
                frames: scene.anims.generateFrameNumbers("player-frog", { frames: [10, 11, 12, 13] }),
                frameRate: 18,
                repeat: 0
            });
        }

        if (!scene.anims.exists("frog-hop-left")) {
            scene.anims.create({
                key: "frog-hop-left",
                frames: scene.anims.generateFrameNumbers("player-frog", { frames: [16, 17, 18, 19, 20, 21] }),
                frameRate: 20,
                repeat: 0
            });
        }

        if (!scene.anims.exists("frog-hop-right")) {
            scene.anims.create({
                key: "frog-hop-right",
                frames: scene.anims.generateFrameNumbers("player-frog", { frames: [24, 25, 26, 27, 28, 29] }),
                frameRate: 20,
                repeat: 0
            });
        }

        if (!scene.anims.exists("frog-death-water")) {
            scene.anims.create({
                key: "frog-death-water",
                frames: scene.anims.generateFrameNumbers("player-frog", { frames: [40, 41, 42, 43, 44, 45] }),
                frameRate: 10,
                repeat: 0
            });
        }

        if (!scene.anims.exists("frog-death-road")) {
            scene.anims.create({
                key: "frog-death-road",
                frames: scene.anims.generateFrameNumbers("player-frog", { frames: [48, 49, 50, 51, 52, 53] }),
                frameRate: 10,
                repeat: 0
            });
        }
    }

    getHopAnimationKey(dx, dy) {
        if (dy > 0) {
            return "frog-hop-up";
        }

        if (dy < 0) {
            return "frog-hop-down";
        }

        if (dx < 0) {
            return "frog-hop-left";
        }

        return "frog-hop-right";
    }

    onMoveStart(dx, dy) {
        this.play(this.getHopAnimationKey(dx, dy), true);
    }

    onMoveEnd() {
        this.setRotation(0);
        this.setFlip(false, false);
        this.play("frog-idle", true);
    }

    playDeathAnimation(type) {
        const key = type === "water" ? "frog-death-water" : "frog-death-road";
        this.play(key, true);
    }
}
