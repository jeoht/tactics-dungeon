import _ = require("lodash")
import { action, observable, computed, runInAction } from "mobx"
import { bind } from 'decko'

import { Team, Unit } from "./Unit"
import { ScreenVector } from "./ScreenVector"
import { UI, DragState, UnitMovePlan } from "./UI"
import { CanvasBoard } from "./CanvasBoard"
import { CELL_WIDTH, CELL_HEIGHT } from "./settings"
import { Structure } from "./Tile"
import { Cell } from "./Cell"


export class TouchInterface {
    board: CanvasBoard
    ui: UI

    constructor(board: CanvasBoard) {
        this.board = board
        this.ui = board.ui
        // board.canvas.addEventListener('mousemove', this.onTouchMove)
        // board.canvas.addEventListener('mouseup', this.onTouchEnd)

        board.canvas.addEventListener('touchstart', this.onTouchStart)
        board.canvas.addEventListener('touchend', this.onTouchEnd)
        board.canvas.addEventListener('touchmove', this.onTouchMove)
    }

    get drag(): DragState|null {
        return this.ui.state.type === 'dragUnit' ? this.ui.state : null
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
        // const touch = e.touches[0]
        // const cursorPos = this.touchToScreenPoint(touch)
        // const cell = this.ui.screenPointToCell(cursorPos)

    }

    @bind onTouchMove(e: TouchEvent|MouseEvent) {
        const { board, ui } = this
        const cursorPos = this.touchToScreenPoint(e)
        const cell = board.cellAt(cursorPos)
        
        if (ui.state.type === 'board') {
            if (cell.unit && cell.unit.team === Team.Player && !cell.unit.moved) {
                const cursorOffset = cursorPos.subtract(board.get(cell).pos)
                runInAction(() => {
                    if (cell.unit)
                        ui.state = {
                            type: 'dragUnit', 
                            plan: {
                                unit: cell.unit,
                                path: []
                            },
                            cursorPos: cursorPos, 
                            cursorCell: cell,
                            cursorOffset: cursorOffset
                        }    
                })
            }
        } else if (ui.state.type === 'dragUnit') {
            runInAction(() => {
                const {drag} = this
                if (drag) {
                    drag.cursorPos = cursorPos
                    drag.cursorCell = cell
                    drag.cursorEnemy = cell.unit && drag.plan.unit.isEnemy(cell.unit) ? cell.unit : undefined
                    if (drag.plan.unit.reachableUnoccupiedCells.includes(cell)) {
                        drag.plan.path = drag.plan.unit.getPathToOccupyThisTurn(cell)!
                    } else if (drag.cursorEnemy) {
                        const finalPathCell = drag.plan.path[drag.plan.path.length-1]
                        if (!finalPathCell || !drag.plan.unit.canAttackFrom(finalPathCell, drag.cursorEnemy)) {
                            const path = drag.plan.unit.getPathToAttackThisTurn(drag.cursorEnemy)
                            if (path)
                                drag.plan.path = path
                        }
                    }
                }    
            })
        }

    }

    @bind onTouchEnd(e: TouchEvent|MouseEvent) {
        const { drag } = this
        if (!drag) {
            this.onTap(e)
            return
        }

        let finalPathCell = _.last(drag.plan.path)
        if (!finalPathCell && drag.cursorEnemy && drag.plan.unit.canAttackFromHere(drag.cursorEnemy)) {
            // We're not moving at all, just attacking from current position
            finalPathCell = drag.plan.unit.cell
        }

        const attackingEnemy = finalPathCell && drag.cursorEnemy && drag.plan.unit.canAttackFrom(finalPathCell, drag.cursorEnemy)

        // Only move if we're going directly to the cursor cell, or
        // if we're going adjacent to attack the cursor cell
        if (finalPathCell && (finalPathCell === drag.cursorCell || attackingEnemy)) {
            this.executeMovePlan(drag.plan)
        } else {
            this.ui.goto('board')
        }
    }

    @bind onTap(e: TouchEvent|MouseEvent) {
        console.log("tap!")
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
            if (cell === finalPathCell || cell.unit === plan.attacking) {
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
            const finalPathCell = _.last(plan.path)
            if (drag && drag.cursorEnemy && finalPathCell && plan.unit.canAttackFrom(finalPathCell, drag.cursorEnemy)) {
                const enemy = drag.cursorEnemy
                ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
                board.get(enemy.cell).fill(ctx)    
            }

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


