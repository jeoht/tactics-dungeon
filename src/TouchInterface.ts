import _ = require("lodash")
import { action, observable, computed, runInAction } from "mobx"
import { bind } from 'decko'

import { Team, Unit } from "./Unit"
import { ScreenVector } from "./ScreenVector"
import { CanvasBoard } from "./CanvasBoard"
import { CELL_WIDTH, CELL_HEIGHT } from "./settings"
import { Cell } from "./Cell"
import { UnitAction } from "./UnitAction"

/** Just the necessary info to execute a move plan */
export type UnitMovePlan = {
    /** The unit being moved */
    unit: Unit
    /** The current path the unit will follow on plan execution */
    path: Cell[]
    /** Enemy the unit will attack */
    attacking?: Unit
}

/**
 * When a player is dragging a unit around, this holds the state
 */
export class UnitDragState {
    type: 'unitDrag' = 'unitDrag'
    board: CanvasBoard
    unit: Unit
    cursorOffset: ScreenVector
    @observable cursorPos: ScreenVector
    @observable path: Cell[]
    @observable attackingCell?: Cell

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
            attacking: this.attackingCell?.unit
        }
    }

    @computed get finalPathCell(): Cell {
        return this.path[this.path.length - 1] || this.unit.cell
    }

    /** Update our movement plan based on the player's drag cursor */
    @action update(cursorPos: ScreenVector) {
        this.cursorPos = cursorPos
        const { cursorCell, finalPathCell } = this
        const { unit } = this
        const enemyAtCursor = cursorCell.unit && unit.isEnemy(cursorCell.unit) ? cursorCell.unit : undefined

        this.attackingCell = undefined
        if (cursorCell === unit.cell) {
            this.path = []
        } else if (enemyAtCursor) {
            if (unit.canAttackFrom(finalPathCell, enemyAtCursor)) {
                // Current path works fine
                this.attackingCell = cursorCell
                return
            }

            // Try and repath to attack enemy at cursor cell
            const attackPath = unit.getPathToAttackThisTurn(enemyAtCursor)
            if (attackPath) {
                this.path = attackPath
                this.attackingCell = cursorCell
                return
            }
        } else {
            const path = unit.getPathToOccupyThisTurn(cursorCell)
            if (path && cursorCell !== unit.cell) {
                // Standard path to occupy cursor position
                this.path = path
                // this.targetCell = cursorCell
                return
            }
        }


    }
}

export type SelectedUnitState = { type: 'selectedUnit', unit: Unit }
export type TargetAbilityState = { type: 'targetAbility', unit: Unit, ability: 'teleport' }
export type TargetActionState = { type: 'targetAction', unit: Unit, action: UnitAction }

export type TapMoveState = {
    type: 'tapMove'
    plan: UnitMovePlan
}

export class TouchInterface {
    board: CanvasBoard
    maybeDragUnit: Unit | null = null
    @observable state: { type: 'board' } | UnitDragState | SelectedUnitState | TargetActionState | TargetAbilityState | TapMoveState = { type: 'board' }

    constructor(board: CanvasBoard) {
        this.board = board
        board.canvas.addEventListener('mousedown', this.onTouchStart)
        board.canvas.addEventListener('mousemove', this.onTouchMove)
        board.canvas.addEventListener('mouseup', this.onTouchEnd)
        board.canvas.addEventListener('touchstart', this.onTouchStart)
        board.canvas.addEventListener('touchend', this.onTouchEnd)
        board.canvas.addEventListener('touchmove', this.onTouchMove)
    }

    @action gotoBoard() {
        this.state = { type: 'board' }
    }

    get drag(): UnitDragState | null {
        return this.state.type === 'unitDrag' ? this.state : null
    }

    get plan() {
        if (this.drag)
            return this.drag.plan
        else if (this.state.type === 'tapMove')
            return this.state.plan
        else
            return null
    }

