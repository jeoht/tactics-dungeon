import { Tileset } from "./Tileset"
import { Game } from "./Game"
import { Cell } from "./Cell"
import { action, computed } from "mobx"
import { TouchInterface } from "./TouchInterface"

export class GameView {
    game: Game
    worldTileset: Tileset
    creaturesTileset: Tileset
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    cellScreenWidth: number = 24
    cellScreenHeight: number = 24
    touchInterface: TouchInterface

    @computed get renderWidth() {
        return this.cellScreenWidth * this.game.boardWidth
    }

    @computed get renderHeight() {
        return this.cellScreenHeight * this.game.boardHeight
    }

    constructor(game: Game, worldTileset: Tileset, creaturesTileset: Tileset) {
        this.game = game
        this.worldTileset = worldTileset
        this.creaturesTileset = creaturesTileset
        this.canvas = document.getElementById("board") as HTMLCanvasElement
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.touchInterface = new TouchInterface(this)

        window.addEventListener("resize", this.onResize)
        this.onResize()
    }

    @action.bound onResize() {
        // const width = this.canvas.offsetWidth
        // const height = width * (this.game.boardHeight/this.game.boardWidth)
        const width = this.game.boardWidth * this.cellScreenWidth
        const height = this.game.boardHeight * this.cellScreenHeight

        const scale = window.devicePixelRatio
        this.canvas.width = width*scale
        this.canvas.height = height*scale
        this.ctx.scale(scale, scale)
    }

    screenPointToCell(sx: number, sy: number): Cell {
        const cx = Math.min(this.game.boardWidth-1, Math.max(0, Math.floor(sx / this.cellScreenWidth)))
        const cy = Math.min(this.game.boardHeight-1, Math.max(0, Math.floor(sy / this.cellScreenHeight)))
        return this.game.grid[cx][cy]
    }

    /** Position of the upper left corner of the cell in screen coordinates. */
    cellToScreenPoint(cell: Cell) {
        let dx = cell.pos.x * this.cellScreenWidth
        let dy = cell.pos.y * this.cellScreenHeight
        return [dx, dy]
    }

    /** Position of the center of the cell in screen coordinates. */
    cellToScreenPointCenter(cell: Cell) {
        const [x, y] = this.cellToScreenPoint(cell)
        return [x + this.cellScreenWidth/2, y + this.cellScreenHeight/2]
    }

    animationHandle: number|null = null
    start() {
        if (this.animationHandle != null)
            cancelAnimationFrame(this.animationHandle)

        let start: number
        const frame = (timestamp: number) => {
            if (!start) start = timestamp
            const timePassed = 100000 +timestamp-start
            this.render()
            this.animationHandle = requestAnimationFrame(frame)
        }
        this.animationHandle = requestAnimationFrame(frame)
    }

    render() {
        const { game, ctx } = this
        ctx.save()
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        for (let x = 0; x < game.boardWidth; x++) {
            for (let y = 0; y < game.boardHeight; y++) {
                const cell = game.grid[x][y]
                const [dx, dy] = this.cellToScreenPoint(cell)
                this.worldTileset.drawTile(ctx, cell.tileIndex, dx, dy, this.cellScreenWidth, this.cellScreenHeight)

                const { unit } = cell
                if (unit) {
                    this.creaturesTileset.drawTile(ctx, unit.tileIndex, dx, dy, this.cellScreenWidth, this.cellScreenHeight)
                }
            }
        }

        this.touchInterface.render()

        ctx.restore()
    }
}