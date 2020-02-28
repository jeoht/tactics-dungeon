import { Assets } from "./Assets"
import { computed } from "mobx"
import { World } from "./World"
import { ScreenVector } from "./ScreenVector"
import { Cell } from "./Cell"

export class UIState {
    world: World
    assets: Assets
    cellScreenWidth: number = 24
    cellScreenHeight: number = 24

    constructor(world: World, assets: Assets) {
        this.world = world
        this.assets = assets
    }

    @computed get boardScreenWidth() {
        return this.cellScreenWidth * this.world.boardWidth
    }

    @computed get boardScreenHeight() {
        return this.cellScreenHeight * this.world.boardHeight
    }

    screenPointToCell(pos: ScreenVector): Cell {
        const cx = Math.min(this.world.boardWidth-1, Math.max(0, Math.floor(pos.x / this.cellScreenWidth)))
        const cy = Math.min(this.world.boardHeight-1, Math.max(0, Math.floor(pos.y / this.cellScreenHeight)))
        return this.world.grid[cx][cy]
    }

    /** Position of the upper left corner of the cell in screen coordinates. */
    cellToScreenPoint(cell: Cell): ScreenVector {
        let dx = cell.pos.x * this.cellScreenWidth
        let dy = cell.pos.y * this.cellScreenHeight
        return new ScreenVector(dx, dy)
    }

    /** Position of the center of the cell in screen coordinates. */
    cellToScreenPointCenter(cell: Cell): ScreenVector {
        const { x, y } = this.cellToScreenPoint(cell)
        return new ScreenVector(x + this.cellScreenWidth/2, y + this.cellScreenHeight/2)
    }
}