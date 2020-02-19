import { Cell } from "./Cell"
import { action, observable, autorun } from "mobx"
import { Unit } from "./Unit"
import { Game } from "./Game"
import _ = require("lodash")
import * as PIXI from 'pixi.js'

export class TouchInterface {
    game: Game
    @observable drag: { unit: Unit, path: Cell[] }|null = null
    graphics: PIXI.Graphics

    constructor(game: Game) {
        this.game = game

        this.game.app.view.addEventListener('touchstart', this.onTouchStart)
        this.game.app.view.addEventListener('touchend', this.onTouchEnd)
        this.game.app.view.addEventListener('touchmove', this.onTouchMove)

        const graphics = new PIXI.Graphics()
        this.graphics = graphics

        autorun(() => {
            const { drag } = this
            if (!drag || !drag.path.length) {
                this.graphics.clear()
                return
            }

            const { graphics } = this
            graphics.clear()

            const startCell = drag.unit.cell
            const {x, y} = startCell.spriteCenterPos
            graphics.moveTo(x, y)
            graphics.lineStyle(1, 0xffffff, 1)

            for (const cell of drag.path) {
                const pos = cell.spriteCenterPos
                graphics.lineTo(pos.x, pos.y)
            }

            graphics.endFill()
        })
    }

    @action.bound onTouchStart(e: TouchEvent) {
        const cell = this.touchToCell(e.touches[0])
        console.log(cell, cell.unit)
        if (cell.unit) {
            this.drag = { unit: cell.unit, path: [] }
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

    @action.bound onTouchMove(e: TouchEvent) {
        const { drag } = this
        if (!drag) return

        const cell = this.touchToCell(e.touches[0])
        const prevCell = _.last(drag.path) || drag.unit.cell
        if (cell.pathable) {
            drag.path = drag.unit.getPathTo(cell)
        }
    }

    touchToScreenPoint(touch: Touch) {
        const rect = this.game.app.view.getBoundingClientRect()
        const scaleX = rect.width / this.game.app.renderer.width
        const scaleY = rect.height / this.game.app.renderer.height

        const x = (touch.pageX - rect.left) / scaleX
        const y = (touch.pageY - rect.top) / scaleY
        return [x, y]
    }

    touchToCell(touch: Touch): Cell {
        const [sx, sy] = this.touchToScreenPoint(touch)
        return this.game.board.screenPointToCell(sx, sy)
    }
}