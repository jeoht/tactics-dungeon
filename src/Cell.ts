import { PointVector } from "./PointVector"
import { Game } from "./Game"
import { Board } from "./Board"
import { Unit } from "./Unit"
import * as PIXI from 'pixi.js'

export class Cell {
    board: Board
    pos: PointVector
    tileIndex: number
    unit?: Unit
    sprite: PIXI.Sprite

    constructor(board: Board, x: number, y: number) {
        this.board = board
        this.pos = new PointVector(x, y)
        this.tileIndex = Math.random() > 0.9 ? 0 : 3
        this.sprite = new PIXI.Sprite(this.board.game.worldTileset.tile(this.tileIndex))
        this.sprite.x = this.board.cellScreenWidth * x
        this.sprite.y = this.board.cellScreenHeight * y
    }

    get pathable() {
        return this.tileIndex !== 0
    }

    get spriteCenterPos() {
        const { worldTileset } = this.board.game
        return new PIXI.Point(this.sprite.x + worldTileset.tileWidth/2, this.sprite.y + worldTileset.tileHeight/2)
    }

    neighbors(): Cell[] {
        const neighbors = []
        for (const n of this.pos.neighbors()) {
            const cell = this.board.cellAt(n)
            if (cell) {
                neighbors.push(cell)
            }
        }
        return neighbors
    }

    isAdjacentTo(otherCell: Cell) {
        return this.pos.manhattanDistance(otherCell.pos) === 1
    }
}
