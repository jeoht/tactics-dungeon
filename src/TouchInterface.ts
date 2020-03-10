import _ = require("lodash")
import { action, observable, computed, runInAction } from "mobx"
import { bind } from 'decko'

import { Team, Unit } from "./Unit"
import { ScreenVector } from "./ScreenVector"
import { UI, UnitMovePlan } from "./UI"
import { CanvasBoard } from "./CanvasBoard"
import { CELL_WIDTH, CELL_HEIGHT } from "./settings"
import { Structure } from "./Tile"
import { Cell } from "./Cell"
import { drag } from "d3"


export class UnitDragState {
    type: 'unitDrag' = 'unitDrag'
    board: CanvasBoard
    unit: Unit
    cursorOffset: ScreenVector
    @observable cursorPos: ScreenVector
    @observable path: Cell[]
    @observable targetCell?: Cell
    
    constructor(board: CanvasBoard, cursorPos: ScreenVector, unit: Unit) {
        this.board = board
        this.cursorPos = cursorPos
        this.unit = unit
        this.path = []
        this.cursorOffset = cursorPos.subtract(board.get(this.cursorCell).pos)
    }

    @computed get cursorCell(): Cell {
        return this.board.cellAt(this.cursorPos)
    }

    @computed get plan(): UnitMovePlan {
        return {
            unit: this.unit,
            path: this.path,
            attacking: this.targetCell?.unit
        }
    }

    @computed get finalPathCell(): Cell {
        return this.path[this.path.length-1] || this.unit.cell
    }

    @action update(cursorPos: ScreenVector) {
        this.cursorPos = cursorPos
        const cell = this.cursorCell
        const { unit, finalPathCell } = this
        const enemy = cell.unit && unit.isEnemy(cell.unit) ? cell.unit : undefined

        const path = unit.getPathToOccupyThisTurn(cell)
        if (path) {
            // Standard path to occupy cursor position
            this.path = path
            this.targetCell = cell
            return
        }

        if (!enemy)
            return

        if (unit.canAttackFrom(finalPathCell, enemy)) {
            // Current path works fine
            this.targetCell = cell
            return
        }

        const attackPath = unit.getPathToAttackThisTurn(enemy)
        if (attackPath) {
            // Repath to attack enemy at cursor position
            this.path = attackPath
            this.targetCell = cell
            return
        }
    }
}

export class TouchInterface {
    board: CanvasBoard
    ui: UI
    maybeDragUnit: Unit|null = null

    constructor(board: CanvasBoard) {
        this.board = board
        this.ui = board.ui
        // board.canvas.addEventListener('mousemove', this.onTouchMove)
        // board.canvas.addEventListener('mouseup', this.onTouchEnd)

        board.canvas.addEventListener('touchstart', this.onTouchStart)
        board.canvas.addEventListener('touchend', this.onTouchEnd)
        board.canvas.addEventListener('touchmove', this.onTouchMove)
    }

    get drag(): UnitDragState|null {
        return this.ui.state.type === 'unitDrag' ? this.ui.state : null
    }

    get plan() {
        if (this.drag)
            return this.drag.plan
        else if (this.ui.state.type === 'tapMove')
            return this.ui.state.plan
        else
            return null
    }

    touchToScreenPoint(e: TouchEvent|MouseEvent): ScreenVector {
        let touchX = 0, touchY = 0
        if ('touches' in e && e.touches[0]) {
            touchX = e.touches[0].pageX
            touchY = e.touches[0].pageY
        } else if ('changedTouches' in e && e.changedTouches[0]) {
            touchX = e.changedTouches[0].pageX
            touchY = e.changedTouches[0].pageY
        } else if ('clientX' in e && 'clientY' in e) {
            touchX = e.clientX
            touchY = e.clientY
        }

        const rect = this.board.canvas.getBoundingClientRect()
        const scaleX = rect.width / this.board.drawWidth
        const scaleY = rect.height / this.board.drawHeight
        const x = (touchX - rect.left) / scaleX
        const y = (touchY - rect.top) / scaleY
        return new ScreenVector(x, y)
    }

    @bind onTouchStart(e: TouchEvent) {
        const { board } = this
        const cursorPos = this.touchToScreenPoint(e)
        const cell = board.cellAt(cursorPos)

        if (cell.unit && cell.unit.team === Team.Player && !cell.unit.moved)
            this.maybeDragUnit = cell.unit
        else
            this.maybeDragUnit = null
    }

