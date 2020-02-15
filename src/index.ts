import * as _ from 'lodash'
import './index.scss'
import { observable, computed, action, autorun } from 'mobx'
const log = console.log

class Cell {
    game: Game
    x: number
    y: number
    color: string

    constructor(game: Game, x: number, y: number) {
        this.game = game
        this.x = x
        this.y = y
        this.color = Math.random() > 0.5 ? "#f00" : "#0f0"
    }
}

class Game {
    renderer: GameRenderer
    cells: Cell[][] = []
    boardWidth: number = 8
    boardHeight: number = 8

    constructor() {
        this.renderer = new GameRenderer(this)


        for (let x = 0; x < this.boardWidth; x++) {
            this.cells[x] = []
            for (let y = 0; y < this.boardHeight; y++) {
                this.cells[x][y] = new Cell(this, x, y)
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

class GameRenderer {
    game: Game
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    canvasWidth: number = 0
    canvasHeight: number = 0

    constructor(game: Game) {
        this.game = game
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
        this.startup()
    }

    async loadSprites() {
        
    }

    async startup() {
        await this.loadSprites()
        window.addEventListener("resize", this.onResize)
        this.onResize()
        this.startRenderLoop()
    }

    onResize() {
        const width = this.canvas.parentElement!.offsetWidth
        const height = this.canvas.parentElement!.offsetHeight

        this.canvas.style.width = width+'px'
        this.canvas.style.height = height+'px'

        const scale = window.devicePixelRatio
        this.canvas.width = width*scale
        this.canvas.height = height*scale

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
        return this.canvas.width / this.game.boardWidth
    }

    @computed get cellScreenHeight(): number {
        return this.canvas.height / this.game.boardHeight
    }

    render() {
        const { game, ctx } = this
        ctx.save()
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        for (let x = 0; x < game.boardWidth; x++) {
            for (let y = 0; y < game.boardHeight; y++) {
                const cell = game.cells[x][y]
                const sx = x * this.cellScreenWidth
                const sy = y * this.cellScreenHeight
                ctx.fillStyle = cell.color
                ctx.fillRect(sx, sy, this.cellScreenWidth, this.cellScreenHeight)
            }
        }

        ctx.restore()
    }
}

function main() {
    const game = new Game()
    ;(window as any).game = game
}

main()