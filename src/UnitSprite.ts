import { UI } from "./UI"
import { Unit, Team } from "./Unit"
import { observable, computed } from "mobx"
import { ScreenVector } from "./ScreenVector"
import { Tileset } from "./Tileset"
import { Cell } from "./Cell"
import { CanvasBoard } from "./CanvasBoard"
import { CELL_WIDTH, CELL_HEIGHT } from "./settings"
import { CellSprite } from "./CellSprite"

interface SceneObject {
    frame?: (deltaTime: number) => void
    draw?: (ctx: CanvasRenderingContext2D) => void
}

export class UnitSprite implements SceneObject {
    board: CanvasBoard
    unit: Unit
    @observable pos: ScreenVector
    tileset: Tileset
    moved: boolean = false
    alpha: number = 1

    constructor(board: CanvasBoard, unit: Unit) {
        this.board = board
        this.unit = unit
        this.moved = unit.moved
        this.pos = this.cell.pos
        this.tileset = board.ui.assets.creatures
    }

    get timestamp() {
        return this.board.ui.time.now
    }

    attacking: {
        startTime: number,
        startPos: ScreenVector,
        targetPos: ScreenVector,
        damage: number,
        resolve: () => void
    } | null = null

    @computed get width() {
        return CELL_WIDTH
    }

    @computed get height() {
        return CELL_HEIGHT
    }

    @computed get topLeft() {
        return this.pos
    }

    @computed get topRight() {
        return this.pos.addX(this.width)
    }

    @computed get bottomLeft() {
        return this.pos.addY(this.height)
    }

    @computed get bottomRight() {
        return this.pos.addXY(this.width, this.height)
    }

    @computed get cell(): CellSprite {
        return this.board.get(this.unit.cell)
    }

    async attackAnimation(event: { target: Unit, damage: number }) {
        const { timestamp, pos } = this
        const targetPos = this.board.get(event.target).pos
        return new Promise((resolve, reject) => {
            this.attacking = {
                startTime: timestamp,
                startPos: pos,
                targetPos: targetPos,
                damage: event.damage,
                resolve: resolve
            }
        })
    }

    async animatePathMove(fromCell: Cell, path: Cell[]) {
        const { board } = this

        const pathWithStart = [fromCell].concat(path)

        let elapsed = 0
        const duration = 200
        while (true) {
            elapsed += await board.ui.time.nextFrame()
            const t = Math.min(1, elapsed / duration)
            const progress = t * (pathWithStart.length - 1)
            const i = Math.floor(progress)
            const j = Math.ceil(progress)

            const startCell = pathWithStart[i]
            const endCell = pathWithStart[j]
            const frac = progress - Math.floor(progress)

            const startPos = board.get(startCell).pos
            const endPos = board.get(endCell).pos
            this.pos = ScreenVector.lerp(startPos, endPos, frac)

            if (t >= 1)
                break
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.attacking) {
            this.drawAttacking(ctx)
        }

        const { board, unit, moved, pos, timestamp } = this
        const altTile = timestamp % 500 >= 250
        const tileIndex = unit.tileIndex + (altTile ? this.tileset.columns : 0)
        const tileset = moved ? board.ui.assets.grayscaleCreatures : board.ui.assets.creatures

        ctx.globalAlpha = this.alpha
        tileset.drawTile(ctx, tileIndex, pos.x, pos.y, this.width, this.height)
        ctx.globalAlpha = 1
    }

    drawAttacking(ctx: CanvasRenderingContext2D) {
        const { attacking, timestamp } = this
        if (!attacking) return

        const { startTime, startPos, targetPos, resolve } = attacking

        const attackTime = timestamp - startTime
        const bumpDuration = 150
        const t = attackTime / bumpDuration


        // Do the little bump (halfway to target and back again)
        if (t < 0.5) {
            this.pos = ScreenVector.lerp(startPos, targetPos, t)
        } else {
            this.pos = ScreenVector.lerp(targetPos, startPos, t)
        }

        if (t >= 1) {
            // Finished attack animation
            this.attacking = null
            resolve()
            return
        }
    }

    async fadeOut() {
        const { board } = this

        let elapsed = 0
        const duration = 200
        while (true) {
            elapsed += await board.ui.time.nextFrame()
            const t = Math.min(1, elapsed / duration)
            this.alpha = 1 - t

            if (t >= 1)
                break
        }
    }

    /** Draw move and attack radius, as when selected on the board */
    drawInfoUnderlay(ctx: CanvasRenderingContext2D) {
        const { board } = this

        ctx.fillStyle = "rgba(51, 153, 255, 0.5)"
        for (const cell of this.unit.reachableUnoccupiedCells) {
            const spos = board.get(cell).pos
            ctx.fillRect(spos.x, spos.y, this.width, this.height)
        }

        ctx.fillStyle = "rgba(255, 48, 48, 0.5)"
        for (const cell of this.unit.attackBorderCells) {
            const spos = board.get(cell).pos
            ctx.fillRect(spos.x, spos.y, this.width, this.height)
        }
    }

    drawSelectionIndicator(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "white"
        ctx.lineWidth = 2

        let p = this.topLeft.addXY(2, 2)
        ctx.beginPath()
        ctx.moveTo(p.x, p.y + 5)
        ctx.lineTo(p.x, p.y)
        ctx.lineTo(p.x + 5, p.y)
        ctx.stroke()

        p = this.topRight.addXY(-2, 2)
        ctx.beginPath()
        ctx.moveTo(p.x, p.y + 5)
        ctx.lineTo(p.x, p.y)
        ctx.lineTo(p.x - 5, p.y)
        ctx.stroke()

        p = this.bottomLeft.addXY(2, -2)
        ctx.beginPath()
        ctx.moveTo(p.x, p.y - 5)
        ctx.lineTo(p.x, p.y)
        ctx.lineTo(p.x + 5, p.y)
        ctx.stroke()
        
        p = this.bottomRight.addXY(-2, -2)
        ctx.beginPath()
        ctx.moveTo(p.x, p.y - 5)
        ctx.lineTo(p.x, p.y)
        ctx.lineTo(p.x - 5, p.y)
        ctx.stroke()
    }

    drawHealthBar(ctx: CanvasRenderingContext2D) {
        const { unit, bottomLeft, width, height } = this
        if (unit.defeated) return

        if (this.unit.team === Team.Player) {
            ctx.fillStyle = "rgb(86, 194, 236)"
            ctx.strokeStyle = "#247789"
            ctx.lineWidth = 0.5
        } else {
            ctx.fillStyle = "rgb(235, 98, 106)"
            ctx.strokeStyle = "#8b3635"
            ctx.lineWidth = 0.5
        }

        const barHeight = 1.5
        const padWidth = 2
        const barWidth = width - padWidth*2 - 5
        const fillWidth = unit.fracHealth * barWidth
        ctx.fillRect(bottomLeft.x + padWidth + 5, bottomLeft.y-barHeight-1, fillWidth, barHeight)
        ctx.strokeRect(bottomLeft.x + padWidth + 5, bottomLeft.y-barHeight-1, barWidth, barHeight)

        if (this.unit.team === Team.Player) {
            ctx.fillStyle = "rgba(86, 194, 236, 0.9)"
        } else {
            ctx.fillStyle = "rgba(235, 98, 106, 0.9)"
        }

        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.font = "bold 5px pixelmix"
        ctx.fillText(unit.health.toString().padStart(2, '0'), bottomLeft.x, bottomLeft.y-barHeight-1)

    }
}   