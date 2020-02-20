import { PointVector } from "./PointVector"
import { Game } from "./Game"
import { Unit } from "./Unit"

export class Cell {
    game: Game
    pos: PointVector
    tileIndex: number
    unit?: Unit

    constructor(game: Game, x: number, y: number) {
        this.game = game
        this.pos = new PointVector(x, y)
        this.tileIndex = Math.random() > 0.9 ? 0 : 3
    }

    get pathable() {
        return this.tileIndex !== 0
    }

    neighbors(): Cell[] {
        const neighbors = []
        for (const n of this.pos.neighbors()) {
            const cell = this.game.cellAt(n)
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