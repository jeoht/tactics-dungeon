import { Cell } from "./Cell"
import { GameView } from "./GameView"
import { action, observable, computed } from "mobx"
import { Unit, Team } from "./Unit"
import _ = require("lodash")
import { ScreenVector } from "./ScreenVector"
import { UIState, DragState } from "./UIState"



export class TouchInterface {
    ui: UIState
    canvas: HTMLCanvasElement

    constructor(ui: UIState, canvas: HTMLCanvasElement) {
        this.ui = ui
        this.canvas = canvas
        canvas.addEventListener('touchstart', this.onTouchStart)
        canvas.addEventListener('touchend', this.onTouchEnd)
        canvas.addEventListener('touchmove', this.onTouchMove)
    }

    get drag(): DragState|null {
        return this.ui.state.type === 'dragUnit' ? this.ui.state : null
    }

    touchToScreenPoint(touch: Touch): ScreenVector {
        const rect = this.canvas.getBoundingClientRect()
        const scaleX = rect.width / this.ui.boardScreenWidth
        const scaleY = rect.height / this.ui.boardScreenHeight
        const x = (touch.pageX - rect.left) / scaleX
        const y = (touch.pageY - rect.top) / scaleY
        return new ScreenVector(x, y)
    }

    @action.bound onTouchStart(e: TouchEvent) {
        // const touch = e.touches[0]
        // const cursorPos = this.touchToScreenPoint(touch)
        // const cell = this.ui.screenPointToCell(cursorPos)

    }

    @action.bound onTouchMove(e: TouchEvent) {

        const touch = e.touches[0]
        const cursorPos = this.touchToScreenPoint(touch)
        const cell = this.ui.screenPointToCell(cursorPos)
        
        if (this.ui.state.type === 'board') {
            if (cell.unit && cell.unit.team === Team.Player && !cell.unit.moved) {
                const cursorOffset = cursorPos.subtract(this.ui.cellToScreenPoint(cell))
                this.ui.state = {
                    type: 'dragUnit', 
                    unit: cell.unit, 
                    path: [], 
                    cursorPos: cursorPos, 
                    cursorCell: cell,
                    cursorOffset: cursorOffset,
                    possibleMoves: cell.unit.findCellsInMoveRange()
                }
            }
        } else if (this.ui.state.type === 'dragUnit') {
            const {drag} = this
            if (drag) {
                drag.cursorPos = cursorPos
                drag.cursorCell = cell
                drag.cursorEnemy = cell.unit && drag.unit.isEnemy(cell.unit) ? cell.unit : undefined
                if (drag.possibleMoves.includes(cell)) {
                    drag.path = drag.unit.getPathTo(cell)
                }
            }
        }

    }

    @action.bound onTouchEnd(e: TouchEvent) {
        const { drag } = this
        if (!drag) {
            this.onTap(e)
            return
        }

        let finalPathCell = _.last(drag.path)
        if (!finalPathCell && drag.cursorEnemy && drag.unit.cell.isAdjacentTo(drag.cursorCell)) {
            finalPathCell = drag.unit.cell
        }

        // Only move if we're going directly to the cursor cell, or
        // if we're going adjacent to attack the cursor cell
        if (finalPathCell && (finalPathCell === drag.cursorCell || drag.cursorEnemy)) {
            if (drag.path.length)
                drag.unit.moveAlong(drag.path)

            if (drag.cursorEnemy) {
                this.ui.state = { type: 'board' }
                drag.unit.attack(drag.cursorEnemy)
                drag.unit.endMove()
            } else {
                this.ui.state = { type: 'unitActionChoice', unit: drag.unit }
            }
        } else {
            this.ui.state = { type: 'board' }
        }
    }

    @action.bound onTap(e: TouchEvent) {
        const { state } = this.ui
        const touch = e.changedTouches[0]
        const cell = this.ui.screenPointToCell(this.touchToScreenPoint(touch))

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
                this.ui.state = { type: 'board' }
            }

        }
    }

    render() {
        const { drag, ui } = this
        const ctx = this.canvas.getContext('2d')!
        if (drag) {
            // Draw overlay indicator of movement radius
            ctx.fillStyle = "rgba(51, 153, 255, 0.5)"
            for (const cell of drag.possibleMoves) {
                const spos = ui.cellToScreenPoint(cell)
                ctx.fillRect(spos.x, spos.y, ui.cellScreenWidth, ui.cellScreenHeight)
            }

            // Draw path the unit will follow
            if (drag.path.length) {
                const startCell = drag.unit.cell
                const {x, y} = ui.cellToScreenPointCenter(startCell)
                ctx.beginPath()
                ctx.moveTo(x, y)
    
                for (const cell of drag.path) {
                    const spos = ui.cellToScreenPointCenter(cell)
                    ctx.lineTo(spos.x, spos.y)
                }
    
                ctx.strokeStyle = "#fff"
                ctx.lineWidth = 5
                ctx.stroke()    
            }

            // If we're about to attack a unit, draw targeting
            if (drag.cursorEnemy) {
                const enemy = drag.cursorEnemy
                ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
                const spos = ui.cellToScreenPoint(enemy.cell)
                ctx.fillRect(spos.x, spos.y, ui.cellScreenWidth, ui.cellScreenHeight)
    
            }

            // Draw the unit at the current cursor position
            const pos = drag.cursorPos.subtract(drag.cursorOffset)
            ui.assets.creatures.drawTile(ctx, drag.unit.tileIndex, pos.x, pos.y, ui.cellScreenWidth, ui.cellScreenHeight)
        }
    }
}


