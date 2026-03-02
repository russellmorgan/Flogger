import Phaser from "phaser";
import playerSpritesheetUrl from "../img/player_spritesheet.png";

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload() {
        this.load.spritesheet("player-frog", playerSpritesheetUrl, {
            frameWidth: 256,
            frameHeight: 256
        });
    }

    create() {
        this.scene.start("GameScene");
        this.scene.start("UIScene");
    }
}
