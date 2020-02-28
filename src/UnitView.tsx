import React = require("react")
import { Unit } from "./Unit"
import { Game } from "./Game"
import { action } from "mobx"

export function UnitView(props: { game: Game, unit: Unit }) {
    const { game, unit } = props
    const { ui } = game
    const canvasRef = React.createRef<HTMLCanvasElement>()

    React.useEffect(() => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext("2d")!

        const width = ui.cellScreenWidth
        const height = ui.cellScreenHeight
        const scale = window.devicePixelRatio
        canvas.width = width*scale
        canvas.height = height*scale
        ctx.scale(scale, scale)

        let altTile = false
        const frame = () => {
            altTile = !altTile
            const tileIndex = unit.tileIndex + (altTile ? ui.assets.creatures.columns : 0)
            ui.assets.creatures.drawTile(ctx, tileIndex, 0, 0, ui.cellScreenWidth, ui.cellScreenHeight)
            requestAnimationFrame(frame)
        }
        requestAnimationFrame(frame)
    })

    const dismiss = action(() => {
        ui.showing = { screen: 'board' }
    })

    return <div className="UnitView">
        <canvas ref={canvasRef} width={ui.cellScreenWidth} height={ui.cellScreenHeight}/>
        <button onClick={dismiss}>x</button>
        Move Range: {unit.moveRange}
    </div>
}