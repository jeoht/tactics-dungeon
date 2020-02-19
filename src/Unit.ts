import { Cell } from "./Cell"
import { dijkstra } from "./pathfinding"
import { Game } from "./Game"
import * as PIXI from 'pixi.js'
import { autorun, observable } from "mobx"

export class Unit {
    game: Game
    tileIndex: number
    @observable.ref cell: Cell
    sprite: PIXI.Sprite

    constructor(game: Game, tileIndex: number, cell: Cell) {
        this.game = game
        this.tileIndex = tileIndex
        this.cell = cell
        cell.unit = this
        this.sprite = new PIXI.Sprite(this.game.creaturesTileset.tile(this.tileIndex))

        this.sprite.position = cell.sprite.position
        // const scale = this.game.renderer.cellScreenWidth/24
        // this.sprite.scale = new PIXI.Point(scale, scale)
    }

    moveTo(cell: Cell) {
        delete this.cell.unit
        cell.unit = this
        this.cell = cell

        this.sprite.position = cell.sprite.position
    }

    canPathThrough(cell: Cell) {
        return cell.pathable && (!cell.unit || cell.unit === this)
    }

    getPathTo(cell: Cell) {
        return dijkstra({
            start: this.cell,
            goal: cell,
            expand: node => node.neighbors().filter(n => this.canPathThrough(n))
        })
    }
}