    @bind onTouchMove(e: TouchEvent|MouseEvent) {
        const { board, ui, drag, maybeDragUnit } = this
        const cursorPos = this.touchToScreenPoint(e)
        const cell = board.cellAt(cursorPos)
        
        if (drag) {
            drag.update(cursorPos)
        } else if (maybeDragUnit && (ui.state.type === 'board' || ui.state.type === 'selectedUnit')) {
            this.startDragFrom(cursorPos, maybeDragUnit)
        }
    }

    @bind onTouchEnd(e: TouchEvent|MouseEvent) {
        const { drag, ui } = this
        if (!drag) {
            this.onTap(e)
            return
        }

        
        if (drag.cursorCell === drag.targetCell)
            this.executeMovePlan(drag.plan)
        ui.goto('board')
    }

    @bind onTap(e: TouchEvent|MouseEvent) {
        const { board } = this
        const { ui } = this.board
        const { selectedUnit, state } = board.ui
        const cell = board.cellAt(this.touchToScreenPoint(e))
        
        if (state.type === 'board') {
            // We can tap on a unit to select it
            if (cell.unit) {
                ui.selectUnit(cell.unit)
            }
        } else if (ui.state.type === 'tapMove') {
            const { plan } = ui.state
            const finalPathCell = _.last(plan.path)
            if ((!plan.attacking && cell === finalPathCell) || (cell.unit && cell.unit === plan.attacking)) {
                this.executeMovePlan(plan)
            } else {
                this.tryTapMove(plan.unit, cell)
            }
        } else if (selectedUnit) {
            this.tryTapMove(selectedUnit, cell)

        } else if (state.type === 'targetAbility') {
            if (state.ability === 'teleport' && state.unit.canOccupy(cell)) {
                runInAction(() => {
                    state.unit.inventory = []
                    state.unit.teleportTo(cell)    
                })
            }
        }
    }

    @action startDragFrom(cursorPos: ScreenVector, unit: Unit) {
        this.ui.state = new UnitDragState(this.board, cursorPos, unit)
    }

    @action tryTapMove(unit: Unit, cell: Cell) {
        const { ui } = this

        if (cell.unit) {
            if (unit.player && unit.isEnemy(cell.unit)) {
                const path = unit.getPathToAttackThisTurn(cell.unit)
                if (path) {
                    ui.prepareTapMove({
                        unit: unit,
                        path: path,
                        attacking: cell.unit
                    })
                } else {
                    ui.selectUnit(cell.unit)
                }
            } else {
                ui.selectUnit(cell.unit)
            }
        } else {
            const path = unit.getPathToOccupyThisTurn(cell)
            if (path) {
                ui.prepareTapMove({
                    unit: unit,
                    path: path
                })
            } else {
                // Tap in a random place, deselect unit
                ui.goto('board')
            }
        }     
    }

    @action executeMovePlan(plan: UnitMovePlan) {
        if (plan.path.length)
            plan.unit.moveAlong(plan.path)

        if (plan.attacking)
            plan.unit.attack(plan.attacking)

        plan.unit.endMove()
        this.ui.goto('board')
    }

    draw(ctx: CanvasRenderingContext2D) {
        const { drag, plan, board } = this

        if (plan) {
            const sprite = board.get(plan.unit)
            sprite.drawInfoUnderlay(ctx)

            // Draw path the unit will follow
            if (plan.path.length) {
                const startCell = plan.unit.cell
                const {x, y} = board.get(startCell).centerPos
                ctx.beginPath()
                ctx.moveTo(x, y)
    
                for (const cell of plan.path) {
                    const spos = board.get(cell).centerPos
                    ctx.lineTo(spos.x, spos.y)
                }
    
                ctx.strokeStyle = "#fff"
                ctx.lineWidth = 5
                ctx.stroke()    
            }

            // If we're about to attack a unit, draw targeting
            if (plan.attacking) {
                ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
                board.get(plan.attacking.cell).fill(ctx)    
            }

            const finalPathCell = _.last(plan.path)
            // Draw the unit at the current cursor position
            if (drag) {
                const pos = drag.cursorPos.subtract(drag.cursorOffset)
                board.ui.assets.creatures.drawTile(ctx, plan.unit.tileIndex, pos.x, pos.y, CELL_WIDTH, CELL_HEIGHT)    
            } else if (finalPathCell) {
                const pos = board.get(finalPathCell).pos
                board.ui.assets.creatures.drawTile(ctx, plan.unit.tileIndex, pos.x, pos.y, CELL_WIDTH, CELL_HEIGHT)    
            }
        }
    }
}


