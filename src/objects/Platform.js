import Phaser from "phaser";
import { TILE } from "../utils/constants.js";
import { gridToWorld } from "../utils/grid.js";

export class Platform extends Phaser.GameObjects.Rectangle {
    constructor(scene, gridX, gridY, lengthTiles = 2, color = 0x92400e) {
        const { x, y } = gridToWorld(gridX, gridY);
        super(scene, x, y, TILE * lengthTiles, TILE * 0.65, color);

        this.gridY = gridY;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
    }
}
