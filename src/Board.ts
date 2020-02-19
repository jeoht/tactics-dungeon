import { computed } from "mobx"
import { PointVector } from "./PointVector"
import { Cell } from "./Cell"
import { Unit } from "./Unit"
import _ = require("lodash")
import { Game } from "./Game"

export class Board {
    game: Game
    cells: Cell[][] = []
    width: number = 6
    height: number = 8

    get cellScreenWidth() {
        return 24
    }

    get cellScreenHeight() {
        return 24
    }

    @computed get allCells(): Cell[] {
        const cells: Cell[] = []
        for (let i = 0 ; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                cells.push(this.cells[i][j])
            }
        }
        return cells
    }

    @computed get units() {
        const units = []
        for (const cell of this.allCells) {
            if (cell.unit)
                units.push(cell.unit)
        }
        return units
    }

    cellAt(pos: PointVector): Cell|undefined {
        const col = this.cells[pos.x]
        if (!col) return undefined
        return col[pos.y]
    }

    screenPointToCell(sx: number, sy: number): Cell {
        const cx = Math.min(this.width-1, Math.max(0, Math.floor(sx / this.cellScreenWidth)))
        const cy = Math.min(this.height-1, Math.max(0, Math.floor(sy / this.cellScreenHeight)))
        return this.cells[cx][cy]
    }

    constructor(game: Game) {
        this.game = game
        
        for (let x = 0; x < this.width; x++) {
            this.cells[x] = []
            for (let y = 0; y < this.height; y++) {
                this.cells[x][y] = new Cell(this, x, y)
            }
        }

        const pathableCells = _.sampleSize(this.allCells.filter(c => c.pathable), 2)
        new Unit(this.game, 3, pathableCells[0])
        new Unit(this.game, 4, pathableCells[1])
    }
}