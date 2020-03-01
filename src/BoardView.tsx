import { action, autorun, observable, computed, runInAction } from "mobx"

import { Game } from "./Game"
import { TouchInterface } from "./TouchInterface"
import { World, WorldEvent } from "./World"
import { UIState, FrameInfo } from "./UIState"
import { Unit, Team } from "./Unit"
import { ScreenVector } from "./ScreenVector"
import { Tileset } from "./Tileset"
import { Cell } from "./Cell"


class UnitSprite implements SceneObject {
    ui: UIState
    unit: Unit
    pos: ScreenVector
    tileset: Tileset
    moved: boolean = false
    timestamp: number = 0

    attacking: { 
        startTime: number, 
        startPos: ScreenVector, 
        targetPos: ScreenVector, 
        damage: number,
        resolve: () => void 
    }|null = null

    constructor(ui: UIState, unit: Unit) {
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

    // async animateMove(targetPos: ScreenVector) {
    //     const { ui } = this
    //     const startTime = ui.timestamp
    //     const startPos = this.pos

    //     const duration = 100
    //     while (true) {
    //         const { timestamp } = await ui.nextFrame()
    //         const t = (timestamp-startTime) / duration
    //         this.pos = ScreenVector.lerp(startPos, targetPos, t)

    //         if (t >= 1)
    //             break
    //     }
    // }

    async animatePathMove(fromCell: Cell, path: Cell[]) {
        const { ui } = this
        const startTime = ui.timestamp

        const pathWithStart = [fromCell].concat(path)

        const duration = 100
        while (true) {
            const { timestamp } = await ui.nextFrame()
            const t = Math.min(1, (timestamp-startTime) / duration)
            const progress = t * (pathWithStart.length-1)
            const i = Math.floor(progress)
            const j = Math.ceil(progress)

            const startCell = pathWithStart[i]
            const endCell = pathWithStart[j]
            const frac = progress - Math.floor(progress)

            const startPos = ui.cellToScreenPoint(startCell)
            const endPos = ui.cellToScreenPoint(endCell)
            this.pos = ScreenVector.lerp(startPos, endPos, frac)

            if (t >= 1)
                break
        }
    }

    frame(frameInfo: FrameInfo) {
        this.timestamp = frameInfo.timestamp
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.attacking) {
            this.renderAttacking(ctx)
        }

        const { unit, ui, moved, pos, timestamp } = this
        const altTile = timestamp % 500 >= 250
        const tileIndex = unit.tileIndex + (altTile ? this.tileset.columns : 0)
        const tileset = moved ? ui.assets.grayscaleCreatures : ui.assets.creatures

        tileset.drawTile(ctx, tileIndex, pos.x, pos.y, ui.cellScreenWidth, ui.cellScreenHeight)
    }

    renderAttacking(ctx: CanvasRenderingContext2D) {
        const { attacking, timestamp } = this
        if (!attacking) return

        const { startTime, startPos, targetPos, resolve } = attacking

        const timePassed = timestamp - attacking.startTime
        const bumpDuration = 150
        const t = timePassed / bumpDuration


        // Do the little bump (halfway to target and back again)
        if (t < 0.5) {
            this.pos = ScreenVector.lerp(startPos, targetPos, t)
        } else {
            this.pos = ScreenVector.lerp(targetPos, startPos, t)
        }

        if (t >= 1) {
            // Finished attack animation
            this.attacking = null
            resolve()
            return
        }
    }
}

interface SceneObject {
    frame?: (frameInfo: FrameInfo) => void
    render?: (ctx: CanvasRenderingContext2D) => void
}

class DamageText implements SceneObject {
    scene: CanvasScene
    startPos: ScreenVector
    damage: number
    startTime: number
    timePassed: number = 0
    duration: number = 600
    
    constructor(scene: CanvasScene, damage: number, startPos: ScreenVector) {
        this.scene = scene
        this.damage = damage
        this.startPos = startPos
        this.startTime = scene.ui.timestamp
    }

