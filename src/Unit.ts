import { Cell } from "./Cell"
import { dijkstra, dijkstraRange } from "./pathfinding"

enum Gender {
    Boy,
    Girl,
    Soft,
    Powerful,
    Mystery
}

export class Unit {
    tileIndex: number
    cell: Cell
    moveRange: number = 3
    moved: boolean = false
    gender: Gender = Gender.Mystery

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

    findCellsInMoveRange() {
        return dijkstraRange({
            start: this.cell,
            range: this.moveRange,
            expand: node => node.neighbors().filter(n => this.canPathThrough(n))
        })
    }
}