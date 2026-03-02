import Phaser from "phaser";
import { TILE } from "../utils/constants.js";
import { gridToWorld } from "../utils/grid.js";

export class GoalSlot extends Phaser.GameObjects.Rectangle {
    constructor(scene, gridX, gridY) {
        const { x, y } = gridToWorld(gridX, gridY);
        super(scene, x, y, TILE * 0.8, TILE * 0.8, 0x1f2937);

        this.filled = false;

        scene.add.existing(this);
    }

    setFilled() {
        this.filled = true;
        this.setFillStyle(0x22c55e);
    }
}
