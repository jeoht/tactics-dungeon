import _ = require("lodash")
import { action, observable, computed, runInAction } from "mobx"
import { bind } from 'decko'

import { Team, Unit } from "./Unit"
import { ScreenVector } from "./ScreenVector"
import { UI, DragState } from "./UI"
import { CanvasBoard } from "./CanvasBoard"
import { CELL_WIDTH, CELL_HEIGHT } from "./settings"
import { Structure } from "./Tile"


export class TouchInterface {
    board: CanvasBoard
    ui: UI

    constructor(board: CanvasBoard) {
        this.board = board
        this.ui = board.ui
        board.canvas.addEventListener('mousemove', this.onTouchMove)
        board.canvas.addEventListener('mouseup', this.onTouchEnd)

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
        const { board } = this
        const cursorPos = this.touchToScreenPoint(e)
        const cell = board.cellAt(cursorPos)
        
        if (this.ui.state.type === 'board') {
            if (cell.unit && cell.unit.team === Team.Player && !cell.unit.moved) {
                const cursorOffset = cursorPos.subtract(board.get(cell).pos)
                runInAction(() => {
                    if (cell.unit)
                        this.ui.state = {
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
        } else if (this.ui.state.type === 'dragUnit') {
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
            if (drag.plan.path.length)
                drag.plan.unit.moveAlong(drag.plan.path)

            if (attackingEnemy) {
                drag.plan.unit.attack(drag.cursorEnemy!)
                this.ui.goto('board')
            }

            drag.plan.unit.endMove()
        } else {
            this.ui.goto('board')
        }
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
        } else if (selectedUnit) {
            if (cell.unit) {
                if (selectedUnit.player && selectedUnit.isEnemy(cell.unit)) {
                    const path = selectedUnit.getPathToAttackThisTurn(cell.unit)
                    if (path) {
                        ui.state = {
                            type: 'tapMove',
                            plan: {
                                unit: selectedUnit,
                                path: path,
                                attacking: cell.unit
                            }
                        }
                    } else {
                        ui.selectUnit(cell.unit)
                    }
                } else {
                    ui.selectUnit(cell.unit)
                }
                // Tap another unit to change selection
                ui.selectUnit(cell.unit)
            } else {
                const path = selectedUnit.getPathToOccupyThisTurn(cell)
                if (path) {
                    ui.state = {
                        type: 'tapMove',
                        plan: {
                            unit: selectedUnit,
                            path: selectedUnit.getPathTo(cell)!
                        }
                    }
                } else {
                    // Tap in a random place to deselect unit
                    ui.goto('board')
                }
            }
        } else if (state.type === 'targetAbility') {
            if (state.ability === 'teleport' && state.unit.canOccupy(cell)) {
                runInAction(() => {
                    state.unit.inventory = []
                    state.unit.teleportTo(cell)    
                })
            }
        }
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