    touchToScreenPoint(e: TouchEvent | MouseEvent): ScreenVector {
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

    @computed get canDragNow() {
        return (this.state.type === 'board' || this.state.type === 'selectedUnit')
    }

    @bind onTouchStart(e: TouchEvent | MouseEvent) {
        e.preventDefault()

        const { board, canDragNow } = this
        const cursorPos = this.touchToScreenPoint(e)
        const cell = board.cellAt(cursorPos)

        if (canDragNow && cell.unit && cell.unit.team === Team.Player && !cell.unit.moved)
            this.maybeDragUnit = cell.unit
        else
            this.maybeDragUnit = null
    }

    @bind onTouchMove(e: TouchEvent | MouseEvent) {
        e.preventDefault()

        const { drag, maybeDragUnit, canDragNow } = this
        const cursorPos = this.touchToScreenPoint(e)

        if (drag) {
            drag.update(cursorPos)
        } else if (maybeDragUnit && canDragNow) {
            this.startDragFrom(cursorPos, maybeDragUnit)
            this.maybeDragUnit = null
        }
    }

    @bind onTouchEnd(e: TouchEvent | MouseEvent) {
        e.preventDefault()

        const { drag } = this
        if (!drag) {
            this.maybeDragUnit = null
            this.onTap(e)
            return
        }

        if (drag.plan.path.length || drag.plan.attacking)
            this.executeMovePlan(drag.plan)
        // if (drag.cursorCell === drag.attackingCell)
        this.gotoBoard()
    }

    @bind onTap(e: TouchEvent | MouseEvent) {
        const { board } = this
        const { selectedUnit, state } = this
        const cell = board.cellAt(this.touchToScreenPoint(e))

        if (state.type === 'board') {
            // We can tap on a unit to select it
            if (cell.unit) {
                this.selectUnit(cell.unit)
            }
        } else if (state.type === 'tapMove') {
            const { plan } = state
            const finalPathCell = _.last(plan.path)
            if ((!plan.attacking && cell === finalPathCell) || (cell.unit && cell.unit === plan.attacking)) {
                this.executeMovePlan(plan)
            } else {
                this.tryTapMove(plan.unit, cell)
            }
        } else if (selectedUnit) {
            if (state.type === 'selectedUnit')
                this.tryTapMove(selectedUnit, cell)
            else if (state.type === 'targetAbility') {
                if (state.ability === 'teleport' && selectedUnit.canOccupy(cell)) {
                    runInAction(() => {
                        selectedUnit.inventory = []
                        selectedUnit.teleportTo(cell)
                        this.gotoBoard()
                    })
                }
            } else if (state.type === 'targetAction') {
                runInAction(() => {
                    if (state.action.targetRangeCells.includes(cell)) {
                        state.action.execute(cell)
                    }
                    this.gotoBoard()
                })
            }
        }
    }

    @action startDragFrom(cursorPos: ScreenVector, unit: Unit) {
        this.state = new UnitDragState(this.board, cursorPos, unit)
        this.board.ui.sounds.selectUnit.play()
    }

    @action tryTapMove(unit: Unit, cell: Cell) {
        if (cell.unit) {
            if (unit.playerMove && unit.isEnemy(cell.unit)) {
                const path = unit.getPathToAttackThisTurn(cell.unit)
                if (path) {
                    this.prepareTapMove({
                        unit: unit,
                        path: path,
                        attacking: cell.unit
                    })
                } else {
                    this.selectUnit(cell.unit)
                }
            } else {
                this.selectUnit(cell.unit)
            }
        } else {
            const path = unit.getPathToOccupyThisTurn(cell)
            if (unit.playerMove && path) {
                this.prepareTapMove({
                    unit: unit,
                    path: path
                })
            } else {
                // Tap in a random place, deselect unit
                this.gotoBoard()
            }
        }
    }

    @action executeMovePlan(plan: UnitMovePlan) {
        if (plan.path.length)
            plan.unit.moveAlong(plan.path)

        if (plan.attacking)
            plan.unit.attack(plan.attacking)

        plan.unit.endMove()
        this.gotoBoard()
        this.board.ui.sounds.dropUnit.play()
    }

    draw(ctx: CanvasRenderingContext2D) {
        const { drag, plan, board, state } = this

        if (plan) {
            const sprite = board.get(plan.unit)
            sprite.drawInfoUnderlay(ctx)

            // Draw path the unit will follow
            if (plan.path.length) {
                const startCell = plan.unit.cell
                const { x, y } = board.get(startCell).centerPos
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
                board.ui.assets.creatures.drawTile(ctx, plan.unit.tile.index, pos.x, pos.y, CELL_WIDTH, CELL_HEIGHT)
            } else if (finalPathCell) {
                const pos = board.get(finalPathCell).pos
                board.ui.assets.creatures.drawTile(ctx, plan.unit.tile.index, pos.x, pos.y, CELL_WIDTH, CELL_HEIGHT)
            }
        }

        if (state.type === 'targetAction') {
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
            for (const cell of state.action.targetRangeCells) {
                board.get(cell).fill(ctx)
            }
        }
    }

    @computed get selectedUnit(): Unit | undefined {
        if ('unit' in this.state)
            return this.state.unit
        else
            return undefined
    }

    @action selectUnit(unit: Unit) {
        this.state = { type: 'selectedUnit', unit: unit }
        this.board.ui.sounds.selectUnit.play()
    }

    @action prepareTapMove(plan: UnitMovePlan) {
        this.state = {
            type: 'tapMove',
            plan: plan
        }
    }
}


