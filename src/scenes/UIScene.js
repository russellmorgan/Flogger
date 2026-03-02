import Phaser from "phaser";

export class UIScene extends Phaser.Scene {
    constructor() {
        super("UIScene");
    }

    create() {
        this.helpText = this.add.text(12, 8, "Arrows: move  |  R: restart on game over", {
            color: "#f9fafb",
            fontFamily: "monospace",
            fontSize: "16px"
        });

        this.hudText = this.add.text(12, 30, "Score: 0  Lives: 3  Level: 1  Time: 30", {
            color: "#f9fafb",
            fontFamily: "monospace",
            fontSize: "16px"
        });

        this.positionText = this.add.text(12, 52, "Grid: (7, 0)", {
            color: "#f9fafb",
            fontFamily: "monospace",
            fontSize: "16px"
        });

        this.messageText = this.add.text(12, 74, "", {
            color: "#fef08a",
            fontFamily: "monospace",
            fontSize: "16px"
        });

        const gameScene = this.scene.get("GameScene");
        gameScene.events.on("player-moved", this.handlePlayerMoved, this);
        gameScene.events.on("hud-update", this.handleHudUpdate, this);
        gameScene.events.on("status-message", this.handleStatusMessage, this);

        this.handleHudUpdate(gameScene.getHudState());
    }

    handleHudUpdate({ score, lives, level, timerMsRemaining, state }) {
        const timeSeconds = Math.ceil(timerMsRemaining / 1000);
        this.hudText.setText(`Score: ${score}  Lives: ${lives}  Level: ${level}  Time: ${timeSeconds}  State: ${state}`);
    }

    handleStatusMessage(message) {
        this.messageText.setText(`Status: ${message}`);
    }

    handlePlayerMoved({ gridX, gridY }) {
        this.positionText.setText(`Grid: (${gridX}, ${gridY})`);
    }
}
