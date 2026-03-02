import Phaser from "phaser";
import { HEIGHT, WIDTH } from "./utils/constants.js";
import { BootScene } from "./scenes/BootScene.js";
import { PreloadScene } from "./scenes/PreloadScene.js";
import { GameScene } from "./scenes/GameScene.js";
import { UIScene } from "./scenes/UIScene.js";

const config = {
    type: Phaser.AUTO,
    parent: "app",
    width: WIDTH,
    height: HEIGHT,
    pixelArt: true,
    backgroundColor: "#111827",
    physics: {
        default: "arcade",
        arcade: {
            debug: false
        }
    },
    scene: [BootScene, PreloadScene, GameScene, UIScene]
};

new Phaser.Game(config);
