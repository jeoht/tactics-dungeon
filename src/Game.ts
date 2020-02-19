import { Tileset } from "./Tileset"
import { Board } from "./Board"
import { TouchInterface } from "./TouchInterface"

export class Game {
    app: PIXI.Application
    worldTileset: Tileset
    creaturesTileset: Tileset
    board: Board
    touchInterface: TouchInterface

    constructor(app: PIXI.Application, worldTileset: Tileset, creaturesTileset: Tileset) {
        this.app = app
        this.worldTileset = worldTileset
        this.creaturesTileset = creaturesTileset
        this.board = new Board(this)
        this.touchInterface = new TouchInterface(this)
    }

    start() {
        this.onResize()
        window.addEventListener("resize", () => this.onResize())
        
        const { app } = this
        // Construct the scene graph
        for (const cell of this.board.allCells) {
            app.stage.addChild(cell.sprite)
        }
        for (const unit of this.board.units) {
            app.stage.addChild(unit.sprite)
        }
        app.stage.addChild(this.touchInterface.graphics)
    }

    onResize() {
        // const width = this.app.view.offsetWidth
        // const height = width * (this.board.height/this.board.width)

        // const scale = window.devicePixelRatio
        this.app.renderer.resize(this.board.width*24, this.board.height*24)
        // this.ctx.scale(scale, scale)
    }
}