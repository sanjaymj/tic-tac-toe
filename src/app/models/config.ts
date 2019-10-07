export enum Player {
    NONE = 0,
    ONE = 1,
    TWO = 2
}

export enum GameState {
    DORMANT = 0,
    START = 1,
    PLAYING = 2,
    PLAYER_ONE_WINS = 3,
    PLAYER_TWO_WINS = 4,
    DRAW = 5
}

export class Cell {
    id?: string;
    index?: number;
    occupiedBy ?: Player;
    playerIndication?: String;
}

export enum DBState {
    DEFAULT = 0,
    EMPTY = 1,
    FILLED = 2,
    INVALID = 3
}

export class NextPlayer {
    id?: string;
    playerTurn?: Player
}