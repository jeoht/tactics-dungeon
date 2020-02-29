import { action, autorun, observable, computed } from "mobx"

import { Game } from "./Game"
import { TouchInterface } from "./TouchInterface"
import { World, WorldEvent } from "./World"
import { UIState, FrameInfo } from "./UIState"
import { Unit } from "./Unit"
import { ScreenVector } from "./ScreenVector"
import { Tileset } from "./Tileset"


class UnitSprite {
    ui: UIState
    unit: Unit
    pos: ScreenVector
    tileIndex: number
    tileset: Tileset

    constructor(ui: UIState, unit: Unit) {
        this.ui = ui
        this.unit = unit
        this.pos = ui.cellToScreenPoint(unit.cell)
        this.tileIndex = unit.tileIndex
        this.tileset = ui.assets.creatures
    }

    async attackAnimation(event: { target: Unit }) {
        const startPos = this.pos
        const targetPos = this.ui.cellToScreenPoint(event.target.cell)

        const animTime = 100
        let timePassed = 0
        while (timePassed < animTime) {
            const { deltaTime } = await this.ui.nextFrame()
            if (timePassed < animTime/2) {
                this.pos = ScreenVector.lerp(startPos, targetPos, timePassed/animTime)
            } else {
                this.pos = ScreenVector.lerp(targetPos, startPos, timePassed/animTime)
            }
            timePassed += deltaTime
        }
    }

    frame(frameInfo: FrameInfo) {
        const { unit, ui } = this
        const altTile = frameInfo.timestamp % 500 >= 250
        const tileIndex = unit.tileIndex + (altTile ? this.tileset.columns : 0)
        this.tileIndex = tileIndex
    }
}

export class BoardView {
    ui: UIState
    world: World
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    touchInterface: TouchInterface
    @observable renderUnits: UnitSprite[] = []
    handledEvents: number = 0

    constructor(game: Game, canvas: HTMLCanvasElement) {
        this.world = game.world
        this.ui = game.ui
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.touchInterface = new TouchInterface(game.ui, canvas)

        for (const unit of this.world.units) {
            this.renderUnits.push(new UnitSprite(this.ui, unit))
        }

        window.addEventListener("resize", this.onResize)
        this.onResize()

        autorun(() => {
            if (this.handledEvents < this.world.eventLog.length) {
                this.handleEvents()
            }
        })
    }

    async start() {
        while (true) {
            const frameInfo = await this.ui.nextFrame()
            for (const sprite of this.renderUnits) {
                sprite.frame(frameInfo)
            }
            this.render()
        }
    }

    @computed get spritesByUnit(): Map<Unit, UnitSprite> {
        const map = new Map()
        for (const sprite of this.renderUnits) {
            map.set(sprite.unit, sprite)
        }
        return map
    }

    getSprite(unit: Unit): UnitSprite {
        return this.spritesByUnit.get(unit)!
    }

    async handleEvents() {
        while (this.handledEvents < this.world.eventLog.length) {
            const event = this.world.eventLog[this.handledEvents]
            await this.handleEvent(event)
            this.handledEvents += 1
        }
    }

    async handleEvent(event: WorldEvent) {
        const { ui } = this
        if (event.type === 'move') {
            const { unit, to } = event
            this.getSprite(unit).pos = ui.cellToScreenPoint(to)
        } else if (event.type === 'attack') {
            await this.getSprite(event.unit).attackAnimation(event)
        } else if (event.type === 'endMove') {
            this.getSprite(event.unit).tileset = ui.assets.grayscaleCreatures
        }
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

    render() {
        const { world, ctx, touchInterface, ui } = this
        ctx.save()
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        for (let x = 0; x < world.boardWidth; x++) {
            for (let y = 0; y < world.boardHeight; y++) {
                const cell = world.grid[x][y]
                const spos = ui.cellToScreenPoint(cell)
                ui.assets.world.drawTile(ctx, cell.tileIndex, spos.x, spos.y, ui.cellScreenWidth, ui.cellScreenHeight)
            }
        }

        for (const unit of this.renderUnits) {
            unit.tileset.drawTile(ctx, unit.tileIndex, unit.pos.x, unit.pos.y, ui.cellScreenWidth, ui.cellScreenHeight)
        }

        touchInterface.render()

        ctx.restore()
    }
}