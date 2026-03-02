import Phaser from "phaser";
import { TILE } from "../utils/constants.js";
import { gridToWorld } from "../utils/grid.js";

export class Vehicle extends Phaser.GameObjects.Rectangle {
    constructor(scene, gridX, gridY, widthTiles = 1, color = 0xef4444) {
        const { x, y } = gridToWorld(gridX, gridY);
        super(scene, x, y, TILE * widthTiles, TILE * 0.7, color);

        this.gridY = gridY;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
    }
}
