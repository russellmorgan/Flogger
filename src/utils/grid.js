import { COLS, HEIGHT, ROWS, TILE } from "./constants.js";

export function worldToGrid(x, y) {
    return {
        gridX: Math.round((x - TILE / 2) / TILE),
        gridY: ROWS - 1 - Math.round((y - TILE / 2) / TILE)
    };
}

export function gridToWorld(gridX, gridY) {
    return {
        x: gridX * TILE + TILE / 2,
        y: HEIGHT - (gridY * TILE + TILE / 2)
    };
}

export function inBounds(gridX, gridY) {
    return gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS;
}
