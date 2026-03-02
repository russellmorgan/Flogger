export const COLS = 14;
export const ROWS = 13;
export const TILE = 48;

export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;

export const ROW_TYPES = {
    START_SAFE: "START_SAFE",
    ROAD: "ROAD",
    MEDIAN_SAFE: "MEDIAN_SAFE",
    RIVER: "RIVER",
    GOAL: "GOAL",
    TOP_BORDER: "TOP_BORDER"
};

export const LANE_ROWS = {
    ROAD: [1, 2, 3, 4],
    RIVER: [6, 7, 8, 9, 10],
    GOAL: 11
};

export const GAME_STATE = {
    PLAYING: "PLAYING",
    DYING: "DYING",
    RESPAWNING: "RESPAWNING",
    ROUND_COMPLETE: "ROUND_COMPLETE",
    GAME_OVER: "GAME_OVER"
};
