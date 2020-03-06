import { action, autorun, observable, computed, runInAction } from "mobx"

import { Game } from "./Game"
import { TouchInterface } from "./TouchInterface"
import { World, WorldEvent } from "./World"
import { UI } from "./UI"
import { Unit, Team } from "./Unit"
import { UnitSprite } from "./UnitSprite"
import { DamageText } from "./DamageText"
import { CELL_WIDTH, CELL_HEIGHT } from "./settings"
import { ScreenVector } from "./ScreenVector"
import { Cell } from "./Cell"
import { CellSprite } from "./CellSprite"
import { Tickable } from "./TimeReactor"

export class CanvasBoard implements Tickable {
    ui: UI
    world: World
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    touchInterface: TouchInterface
    @observable handledEvents: number = 0
    handlingEvent: boolean = false
    cellSprites: CellSprite[] = []
    unitSprites: UnitSprite[] = []
    damageTexts: DamageText[] = []

    constructor(game: Game, canvas: HTMLCanvasElement) {
        this.world = game.world
        this.ui = game.ui
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.touchInterface = new TouchInterface(this)
        
        for (const cell of this.world.cells) {
            this.cellSprites.push(new CellSprite(this, cell))
        }

        for (const unit of this.world.units) {
            this.unitSprites.push(new UnitSprite(this, unit))
        }

        window.addEventListener("resize", this.onResize)
        this.onResize()
    }

    @computed get spritesByUnit(): Map<Unit, UnitSprite> {
        const map = new Map()
        for (const obj of this.unitSprites) {
            map.set(obj.unit, obj)
        }
        return map
    }

    @computed get spritesByCell(): Map<Cell, CellSprite> {
        const map = new Map()
        for (const obj of this.cellSprites) {
            map.set(obj.cell, obj)
        }
        return map
    }

    get(model: Cell): CellSprite;
    get(model: Unit): UnitSprite;
    get(model: Cell|Unit): CellSprite|UnitSprite {
        if (model instanceof Cell) {
            return this.spritesByCell.get(model)!
        } else {// if (model instanceof Unit) {
            return this.spritesByUnit.get(model)!
        }
    }
    
    cellAt(pos: ScreenVector): Cell {
        const cx = Math.min(this.world.boardWidth-1, Math.max(0, Math.floor(pos.x / CELL_WIDTH)))
        const cy = Math.min(this.world.boardHeight-1, Math.max(0, Math.floor(pos.y / CELL_HEIGHT)))
        return this.world.grid[cx][cy]
    }

    async handleEvent(event: WorldEvent) {
        const { ui } = this
        if (event.type === 'pathMove') {
            const { unit, fromCell, path } = event
            const sprite = this.get(unit)
            if (unit.team === Team.Player) {
                // Instant move for player
                sprite.pos = this.get(path[path.length - 1]).pos
            } else {
                await sprite.animatePathMove(fromCell, path)
            }
        } else if (event.type === 'teleport') {
            const { unit, toCell } = event
            const sprite = this.get(unit)
            sprite.pos = this.get(toCell).pos
        } else if (event.type === 'attack') {
            const damageText = new DamageText(this, event.damage, this.get(event.target.cell).pos)
            this.damageTexts.push(damageText)
            await this.get(event.unit).attackAnimation(event)
        } else if (event.type === 'defeated') {
            const sprite = this.get(event.unit)
            await sprite.fadeOut()
            this.unitSprites = this.unitSprites.filter(o => o !== sprite)
        } else if (event.type === 'endMove') {
            this.get(event.unit).moved = true

            if (ui.state.type === 'targetAbility' || ui.state.type === 'dragUnit') {
                ui.goto('board')
            }
        } else if (event.type === 'startPhase') {
            for (const sprite of this.unitSprites) {
                if (sprite.unit.team === event.team)
                    sprite.moved = false
            }
        }
    }

    @action.bound onResize() {
        const width = this.world.boardWidth * CELL_WIDTH
        const height = this.world.boardHeight * CELL_HEIGHT

        const styleWidth = this.canvas.offsetWidth
        const styleHeight = styleWidth * (this.world.boardHeight / this.world.boardWidth)

        const scale = window.devicePixelRatio
        this.canvas.width = width * scale
        this.canvas.height = height * scale
        this.canvas.style.minHeight = styleHeight + 'px'
        this.ctx.scale(scale, scale)
    }

    frame() {
        if (this.world.eventLog.length > this.handledEvents && !this.handlingEvent) {
            this.handlingEvent = true
            const event = this.world.eventLog[this.handledEvents]
            this.handleEvent(event).then(() => {
                this.handlingEvent = false
                this.handledEvents += 1
            })
        }

        this.draw()
    }

    draw() {
        const { ctx, touchInterface, ui } = this
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        for (const sprite of this.cellSprites) {
            sprite.draw(ctx)
        }

        if (ui.state.type === 'targetAbility') {
            const { unit } = ui.state
            ctx.fillStyle = "rgba(51, 153, 255, 0.5)"
            for (const sprite of this.cellSprites) {
                if (!unit.canOccupy(sprite.cell)) continue
                sprite.fill(ctx)
            }
        }

        if (ui.state.type === 'selectedUnit') {
            const sprite = this.get(ui.state.unit)
            sprite.drawInfoUnderlay(ctx)
        }

        for (const sprite of this.unitSprites) {
            sprite.draw(ctx)
        }

        if (ui.state.type === 'selectedUnit' || ui.state.type === 'targetAbility') {
            const sprite = this.get(ui.state.unit)
            sprite.drawSelectionIndicator(ctx)
        }

        for (const damageText of this.damageTexts) {
            damageText.draw(ctx)
        }

        for (const sprite of this.unitSprites) {
            sprite.drawHealthBar(ctx)
        }

        touchInterface.draw(ctx)
    }
}