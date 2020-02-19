import * as _ from 'lodash'
import './index.scss'
import { observable, computed, action, autorun } from 'mobx'
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
}

class Cell {
    game: Game
    x: number
    y: number
    tileIndex: number
    unit?: Unit

    constructor(game: Game, x: number, y: number) {
        this.game = game
        this.x = x
        this.y = y
        this.tileIndex = Math.random() > 0.5 ? 0 : 3
    }

    get pathable() {
        return this.tileIndex !== 0
    }

    isAdjacentTo(otherCell: Cell) {
        return (Math.abs(otherCell.x - this.x) + Math.abs(otherCell.y - this.y)) == 1
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

    constructor() {
        this.renderer = new BoardRenderer(this)

        for (let x = 0; x < this.boardWidth; x++) {
            this.cells[x] = []
            for (let y = 0; y < this.boardHeight; y++) {
                this.cells[x][y] = new Cell(this, x, y)
            }
        }

        for (const cell of this.allCells) {
            if (cell.pathable) {
                new Unit(3, cell)
                break
            }
        }
    }
}

function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(img)
    })
}

class Tilesheet {
    image: HTMLImageElement
    tileWidth: number
    tileHeight: number
    rows: number
    columns: number

    constructor(image: HTMLImageElement, tileWidth: number, tileHeight: number) {
        this.image = image
        this.tileWidth = tileWidth
        this.tileHeight = tileHeight
        this.rows = Math.floor(image.naturalHeight / tileHeight)
        this.columns = Math.floor(image.naturalWidth / tileWidth)
    }

    drawTile(ctx: CanvasRenderingContext2D, tileIndex: number, dx: number, dy: number, dWidth: number, dHeight: number) {
        const column = tileIndex % this.columns
        const row = Math.floor(tileIndex / this.columns)
        const sx = column * this.tileWidth
        const sy = row * this.tileHeight
        
        ctx.drawImage(this.image, sx, sy, this.tileWidth, this.tileHeight, dx, dy, dWidth, dHeight)        
    }
}

class BoardRenderer {
    game: Game
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    worldTilesheet!: Tilesheet
    creaturesTilesheet!: Tilesheet

    @observable canvasWidth: number = 0
    @observable canvasHeight: number = 0
    @observable drag: { unit: Unit, path: Cell[] }|null = null

    constructor(game: Game) {
        this.game = game
        this.canvas = document.getElementById("board") as HTMLCanvasElement
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.startup()
    }

    async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.src = url
            img.onload = () => resolve(img)
        })
    }

    async loadSprites() {
        this.worldTilesheet = new Tilesheet(await this.loadImage('oryx_16bit_fantasy_world_trans.png'), 24, 24)
        this.creaturesTilesheet = new Tilesheet(await this.loadImage('oryx_16bit_fantasy_creatures_trans.png'), 24, 24)
    }

    async startup() {
        await this.loadSprites()
        window.addEventListener("resize", this.onResize)
        this.onResize()
        this.startRenderLoop()

        this.canvas.addEventListener('touchstart', this.onTouchStart)
        this.canvas.addEventListener('touchend', this.onTouchEnd)
        this.canvas.addEventListener('touchmove', this.onTouchMove)
        
    }

    touchToScreenPoint(touch: Touch) {
        const rect = this.canvas.getBoundingClientRect()
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
        if (cell.pathable && cell.isAdjacentTo(prevCell) && !drag.path.includes(cell)) {
            drag.path.push(cell)
        }
    }

    screenPointToCell(sx: number, sy: number): Cell {
        const cx = Math.min(this.game.boardWidth-1, Math.max(0, Math.floor(sx / this.cellScreenWidth)))
        const cy = Math.min(this.game.boardHeight-1, Math.max(0, Math.floor(sy / this.cellScreenHeight)))
        return this.game.cells[cx][cy]
    }

    /** Position of the upper left corner of the cell in screen coordinates. */
    cellToScreenPoint(cell: Cell) {
        let dx = cell.x * this.cellScreenWidth
        let dy = cell.y * this.cellScreenHeight
        return [dx, dy]
    }

    /** Position of the center of the cell in screen coordinates. */
    cellToScreenPointCenter(cell: Cell) {
        const [x, y] = this.cellToScreenPoint(cell)
        return [x + this.cellScreenWidth/2, y + this.cellScreenHeight/2]
    }

    onResize() {
        const width = this.canvas.offsetWidth
        const height = width * (this.game.boardHeight/this.game.boardWidth)

        const scale = window.devicePixelRatio
        this.canvas.width = width*scale
        this.canvas.height = height*scale
        this.ctx.scale(scale, scale)

        this.canvasWidth = width
        this.canvasHeight = height
    }

    animationHandle: number|null = null
    startRenderLoop() {
        if (this.animationHandle != null)
            cancelAnimationFrame(this.animationHandle)

        let start: number
        const frame = (timestamp: number) => {
            if (!start) start = timestamp
            const timePassed = 100000 +timestamp-start
            this.render()
            this.animationHandle = requestAnimationFrame(frame)
        }
        this.animationHandle = requestAnimationFrame(frame)
    }

    @computed get cellScreenWidth(): number {
        return this.canvasWidth / this.game.boardWidth
    }

    @computed get cellScreenHeight(): number {
        return this.cellScreenWidth
        // return this.canvas.height / this.game.boardHeight
    }

    render() {
        const { game, ctx } = this
        ctx.save()
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        for (let x = 0; x < game.boardWidth; x++) {
            for (let y = 0; y < game.boardHeight; y++) {
                const cell = game.cells[x][y]
                const [dx, dy] = this.cellToScreenPoint(cell)
                this.worldTilesheet.drawTile(ctx, cell.tileIndex, dx, dy, this.cellScreenWidth, this.cellScreenHeight)

                const { unit } = cell
                if (unit) {
                    this.creaturesTilesheet.drawTile(ctx, unit.tileIndex, dx, dy, this.cellScreenWidth, this.cellScreenHeight)
                }
            }
        }

        const { drag } = this
        if (drag && drag.path.length) {
            const startCell = drag.unit.cell
            const [x, y] = this.cellToScreenPointCenter(startCell)
            ctx.beginPath()
            ctx.moveTo(x, y)

            for (const cell of drag.path) {
                const [nx, ny] = this.cellToScreenPointCenter(cell)
                ctx.lineTo(nx, ny)
            }

            ctx.strokeStyle = "#fff"
            ctx.stroke()
        }

        ctx.restore()
    }
}

function main() {
    const game = new Game()
    ;(window as any).game = game
}

main()