    frame(frameInfo: FrameInfo) {
        this.timePassed = frameInfo.timestamp - this.startTime

        if (this.timePassed > this.duration) {
            this.scene.remove(this)
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        const { scene, damage, startPos, timePassed } = this
        const bounceDuration: number = 300
        const textInitialPos = startPos.add(new ScreenVector(scene.ui.cellScreenWidth/2, scene.ui.cellScreenHeight/2))
        const textBouncePos = textInitialPos.add(new ScreenVector(0, -5))
        const t = timePassed / bounceDuration

        let textPos = textInitialPos
        if (t < 0.5) {
            textPos = ScreenVector.lerp(textInitialPos, textBouncePos, t/0.5)
        } else {
            textPos = ScreenVector.lerp(textBouncePos, textInitialPos, (t-0.5)/0.5)
        }
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = 'bold 12px sans-serif'
        ctx.fillStyle = "rgba(255, 0, 0, 1)"
        ctx.fillText(damage.toString(), textPos.x, textPos.y)
    }
}

export class CanvasScene {
    ui: UIState
    world: World
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    touchInterface: TouchInterface
    handledEvents: number = 0
    @observable objects: SceneObject[] = []

    constructor(game: Game, canvas: HTMLCanvasElement) {
        this.world = game.world
        this.ui = game.ui
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.touchInterface = new TouchInterface(game.ui, canvas)

        for (const unit of this.world.units) {
            const sprite = new UnitSprite(this.ui, unit)
            this.add(sprite)
        }

        window.addEventListener("resize", this.onResize)
        this.onResize()

        this.world.endPhase(Team.Player)

        autorun(() => {
            if (this.handledEvents < this.world.eventLog.length) {
                runInAction(() => this.handleEvents())
            }
        })
    }

    add(obj: SceneObject) {
        this.objects.push(obj)
    }

    remove(obj: SceneObject) {
        this.objects = this.objects.filter(o => o !== obj)
    }

    async start() {
        while (true) {
            const frameInfo = await this.ui.nextFrame()
            for (const obj of this.objects) {
                if (obj.frame !== undefined)
                    obj.frame(frameInfo)
            }
            this.render()
        }
    }

    @computed get unitSprites(): UnitSprite[] {
        return this.objects.filter(obj => obj instanceof UnitSprite) as UnitSprite[]
    }

    @computed get spritesByUnit(): Map<Unit, UnitSprite> {
        const map = new Map()
        for (const obj of this.unitSprites) {
            map.set(obj.unit, obj)
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
        if (event.type === 'pathMove') {
            const { unit, fromCell, path } = event
            const sprite = this.getSprite(unit)
            if (unit.team === Team.Player) {
                // Instant move for player
                sprite.pos = ui.cellToScreenPoint(path[path.length-1])
            } else {
                await sprite.animatePathMove(fromCell, path)
            }
        } else if (event.type === 'attack') {
            const damageText = new DamageText(this, event.damage, this.ui.cellToScreenPoint(event.target.cell))
            this.add(damageText)
            await this.getSprite(event.unit).attackAnimation(event)
        } else if (event.type === 'endMove') {
            this.getSprite(event.unit).moved = true

            if (ui.state.type === 'unitActionChoice') {
                ui.state = { type: 'board' }
            }
        } else if (event.type === 'startPhase') {
            for (const sprite of this.unitSprites) {
                if (sprite.unit.team === event.team)
                    sprite.moved = false
            }
        }
    }

    @action.bound onResize() {
        const width = this.world.boardWidth * this.ui.cellScreenWidth
        const height = this.world.boardHeight * this.ui.cellScreenHeight

        const styleWidth = this.canvas.offsetWidth
        const styleHeight = styleWidth * (this.world.boardHeight/this.world.boardWidth)

        const scale = window.devicePixelRatio
        this.canvas.width = width*scale
        this.canvas.height = height*scale
        this.canvas.style.minHeight = styleHeight + 'px'
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

        for (const obj of this.objects) {
            if (obj.render !== undefined)
                obj.render(ctx)
        }

        touchInterface.render()

        ctx.restore()
    }
}