import * as _ from 'lodash'
import './index.scss'
import { observable, computed, action, autorun } from 'mobx'
import { dijkstra } from './pathfinding'
import { PointVector } from './PointVector'
import * as PIXI from 'pixi.js'
import { scaleBand } from 'd3-scale'
const log = console.log

class Unit {
    tileIndex: number
    cell: Cell
    constructor(tileIndex: number, cell: Cell) {
        this.tileIndex = tileIndex
        this.cell = cell
        cell.unit = this
    }

    moveTo(cell: Cell) {
        this.cell.unit = undefined
        cell.unit = this
        this.cell = cell
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

class Cell {
    game: Game
    pos: PointVector
    tileIndex: number
    unit?: Unit

    constructor(game: Game, x: number, y: number) {
        this.game = game
        this.pos = new PointVector(x, y)
        this.tileIndex = Math.random() > 0.9 ? 0 : 3
    }

    get pathable() {
        return this.tileIndex !== 0
    }

    neighbors(): Cell[] {
        const neighbors = []
        for (const n of this.pos.neighbors()) {
            const cell = this.game.cellAt(n)
            if (cell) {
                neighbors.push(cell)
            }
        }
        return neighbors
    }

    isAdjacentTo(otherCell: Cell) {
        return this.pos.manhattanDistance(otherCell.pos) === 1
    }
}


class Game {
    renderer: BoardRenderer
    @observable cells: Cell[][] = []
    boardWidth: number = 6
    boardHeight: number = 8

    @computed get allCells(): Cell[] {
        const cells: Cell[] = []
        for (let i = 0 ; i < this.boardWidth; i++) {
            for (let j = 0; j < this.boardHeight; j++) {
                cells.push(this.cells[i][j])
            }
        }
        return cells
    }

    cellAt(pos: PointVector): Cell|undefined {
        const col = this.cells[pos.x]
        if (!col) return undefined
        return col[pos.y]
    }

    constructor() {
        this.renderer = new BoardRenderer(this)

        for (let x = 0; x < this.boardWidth; x++) {
            this.cells[x] = []
            for (let y = 0; y < this.boardHeight; y++) {
                this.cells[x][y] = new Cell(this, x, y)
            }
        }

        const pathableCells = _.sampleSize(this.allCells.filter(c => c.pathable), 2)
        new Unit(3, pathableCells[0])
        new Unit(4, pathableCells[1])
    }
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(img)
    })
}

class Tileset {
    texture: PIXI.Texture
    tileWidth: number
    tileHeight: number
    rows: number
    columns: number
    tileCache: {[tileIndex: number]: PIXI.Texture|undefined} = {}

    constructor(texture: PIXI.Texture, tileWidth: number, tileHeight: number) {
        this.texture = texture
        this.tileWidth = tileWidth
        this.tileHeight = tileHeight
        this.columns = Math.floor(texture.width / tileWidth)
        this.rows = Math.floor(texture.height / tileHeight)
    }

    tile(tileIndex: number) {
        const cached = this.tileCache[tileIndex]
        if (cached) return cached

        const column = tileIndex % this.columns
        const row = Math.floor(tileIndex / this.columns)
        const sx = column * this.tileWidth
        const sy = row * this.tileHeight

        const texture = new PIXI.Texture(this.texture.baseTexture, new PIXI.Rectangle(sx, sy, this.tileWidth, this.tileHeight))
        this.tileCache[tileIndex] = texture
        return texture
    }
}

class BoardRenderer {
    game: Game

    @observable canvasWidth: number = 0
    @observable canvasHeight: number = 0
    @observable drag: { unit: Unit, path: Cell[] }|null = null
    app: PIXI.Application
    graphics: PIXI.Graphics
    worldTileset!: Tileset
    creaturesTileset!: Tileset

    constructor(game: Game) {
        this.game = game

        const app = new PIXI.Application()
        this.app = app

        const graphics = new PIXI.Graphics()
        this.graphics = graphics

        document.querySelector("#root")!.appendChild(app.view)

        app.loader
            .add("world", "oryx_16bit_fantasy_world_trans.png")
            .add("creatures", "oryx_16bit_fantasy_creatures_trans.png")
            .load((loader, resources) => {
                this.worldTileset = new Tileset(resources.world!.texture, 24, 24)
                this.creaturesTileset = new Tileset(resources.creatures!.texture, 24, 24)
                this.startup()
            });
    }

