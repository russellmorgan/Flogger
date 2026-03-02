import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload() {
        this.load.spritesheet("player-frog", "src/img/player_spritesheet.png", {
            frameWidth: 256,
            frameHeight: 256
        });
    }

    create() {
        this.scene.start("GameScene");
        this.scene.start("UIScene");
    }
}
