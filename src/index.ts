import * as _ from 'lodash'
import './index.scss'
import { observable, computed, action, autorun } from 'mobx'
import { dijkstra } from './pathfinding'
import { PointVector } from './PointVector'
import * as PIXI from 'pixi.js'
import { Tileset } from './Tileset'
import { Game } from './Game'
const log = console.log


// class BoardRenderer {
//     game: Game

//     @observable canvasWidth: number = 0
//     @observable canvasHeight: number = 0
//     app: PIXI.Application

//     constructor(game: Game) {
//         this.game = game

//         const app = new PIXI.Application()
//         this.app = app
//     }

//     async startup() {        
//         window.addEventListener("resize", this.onResize)
//         this.onResize()

//         const { app, worldTileset, creaturesTileset } = this

//         for (const cell of this.game.allCells) {
//             const tile = new PIXI.Sprite(worldTileset.tile(cell.tileIndex))
//             const [sx, sy] = this.cellToScreenPoint(cell)
//             tile.x = sx
//             tile.y = sy
//             const scale = this.cellScreenWidth/24
//             tile.scale = new PIXI.Point(scale, scale)
//             app.stage.addChild(tile)
//         }

//         for (const cell of this.game.allCells) {
//             if (!cell.unit) continue

//             const unit = cell.unit
//             const tile = new PIXI.Sprite(creaturesTileset.tile(unit.tileIndex))
//             const [sx, sy] = this.cellToScreenPoint(cell)
//             tile.x = sx
//             tile.y = sy
//             const scale = this.cellScreenWidth/24
//             tile.scale = new PIXI.Point(scale, scale)
//             app.stage.addChild(tile)
//         }

//         app.stage.addChild(this.graphics)

//         // await this.loadSprites()
//         // this.startRenderLoop()



        
//     }







//     /** Position of the upper left corner of the cell in screen coordinates. */
//     cellToScreenPoint(cell: Cell) {
//         let dx = cell.pos.x * this.cellScreenWidth
//         let dy = cell.pos.y * this.cellScreenHeight
//         return [dx, dy]
//     }

//     /** Position of the center of the cell in screen coordinates. */
//     cellToScreenPointCenter(cell: Cell) {
//         const [x, y] = this.cellToScreenPoint(cell)
//         return [x + this.cellScreenWidth/2, y + this.cellScreenHeight/2]
//     }

//     onResize() {
//         const width = this.app.view.offsetWidth
//         const height = width * (this.game.boardHeight/this.game.boardWidth)

//         const targetWidth = 24*this.game.boardWidth

//         // const scale = window.devicePixelRatio
//         this.app.renderer.resize(width, height)
//         // this.ctx.scale(scale, scale)

//         this.canvasWidth = width
//         this.canvasHeight = height
//     }


//     @computed get cellScreenWidth(): number {
//         return this.canvasWidth / this.game.boardWidth
//     }

//     @computed get cellScreenHeight(): number {
//         return this.cellScreenWidth
//         // return this.canvas.height / this.game.boardHeight
//     }

//     // render() {
//     //     const { game, ctx } = this
//     //     ctx.save()
//     //     ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

//     //     for (let x = 0; x < game.boardWidth; x++) {
//     //         for (let y = 0; y < game.boardHeight; y++) {
//     //             const cell = game.cells[x][y]
//     //             const [dx, dy] = this.cellToScreenPoint(cell)
//     //             this.worldTilesheet.drawTile(ctx, cell.tileIndex, dx, dy, this.cellScreenWidth, this.cellScreenHeight)

//     //             const { unit } = cell
//     //             if (unit) {
//     //                 this.creaturesTilesheet.drawTile(ctx, unit.tileIndex, dx, dy, this.cellScreenWidth, this.cellScreenHeight)
//     //             }
//     //         }
//     //     }

//     //     const { drag } = this
//     //     if (drag && drag.path.length) {
//     //     }

//     //     ctx.restore()
//     // }
// }

function main() {
    const app = new PIXI.Application()
    document.querySelector("#root")!.appendChild(app.view)

    app.loader
        .add("world", "oryx_16bit_fantasy_world_trans.png")
        .add("creatures", "oryx_16bit_fantasy_creatures_trans.png")
        .load((loader, resources) => {
            const worldTileset = new Tileset(resources.world!.texture, 24, 24)
            const creaturesTileset = new Tileset(resources.creatures!.texture, 24, 24)

            const game = new Game(app, worldTileset, creaturesTileset)
            ;(window as any).game = game
            game.start()
        });
}

main()