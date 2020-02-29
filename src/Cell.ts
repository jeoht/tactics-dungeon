import { observable } from "mobx"

import { PointVector } from "./PointVector"
import { Unit } from "./Unit"
import { World } from "./World"

export class Cell {
    world: World
    pos: PointVector
    tileIndex: number
    @observable unit?: Unit

    constructor(world: World, x: number, y: number) {
        this.world = world
        this.pos = new PointVector(x, y)
        this.tileIndex = Math.random() > 0.9 ? 0 : 3
    }

    get pathable() {
        return this.tileIndex !== 0
    }

    neighbors(): Cell[] {
        const neighbors = []
        for (const n of this.pos.neighbors()) {
            const cell = this.world.cellAt(n)
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