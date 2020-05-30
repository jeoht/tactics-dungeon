import { computed } from "mobx"
import { ScreenVector } from "./ScreenVector"
import { Cell } from "./Cell"
import { CanvasBoard } from "./CanvasBoard"
import { CELL_WIDTH, CELL_HEIGHT } from "./settings"
import { Structure, Furniture } from "./Tile"
import { Block } from "./MapBase"
import { Chest } from "./Chest"

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
        return new ScreenVector(x + CELL_WIDTH / 2, y + CELL_HEIGHT / 2)
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

    blockToTileIndex(block: Block): number | undefined {
        const { biome, random } = this.cell
        const cols = 55

        if (block === Block.Wall)
            return biome * cols + this.wallType
        else if (block === Block.Floor)
            return biome * cols + (random > 0.5 ? Structure.Floor : Structure.FloorIndent)
        else if (block === Block.DownStair)
            return biome * cols + Structure.DownStair
        else if (block === Block.UpStair)
            return biome * cols + Structure.UpStair

        return undefined
    }

    @computed get tiles(): number[] {
        return this.cell.blocks.map(block => this.blockToTileIndex(block)).filter(n => n !== undefined) as number[]
    }

    drawTile(ctx: CanvasRenderingContext2D, tile: number) {
        const { board, pos } = this
        board.ui.assets.world.drawTile(ctx, tile, pos.x, pos.y, CELL_WIDTH, CELL_HEIGHT)
    }

    draw(ctx: CanvasRenderingContext2D) {
        const { board, pos } = this
        for (const tile of this.tiles) {
            this.drawTile(ctx, tile)
        }

        for (const c of this.cell.contents) {
            if (c instanceof Chest) {
                this.drawTile(ctx, c.item ? Furniture.Chest : Furniture.ChestOpen)
            }
        }
    }

    fill(ctx: CanvasRenderingContext2D) {
        ctx.fillRect(this.pos.x, this.pos.y, CELL_WIDTH, CELL_HEIGHT)
    }
}   