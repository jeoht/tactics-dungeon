import { Cell } from "./Cell"
import { GameView } from "./GameView"
import { action, observable } from "mobx"
import { Unit } from "./Unit"
import _ = require("lodash")

export class TouchInterface {
    view: GameView
    @observable drag: { unit: Unit, path: Cell[] }|null = null

    constructor(view: GameView) {
        this.view = view
        view.canvas.addEventListener('touchstart', this.onTouchStart)
        view.canvas.addEventListener('touchend', this.onTouchEnd)
        view.canvas.addEventListener('touchmove', this.onTouchMove)
    }

    touchToScreenPoint(touch: Touch) {
        const rect = this.view.canvas.getBoundingClientRect()
        const scaleX = rect.width / this.view.renderWidth
        const scaleY = rect.height / this.view.renderHeight
        const x = (touch.pageX - rect.left) / scaleX
        const y = (touch.pageY - rect.top) / scaleY
        return [x, y]
    }

    touchToCell(touch: Touch): Cell {
        const [sx, sy] = this.touchToScreenPoint(touch)
        return this.view.screenPointToCell(sx, sy)
    }

    @action.bound onTouchStart(e: TouchEvent) {
        const cell = this.touchToCell(e.touches[0])
        if (cell.unit) {
            this.drag = { unit: cell.unit, path: [] }
        }
    }

    @action.bound onTouchMove(e: TouchEvent) {
        const { drag } = this
        if (!drag) return

        const cell = this.touchToCell(e.touches[0])
        if (cell.pathable) {
            drag.path = drag.unit.getPathTo(cell)
        }
    }

    @action.bound onTouchEnd() {
        const { drag } = this
        if (!drag) return

        const destCell = _.last(drag.path)
        if (destCell) {
            drag.unit.moveTo(destCell)
        }

        this.drag = null
    }

    render() {
        const { drag, view } = this
        const { ctx } = view
        if (drag && drag.path.length) {
            const startCell = drag.unit.cell
            const [x, y] = view.cellToScreenPointCenter(startCell)
            ctx.beginPath()
            ctx.moveTo(x, y)

            for (const cell of drag.path) {
                const [nx, ny] = view.cellToScreenPointCenter(cell)
                ctx.lineTo(nx, ny)
            }

            ctx.strokeStyle = "#fff"
            ctx.stroke()
        }
    }
}


