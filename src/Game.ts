import { GameView } from "./GameView"
import { observable, computed } from "mobx"
import { Cell } from "./Cell"
import { PointVector } from "./PointVector"
import _ = require("lodash")
import { Unit } from "./Unit"

export class Game {
    @observable grid: Cell[][] = []
    boardWidth: number = 6
    boardHeight: number = 8

    @computed get cells(): Cell[] {
        const cells: Cell[] = []
        for (let i = 0 ; i < this.boardWidth; i++) {
            for (let j = 0; j < this.boardHeight; j++) {
                cells.push(this.grid[i][j])
            }
        }
        return cells
    }

    cellAt(pos: PointVector): Cell|undefined {
        if (pos.x < 0 || pos.y < 0 || pos.x >= this.grid.length || pos.y >= this.grid[0].length)
            return undefined
        else
            return this.grid[pos.x][pos.y]
    }

    constructor() {
        for (let x = 0; x < this.boardWidth; x++) {
            this.grid[x] = []
            for (let y = 0; y < this.boardHeight; y++) {
                this.grid[x][y] = new Cell(this, x, y)
            }
        }

        const pathableCells = _.sampleSize(this.cells.filter(c => c.pathable), 2)
        new Unit(3, pathableCells[0])
        new Unit(4, pathableCells[1])
    }
}