import { action, computed } from "mobx"

import { Game } from "./Game"
import { Cell } from "./Cell"
import { TouchInterface } from "./TouchInterface"
import { Assets } from "./Assets"
import { ScreenVector } from "./ScreenVector"
import { World } from "./World"
import { UIState } from "./UIState"

export class BoardView {
    ui: UIState
    world: World
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    touchInterface: TouchInterface

    constructor(game: Game, canvas: HTMLCanvasElement) {
        this.world = game.world
        this.ui = game.ui
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.touchInterface = new TouchInterface(game.ui, canvas)

        window.addEventListener("resize", this.onResize)
        this.onResize()
    }

    @action.bound onResize() {
        // const width = this.canvas.offsetWidth
        // const height = width * (this.game.boardHeight/this.game.boardWidth)
        const width = this.world.boardWidth * this.ui.cellScreenWidth
        const height = this.world.boardHeight * this.ui.cellScreenHeight

        const scale = window.devicePixelRatio
        this.canvas.width = width*scale
        this.canvas.height = height*scale
        this.ctx.scale(scale, scale)
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

    stop() {
        if (this.animationHandle !== null)
            cancelAnimationFrame(this.animationHandle)
    }

    render() {
        const { world, ctx, touchInterface, ui } = this
        ctx.save()
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        for (let x = 0; x < world.boardWidth; x++) {
            for (let y = 0; y < world.boardHeight; y++) {
                const cell = world.grid[x][y]
                const spos = ui.cellToScreenPoint(cell)
                ui.assets.world.drawTile(ctx, cell.tileIndex, spos.x, spos.y, ui.cellScreenWidth, ui.cellScreenHeight)

                const { unit } = cell
                if (unit && unit != touchInterface.drag?.unit) {
                    const tileset = unit.moved ? ui.assets.grayscaleCreatures : ui.assets.creatures
                    tileset.drawTile(ctx, unit.tileIndex, spos.x, spos.y, ui.cellScreenWidth, ui.cellScreenHeight)
                }
            }
        }

        touchInterface.render()

        ctx.restore()
    }
}