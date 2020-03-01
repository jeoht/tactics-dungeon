import { Cell } from "./Cell"
import { GameView } from "./GameView"
import { action, observable } from "mobx"
import { Unit, Team } from "./Unit"
import _ = require("lodash")
import { ScreenVector } from "./ScreenVector"
import { UIState } from "./UIState"


type Drag = {
    /** The unit being dragged */
    unit: Unit
    /** The current path the unit will follow on drag release */
    path: Cell[]
    /** Current position of the cursor in screen coordinates */
    cursorPos: ScreenVector
    /** The cell underneath the current cursor position */
    cursorCell: Cell
    /** Enemy underneath the current cursor position, if any */
    cursorEnemy?: Unit
    /** Unit rendering offset relative to the cursor position */
    cursorOffset: ScreenVector
    /** Cells the unit can move to */
    possibleMoves: Cell[]
}

export class TouchInterface {
    ui: UIState
    canvas: HTMLCanvasElement
    @observable drag: Drag|null = null

    constructor(ui: UIState, canvas: HTMLCanvasElement) {
        this.ui = ui
        this.canvas = canvas
        canvas.addEventListener('touchstart', this.onTouchStart)
        canvas.addEventListener('touchend', this.onTouchEnd)
        canvas.addEventListener('touchmove', this.onTouchMove)
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
        if (this.ui.state.type !== 'board')
            return

        const touch = e.touches[0]
        const cursorPos = this.touchToScreenPoint(touch)
        const cell = this.ui.screenPointToCell(cursorPos)

        if (!this.drag && cell.unit && cell.unit.team === Team.Player && !cell.unit.moved) {
            const cursorOffset = cursorPos.subtract(this.ui.cellToScreenPoint(cell))
            this.drag = { 
                unit: cell.unit, 
                path: [], 
                cursorPos: cursorPos, 
                cursorCell: cell,
                cursorOffset: cursorOffset,
                possibleMoves: cell.unit.findCellsInMoveRange()
            }
        }

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
                drag.unit.attack(drag.cursorEnemy)
                drag.unit.endMove()
            } else {
                this.ui.state = { type: 'unitActionChoice', unit: drag.unit }
            }
        }


        this.drag = null
    }

    @action.bound onTap(e: TouchEvent) {
        if (this.ui.state.type !== 'board')
            return

        const touch = e.changedTouches[0]
        const cell = this.ui.screenPointToCell(this.touchToScreenPoint(touch))
        if (cell.unit) {
            this.ui.state = { type: 'unit', unit: cell.unit }
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


