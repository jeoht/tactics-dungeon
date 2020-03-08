import _ = require("lodash")
import { action, observable, computed, runInAction } from "mobx"
import { bind } from 'decko'

import { Team } from "./Unit"
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
        board.canvas.addEventListener('touchstart', this.onTouchStart)
        board.canvas.addEventListener('touchend', this.onTouchEnd)
        board.canvas.addEventListener('touchmove', this.onTouchMove)
    }

    get drag(): DragState|null {
        return this.ui.state.type === 'dragUnit' ? this.ui.state : null
    }

    touchToScreenPoint(touch: Touch): ScreenVector {
        const rect = this.board.canvas.getBoundingClientRect()
        const scaleX = rect.width / this.board.drawWidth
        const scaleY = rect.height / this.board.drawHeight
        const x = (touch.pageX - rect.left) / scaleX
        const y = (touch.pageY - rect.top) / scaleY
        return new ScreenVector(x, y)
    }

    @bind onTouchStart(e: TouchEvent) {
        // const touch = e.touches[0]
        // const cursorPos = this.touchToScreenPoint(touch)
        // const cell = this.ui.screenPointToCell(cursorPos)

    }

    @bind onTouchMove(e: TouchEvent) {
        const { board } = this
        const touch = e.touches[0]
        const cursorPos = this.touchToScreenPoint(touch)
        const cell = board.cellAt(cursorPos)
        
        if (this.ui.state.type === 'board') {
            if (cell.unit && cell.unit.team === Team.Player && !cell.unit.moved) {
                const cursorOffset = cursorPos.subtract(board.get(cell).pos)
                runInAction(() => {
                    if (cell.unit)
                        this.ui.state = {
                            type: 'dragUnit', 
                            unit: cell.unit, 
                            path: [], 
                            cursorPos: cursorPos, 
                            cursorCell: cell,
                            cursorOffset: cursorOffset,
                            possibleMoves: cell.unit.reachableUnoccupiedCells
                        }    
                })
            }
        } else if (this.ui.state.type === 'dragUnit') {
            runInAction(() => {
                const {drag} = this
                if (drag) {
                    drag.cursorPos = cursorPos
                    drag.cursorCell = cell
                    drag.cursorEnemy = cell.unit && drag.unit.isEnemy(cell.unit) ? cell.unit : undefined
                    if (drag.possibleMoves.includes(cell)) {
                        drag.path = drag.unit.getPathTo(cell)!
                    } else if (drag.cursorEnemy) {
                        const finalPathCell = drag.path[drag.path.length-1]
                        if (!finalPathCell || !drag.unit.canAttackFrom(finalPathCell, drag.cursorEnemy)) {
                            const path = drag.unit.getPathToAttack(drag.cursorEnemy)
                            if (path && path.length <= drag.unit.moveRange)
                                drag.path = path
                        }
                    }
                }    
            })
        }

    }

    @bind onTouchEnd(e: TouchEvent) {
        const { drag } = this
        if (!drag) {
            this.onTap(e)
            return
        }

        let finalPathCell = _.last(drag.path)
        if (!finalPathCell && drag.cursorEnemy && drag.unit.canAttackFromHere(drag.cursorEnemy)) {
            // We're not moving at all, just attacking from current position
            finalPathCell = drag.unit.cell
        }

        const attackingEnemy = finalPathCell && drag.cursorEnemy && drag.unit.canAttackFrom(finalPathCell, drag.cursorEnemy)

        // Only move if we're going directly to the cursor cell, or
        // if we're going adjacent to attack the cursor cell
        if (finalPathCell && (finalPathCell === drag.cursorCell || attackingEnemy)) {
            if (drag.path.length)
                drag.unit.moveAlong(drag.path)

            if (attackingEnemy) {
                drag.unit.attack(drag.cursorEnemy!)
                this.ui.goto('board')
            }

            drag.unit.endMove()
        } else {
            this.ui.goto('board')
        }
    }

    @bind onTap(e: TouchEvent) {
        const { board } = this
        const { state } = board.ui
        const touch = e.changedTouches[0]
        const cell = board.cellAt(this.touchToScreenPoint(touch))
        
        if (state.type === 'board') {
            // We can tap on a unit to select it
            if (cell.unit) {
                this.ui.selectUnit(cell.unit)
            }
        } else if (state.type === 'selectedUnit') {
            if (cell.unit) {
                // Tap another unit to change selection
                this.ui.selectUnit(cell.unit)
            } else {
                // Tap again anywhere to deselect unit
                this.ui.goto('board')
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
        const { drag, board } = this

        if (drag) {
            const sprite = board.get(drag.unit)
            sprite.drawInfoUnderlay(ctx)

            // Draw path the unit will follow
            if (drag.path.length) {
                const startCell = drag.unit.cell
                const {x, y} = board.get(startCell).centerPos
                ctx.beginPath()
                ctx.moveTo(x, y)
    
                for (const cell of drag.path) {
                    const spos = board.get(cell).centerPos
                    ctx.lineTo(spos.x, spos.y)
                }
    
                ctx.strokeStyle = "#fff"
                ctx.lineWidth = 5
                ctx.stroke()    
            }

            // If we're about to attack a unit, draw targeting
            const finalPathCell = _.last(drag.path)
            if (drag.cursorEnemy && finalPathCell && drag.unit.canAttackFrom(finalPathCell, drag.cursorEnemy)) {
                const enemy = drag.cursorEnemy
                ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
                board.get(enemy.cell).fill(ctx)    
            }

            // Draw the unit at the current cursor position
            const pos = drag.cursorPos.subtract(drag.cursorOffset)
            board.ui.assets.creatures.drawTile(ctx, drag.unit.tileIndex, pos.x, pos.y, CELL_WIDTH, CELL_HEIGHT)
        }
    }
}


