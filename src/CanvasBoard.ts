import { action, observable, computed, runInAction } from "mobx"

import { TouchInterface } from "./TouchInterface"
import { UI } from "./UI"
import { Unit, Team } from "./Unit"
import { UnitSprite } from "./UnitSprite"
import { DamageText } from "./DamageText"
import { CELL_WIDTH, CELL_HEIGHT, BOARD_COLS, BOARD_ROWS } from "./settings"
import { ScreenVector } from "./ScreenVector"
import { Cell } from "./Cell"
import { CellSprite } from "./CellSprite"
import { Tickable } from "./TimeReactor"
import { Floor, FloorEvent } from "./Floor"
import { PointVector } from "./PointVector"

export class CanvasBoard implements Tickable {
    ui: UI
    floor: Floor
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    touch: TouchInterface
    @observable handledEvents: number = 0
    handlingEvent: boolean = false
    cellSprites: CellSprite[] = []
    unitSprites: UnitSprite[] = []
    damageTexts: DamageText[] = []

    constructor(floor: Floor, ui: UI, canvas: HTMLCanvasElement) {
        this.floor = floor
        this.ui = ui
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.touch = new TouchInterface(this)
        
        for (const cell of this.floor.cells) {
            this.cellSprites.push(new CellSprite(this, cell))
        }

        for (const unit of this.floor.units) {
            this.unitSprites.push(new UnitSprite(this, unit))
        }
    }

    start() {
        window.addEventListener("resize", this.onResize)
        this.onResize()
    }

    stop() {
        window.removeEventListener("resize", this.onResize)
    }

    @computed get drawWidth(): number {
        return BOARD_COLS * CELL_WIDTH
    }

    @computed get drawHeight(): number {
        return BOARD_ROWS * CELL_HEIGHT
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
        const cx = Math.min(this.floor.width-1, Math.max(0, Math.floor(pos.x / CELL_WIDTH)))
        const cy = Math.min(this.floor.height-1, Math.max(0, Math.floor(pos.y / CELL_HEIGHT)))
        return this.floor.cellAt(new PointVector(cx, cy))!
    }

    async handleEvent(event: FloorEvent) {
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
        } else if (event.type === 'startPhase') {
            for (const sprite of this.unitSprites) {
                if (sprite.unit.team === event.team)
                    sprite.moved = false
            }

            if (event.team === Team.Player)
                ui.goto('board')
            else
                ui.goto('enemyPhase')
        } else if (event.type === 'floorCleared') {
            setTimeout(() => ui.goto('floorCleared'), 500)
        }
    }

    @action.bound onResize() {
        const width = this.floor.width * CELL_WIDTH
        const height = this.floor.height * CELL_HEIGHT

        const styleWidth = this.canvas.parentElement!.offsetWidth
        const styleHeight = styleWidth * (this.floor.height / this.floor.width)

        const scale = 3
        this.canvas.width = width * scale
        this.canvas.height = height * scale
        this.canvas.style.minHeight = styleHeight + 'px'
        this.ctx.imageSmoothingEnabled = false
        this.ctx.scale(scale, scale)
    }

    async handleEvents() {
        if (this.handlingEvent || this.handledEvents >= this.floor.eventLog.length) return


        while (this.floor.eventLog.length > this.handledEvents) {
            this.handlingEvent = true

            const event = this.floor.eventLog[this.handledEvents]
            await this.handleEvent(event)
            
            this.handlingEvent = false
            this.handledEvents += 1
        }
    }

    frame() {
        this.handleEvents()
        this.draw()
    }

    draw() {
        const { ctx, touch } = this
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        for (const sprite of this.cellSprites) {
            sprite.draw(ctx)
        }

        if (touch.selectedUnit && touch.state.type === 'targetAbility') {
            ctx.fillStyle = "rgba(51, 153, 255, 0.5)"
            for (const sprite of this.cellSprites) {
                if (!touch.selectedUnit.canOccupy(sprite.cell)) continue
                sprite.fill(ctx)
            }
        }

        if (touch.selectedUnit && touch.state.type === 'selectedUnit') {
            const sprite = this.get(touch.selectedUnit)
            sprite.drawInfoUnderlay(ctx)
        }

        for (const sprite of this.unitSprites) {
            sprite.draw(ctx)
        }
        
        if (touch.selectedUnit) {
            this.get(touch.selectedUnit).drawSelectionIndicator(ctx)
        }

        for (const damageText of this.damageTexts) {
            damageText.draw(ctx)
        }

        for (const sprite of this.unitSprites) {
            sprite.drawHealthBar(ctx)
        }

        touch.draw(ctx)
    }
}