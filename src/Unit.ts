import { Cell } from "./Cell"
import { dijkstra } from "./pathfinding"

export class Unit {
    tileIndex: number
    cell: Cell
    moved: boolean = false

    constructor(tileIndex: number, cell: Cell) {
        this.tileIndex = tileIndex
        this.cell = cell
        cell.unit = this
    }

    moveTo(cell: Cell) {
        this.cell.unit = undefined
        cell.unit = this
        this.cell = cell
    }

    canPathThrough(cell: Cell) {
        return cell.pathable && (!cell.unit || cell.unit === this)
    }

    getPathTo(cell: Cell) {
        return dijkstra({
            start: this.cell,
            goal: cell,
            expand: node => node.neighbors().filter(n => this.canPathThrough(n))
        })
    }
}