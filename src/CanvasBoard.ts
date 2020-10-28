import { action, observable, computed, runInAction } from "mobx"

import { TouchInterface } from "./TouchInterface"
import { UI } from "./UI"
import { Unit } from "./Unit"
import { UnitSprite } from "./UnitSprite"
import { DamageText } from "./DamageText"
import { CELL_WIDTH, CELL_HEIGHT, BOARD_COLS, BOARD_ROWS } from "./settings"
import { ScreenVector } from "./ScreenVector"
import { Cell } from "./Cell"
import { CellSprite } from "./CellSprite"
import { Tickable } from "./TimeReactor"
import { ActiveFloor, FloorEvent } from "./Floor"
import { PointVector } from "./PointVector"
import { EventPlayer } from "./EventPlayer"

export class CanvasBoard implements Tickable {
    ui: UI
    floor: ActiveFloor
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    touch: TouchInterface
    eventPlayer: EventPlayer
    cellSprites: CellSprite[] = []
    unitSprites: UnitSprite[] = []
    damageTexts: DamageText[] = []
    @observable messageEvents: FloorEvent[] = []

    constructor(floor: ActiveFloor, ui: UI, canvas: HTMLCanvasElement) {
        this.floor = floor
        this.ui = ui
        this.canvas = canvas
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.touch = new TouchInterface(this)
        this.eventPlayer = new EventPlayer(this)

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

    @action mlog(event: FloorEvent) {
        this.messageEvents.push(event)
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

    get(model: Cell): CellSprite
    get(model: Unit): UnitSprite
    get(model: Cell | Unit): CellSprite | UnitSprite {
        if (model instanceof Cell) {
            return this.spritesByCell.get(model)!
        } else {// if (model instanceof Unit) {
            return this.spritesByUnit.get(model)!
        }
    }

    cellAt(pos: ScreenVector): Cell {
        const cx = Math.min(this.floor.width - 1, Math.max(0, Math.floor(pos.x / CELL_WIDTH)))
        const cy = Math.min(this.floor.height - 1, Math.max(0, Math.floor(pos.y / CELL_HEIGHT)))
        return this.floor.cellAt(new PointVector(cx, cy))!
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

    frame() {
        this.eventPlayer.playAll()
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

        // Draw danger area where enemies can attack next turn
        ctx.fillStyle = "rgba(255, 48, 48, 0.3)"
        for (const cell of this.floor.enemyAttackableCells) {
            const spos = this.get(cell).pos
            ctx.fillRect(spos.x, spos.y, CELL_WIDTH, CELL_HEIGHT)
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
            sprite.drawHealthPips(ctx)
        }

        touch.draw(ctx)
    }
}