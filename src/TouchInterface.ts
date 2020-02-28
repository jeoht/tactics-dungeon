import { Cell } from "./Cell"
import { GameView } from "./GameView"
import { action, observable } from "mobx"
import { Unit } from "./Unit"
import _ = require("lodash")
import { ScreenVector } from "./ScreenVector"


type Drag = {
    /** The unit being dragged */
    unit: Unit
    /** The current path the unit will follow on drag release */
    path: Cell[]
    /** Current position of the cursor in screen coordinates */
    cursorPos: ScreenVector
    /** Unit rendering offset relative to the cursor position */
    cursorOffset: ScreenVector
    /** Cells the unit can move to */
    possibleMoves: Cell[]
}

export class TouchInterface {
    view: GameView
    @observable drag: Drag|null = null

    constructor(view: GameView) {
        this.view = view
        view.canvas.addEventListener('touchstart', this.onTouchStart)
        view.canvas.addEventListener('touchend', this.onTouchEnd)
        view.canvas.addEventListener('touchmove', this.onTouchMove)
    }

    touchToScreenPoint(touch: Touch): ScreenVector {
        const rect = this.view.canvas.getBoundingClientRect()
        const scaleX = rect.width / this.view.renderWidth
        const scaleY = rect.height / this.view.renderHeight
        const x = (touch.pageX - rect.left) / scaleX
        const y = (touch.pageY - rect.top) / scaleY
        return new ScreenVector(x, y)
    }

    @action.bound onTouchStart(e: TouchEvent) {
        const touch = e.touches[0]
        const cursorPos = this.touchToScreenPoint(touch)
        const cell = this.view.screenPointToCell(cursorPos)
        if (cell.unit && !cell.unit.moved) {
            const cursorOffset = cursorPos.subtract(this.view.cellToScreenPoint(cell))
            this.drag = { 
                unit: cell.unit, 
                path: [], 
                cursorPos: cursorPos, 
                cursorOffset: cursorOffset,
                possibleMoves: cell.unit.findCellsInMoveRange()
            }
        }
    }

    @action.bound onTouchMove(e: TouchEvent) {
        const { drag } = this
        if (!drag) return

        const touch = e.touches[0]
        const cursorPos = this.touchToScreenPoint(touch)
        const cell = this.view.screenPointToCell(cursorPos)

        drag.cursorPos = cursorPos
        if (drag.possibleMoves.includes(cell)) {
            drag.path = drag.unit.getPathTo(cell)
        }
    }

    @action.bound onTouchEnd() {
        const { drag } = this
        if (!drag) return

        const destCell = _.last(drag.path)
        if (destCell) {
            drag.unit.moveTo(destCell)
            drag.unit.moved = true
        }

        this.drag = null
    }

    render() {
        const { drag, view } = this
        const { ctx } = view
        if (drag) {
            // Draw overlay indicator of movement radius
            ctx.fillStyle = "rgba(51, 153, 255, 0.5)"
            for (const cell of drag.possibleMoves) {
                const spos = view.cellToScreenPoint(cell)
                ctx.fillRect(spos.x, spos.y, view.cellScreenWidth, view.cellScreenHeight)
            }

            // Draw path the unit will follow
            if (drag.path.length) {
                const startCell = drag.unit.cell
                const {x, y} = view.cellToScreenPointCenter(startCell)
                ctx.beginPath()
                ctx.moveTo(x, y)
    
                for (const cell of drag.path) {
                    const spos = view.cellToScreenPointCenter(cell)
                    ctx.lineTo(spos.x, spos.y)
                }
    
                ctx.strokeStyle = "#fff"
                ctx.lineWidth = 5
                ctx.stroke()    
            }

            // Draw the unit at the current cursor position
            const pos = drag.cursorPos.subtract(drag.cursorOffset)
            view.assets.creatures.drawTile(ctx, drag.unit.tileIndex, pos.x, pos.y, view.cellScreenWidth, view.cellScreenHeight)
        }
    }
}


