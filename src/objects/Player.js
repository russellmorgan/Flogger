import Phaser from "phaser";
import { TILE } from "../utils/constants.js";
import { gridToWorld } from "../utils/grid.js";

export class Player extends Phaser.GameObjects.Rectangle {
    constructor(scene, gridX, gridY) {
        const { x, y } = gridToWorld(gridX, gridY);
        super(scene, x, y, TILE * 0.66, TILE * 0.66, 0x22c55e);

        this.gridX = gridX;
        this.gridY = gridY;
        this.isMoving = false;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setCollideWorldBounds(true);
    }
}
