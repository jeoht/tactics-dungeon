import { action, autorun, observable, computed } from "mobx"

import { Game } from "./Game"
import { TouchInterface } from "./TouchInterface"
import { World, WorldEvent } from "./World"
import { UIState, FrameInfo } from "./UIState"
import { Unit } from "./Unit"
import { ScreenVector } from "./ScreenVector"
import { Tileset } from "./Tileset"


class UnitSprite {
    ctx: CanvasRenderingContext2D
    ui: UIState
    unit: Unit
    pos: ScreenVector
    tileset: Tileset
    moved: boolean = false

    attacking: { 
        startTime: number, 
        startPos: ScreenVector, 
        targetPos: ScreenVector, 
        damage: number,
        resolve: () => void 
    }|null = null

    constructor(ctx: CanvasRenderingContext2D, ui: UIState, unit: Unit) {
        this.ctx = ctx
        this.ui = ui
        this.unit = unit
        this.pos = ui.cellToScreenPoint(unit.cell)
        this.tileset = ui.assets.creatures
    }

    async attackAnimation(event: { target: Unit, damage: number }) {
        return new Promise((resolve, reject) => {
            this.attacking = {
                startTime: this.ui.timestamp,
                startPos: this.pos,
                targetPos: this.ui.cellToScreenPoint(event.target.cell),
                damage: event.damage,
                resolve: resolve
            }    
        })
    }

    render(ctx: CanvasRenderingContext2D, frameInfo: FrameInfo) {
        if (this.attacking) {
            this.renderAttacking(ctx, frameInfo)
        }

        const { unit, ui, moved, pos } = this
        const altTile = frameInfo.timestamp % 500 >= 250
        const tileIndex = unit.tileIndex + (altTile ? this.tileset.columns : 0)
        const tileset = moved ? ui.assets.grayscaleCreatures : ui.assets.creatures

        tileset.drawTile(ctx, tileIndex, pos.x, pos.y, ui.cellScreenWidth, ui.cellScreenHeight)
    }

    renderAttacking(ctx: CanvasRenderingContext2D, frameInfo: FrameInfo) {
        const { attacking } = this
        if (!attacking) return

        const { startTime, startPos, targetPos, resolve } = attacking

        const timePassed = frameInfo.timestamp - attacking.startTime
        const bumpDuration = 100
        const t = timePassed / bumpDuration


        // Do the little bump (halfway to target and back again)
        if (t < 0.5) {
            this.pos = ScreenVector.lerp(startPos, targetPos, t)
        } else {
            this.pos = ScreenVector.lerp(targetPos, startPos, t)
        }

        const damageTextDuration = 500

        const t2 = timePassed / damageTextDuration
    
        if (t2 >= 1) {
            // Finished attack animation
            this.attacking = null
            resolve()
            return
        }

        // Show damage text
        const { ui } = this
        const textInitialPos = targetPos.add(new ScreenVector(ui.cellScreenWidth/2, ui.cellScreenHeight/2))
        const textBouncePos = textInitialPos.add(new ScreenVector(0, -5))
        let textPos = textInitialPos
        if (t2 < 0.5) {
            textPos = ScreenVector.lerp(textInitialPos, textBouncePos, t2/0.5)
        } else {
            textPos = ScreenVector.lerp(textBouncePos, textInitialPos, (t2-0.5)/0.5)
        }
        ctx.fillStyle = "rgba(255, 0, 0, 1)"
        ctx.fillText(attacking.damage.toString(), textPos.x, textPos.y)
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
            this.renderUnits.push(new UnitSprite(this.ctx, this.ui, unit))
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
            this.render(frameInfo)
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
            this.getSprite(event.unit).moved = true
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

    render(frameInfo: FrameInfo) {
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
        for (const sprite of this.renderUnits) {
            sprite.render(ctx, frameInfo)
        }

        touchInterface.render()

        ctx.restore()
    }
}