    async startup() {        
        window.addEventListener("resize", this.onResize)
        this.onResize()

        const { app, worldTileset, creaturesTileset } = this

        for (const cell of this.game.allCells) {
            const tile = new PIXI.Sprite(worldTileset.tile(cell.tileIndex))
            const [sx, sy] = this.cellToScreenPoint(cell)
            tile.x = sx
            tile.y = sy
            const scale = this.cellScreenWidth/24
            tile.scale = new PIXI.Point(scale, scale)
            app.stage.addChild(tile)
        }

        for (const cell of this.game.allCells) {
            if (!cell.unit) continue

            const unit = cell.unit
            const tile = new PIXI.Sprite(creaturesTileset.tile(unit.tileIndex))
            const [sx, sy] = this.cellToScreenPoint(cell)
            tile.x = sx
            tile.y = sy
            const scale = this.cellScreenWidth/24
            tile.scale = new PIXI.Point(scale, scale)
            app.stage.addChild(tile)
        }

        app.stage.addChild(this.graphics)

        // await this.loadSprites()
        // this.startRenderLoop()

        autorun(() => {
            const { drag } = this
            if (!drag || !drag.path.length) {
                this.graphics.clear()
                return
            }

            const { graphics } = this
            graphics.clear()

            const startCell = drag.unit.cell
            const [x, y] = this.cellToScreenPointCenter(startCell)
            console.log(x, y)
            graphics.moveTo(x, y)
            graphics.lineStyle(1, 0xffffff, 1)

            for (const cell of drag.path) {
                const [nx, ny] = this.cellToScreenPointCenter(cell)
                graphics.lineTo(nx, ny)
            }

            graphics.endFill()
        })



        app.view.addEventListener('touchstart', this.onTouchStart)
        app.view.addEventListener('touchend', this.onTouchEnd)
        app.view.addEventListener('touchmove', this.onTouchMove)
        
    }

    touchToScreenPoint(touch: Touch) {
        const rect = this.app.view.getBoundingClientRect()
        const x = touch.pageX - rect.left
        const y = touch.pageY - rect.top
        return [x, y]
    }

    touchToCell(touch: Touch): Cell {
        const [sx, sy] = this.touchToScreenPoint(touch)
        return this.screenPointToCell(sx, sy)
    }

    @action.bound onTouchStart(e: TouchEvent) {
        const cell = this.touchToCell(e.touches[0])
        console.log(cell)
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

    screenPointToCell(sx: number, sy: number): Cell {
        const cx = Math.min(this.game.boardWidth-1, Math.max(0, Math.floor(sx / this.cellScreenWidth)))
        const cy = Math.min(this.game.boardHeight-1, Math.max(0, Math.floor(sy / this.cellScreenHeight)))
        return this.game.cells[cx][cy]
    }

    /** Position of the upper left corner of the cell in screen coordinates. */
    cellToScreenPoint(cell: Cell) {
        let dx = cell.pos.x * this.cellScreenWidth
        let dy = cell.pos.y * this.cellScreenHeight
        return [dx, dy]
    }

    /** Position of the center of the cell in screen coordinates. */
    cellToScreenPointCenter(cell: Cell) {
        const [x, y] = this.cellToScreenPoint(cell)
        return [x + this.cellScreenWidth/2, y + this.cellScreenHeight/2]
    }

    onResize() {
        const width = this.app.view.offsetWidth
        const height = width * (this.game.boardHeight/this.game.boardWidth)

        const targetWidth = 24*this.game.boardWidth

        // const scale = window.devicePixelRatio
        this.app.renderer.resize(width, height)
        // this.ctx.scale(scale, scale)

        this.canvasWidth = width
        this.canvasHeight = height
    }


    @computed get cellScreenWidth(): number {
        return this.canvasWidth / this.game.boardWidth
    }

    @computed get cellScreenHeight(): number {
        return this.cellScreenWidth
        // return this.canvas.height / this.game.boardHeight
    }

    // render() {
    //     const { game, ctx } = this
    //     ctx.save()
    //     ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    //     for (let x = 0; x < game.boardWidth; x++) {
    //         for (let y = 0; y < game.boardHeight; y++) {
    //             const cell = game.cells[x][y]
    //             const [dx, dy] = this.cellToScreenPoint(cell)
    //             this.worldTilesheet.drawTile(ctx, cell.tileIndex, dx, dy, this.cellScreenWidth, this.cellScreenHeight)

    //             const { unit } = cell
    //             if (unit) {
    //                 this.creaturesTilesheet.drawTile(ctx, unit.tileIndex, dx, dy, this.cellScreenWidth, this.cellScreenHeight)
    //             }
    //         }
    //     }

    //     const { drag } = this
    //     if (drag && drag.path.length) {
    //     }

    //     ctx.restore()
    // }
}

function main() {
    const game = new Game()
    ;(window as any).game = game
}

main()