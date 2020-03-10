import { ScreenVector } from "./ScreenVector"
import { CanvasBoard } from "./CanvasBoard"
import { runInAction } from "mobx"
import { CELL_WIDTH, CELL_HEIGHT } from "./settings"

interface SceneObject {
    frame?: (deltaTime: number) => void
    draw?: (ctx: CanvasRenderingContext2D) => void
}

export class DamageText implements SceneObject {
    board: CanvasBoard
    startPos: ScreenVector
    damage: number
    timePassed: number = 0
    duration: number = 600

    constructor(board: CanvasBoard, damage: number, startPos: ScreenVector) {
        this.board = board
        this.damage = damage
        this.startPos = startPos
        this.board.ui.time.add(this)
    }

    frame(deltaTime: number) {
        this.timePassed += deltaTime

        if (this.timePassed > this.duration) {
            runInAction(() => {
                this.board.ui.time.remove(this)
                this.board.damageTexts = this.board.damageTexts.filter(d => d !== this)
            })
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const { damage, startPos, timePassed } = this
        const bounceDuration: number = 400
        const textInitialPos = startPos.add(new ScreenVector(CELL_WIDTH / 2, CELL_HEIGHT / 2))
        const textBouncePos = textInitialPos.add(new ScreenVector(0, -10))
        const t = timePassed / bounceDuration

        let textPos = textInitialPos
        if (t < 0.5) {
            textPos = ScreenVector.lerp(textInitialPos, textBouncePos, t / 0.5)
        } else {
            textPos = ScreenVector.lerp(textBouncePos, textInitialPos, (t - 0.5) / 0.5)
        }
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = 'bold 12px sans-serif'
        ctx.fillStyle = "rgba(255, 0, 0, 1)"
        ctx.fillText(damage.toString(), textPos.x, textPos.y)
    }
}