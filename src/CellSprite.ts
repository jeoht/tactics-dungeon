import { computed } from "mobx"
import { ScreenVector } from "./ScreenVector"
import { Cell } from "./Cell"
import { CanvasBoard } from "./CanvasBoard"
import { CELL_WIDTH, CELL_HEIGHT } from "./settings"
import { Structure, Pattern } from "./Tile"

export class CellSprite {
    board: CanvasBoard
    cell: Cell

    constructor(board: CanvasBoard, cell: Cell) {
        this.board = board
        this.cell = cell
    }

    @computed get width() {
        return CELL_WIDTH
    }

    @computed get height() {
        return CELL_HEIGHT
    }

    @computed get tileIndex() {
        const { pattern, biome, def, random } = this.cell

        const cols = 38
        if (typeof def[1] === 'number')
            return def[1]
        if (pattern === Pattern.Floor)
            return biome*cols + (random > 0.5 ? Structure.Floor : Structure.FloorIndent)
        else if (pattern === Pattern.Wall)
            return biome*cols + this.wallType
        else
            return -1
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

    /** 
     * Determine what kind of wall this is based on its neighbors
     **/
    @computed get wallType(): Structure {
        // Find whether our neighbors are walls
        const north = this.cell.north && this.cell.north.isWall
        const east = this.cell.east && this.cell.east.isWall
        const south = this.cell.south && this.cell.south.isWall
        const west = this.cell.west && this.cell.west.isWall

        if (north && east && south && west) {
            return Structure.WallIntersection
        } else if (north && east && south) {
            return Structure.WallNorthEastSouth
        } else if (north && east && west) {
            return Structure.WallNorthEastWest
        } else if (north && south && west) {
            return Structure.WallNorthSouthWest
        } else if (east && south && west) {
            return Structure.WallEastSouthWest
        } else if (north && east) {
            return Structure.WallNorthEast
        } else if (north && west) {
            return Structure.WallNorthWest
        } else if (north && south) {
            return Structure.WallNorthSouth
        } else if (east && south) {
            return Structure.WallEastSouth
        } else if (east && west) {
            return Structure.WallEastWest
        } else if (south && west) {
            return Structure.WallSouthWest
        } else if (north) {
            return Structure.WallNorth
        } else if (east) {
            return Structure.WallEast
        } else if (south) {
            return Structure.WallSouth
        } else if (west) {
            return Structure.WallWest
        } else {
            return Structure.Wall
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const { board, cell, pos } = this
        board.ui.assets.world.drawTile(ctx, this.tileIndex, pos.x, pos.y, CELL_WIDTH, CELL_HEIGHT)
    }

    fill(ctx: CanvasRenderingContext2D) {
        ctx.fillRect(this.pos.x, this.pos.y, CELL_WIDTH, CELL_HEIGHT)
    }
}   