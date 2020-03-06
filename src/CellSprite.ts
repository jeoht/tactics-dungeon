import { UI } from "./UI"
import { Unit, Team } from "./Unit"
import { observable, computed } from "mobx"
import { ScreenVector } from "./ScreenVector"
import { Tileset } from "./Tileset"
import { Cell } from "./Cell"
import { CanvasBoard } from "./CanvasBoard"
import { CELL_WIDTH, CELL_HEIGHT } from "./settings"

export class CellSprite {
    board: CanvasBoard
    cell: Cell

    @computed get width() {
        return CELL_WIDTH
    }

    @computed get height() {
        return CELL_HEIGHT
    }

    /** Position of the upper left corner of the cell in screen coordinates. */
    @computed get pos(): ScreenVector {
        const { cell } = this
        let dx = cell.pos.x * CELL_WIDTH
        let dy = cell.pos.y * CELL_HEIGHT
        return new ScreenVector(dx, dy)
    }

    /** Position of the center of the cell in screen coordinates. */
    @computed get centerPos(): ScreenVector {
        const { x, y } = this.pos
        return new ScreenVector(x + CELL_WIDTH/2, y + CELL_HEIGHT/2)
    }

    constructor(board: CanvasBoard, cell: Cell) {
        this.board = board
        this.cell = cell
    }

    draw(ctx: CanvasRenderingContext2D) {
        const { board, cell, pos } = this
        board.ui.assets.world.drawTile(ctx, cell.tileIndex, pos.x, pos.y, CELL_WIDTH, CELL_HEIGHT)
    }

    fill(ctx: CanvasRenderingContext2D) {
        ctx.fillRect(this.pos.x, this.pos.y, CELL_WIDTH, CELL_HEIGHT)
    }
}   