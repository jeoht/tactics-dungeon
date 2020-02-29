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

        ui.assets.creatures.drawTile(ctx, unit.tileIndex, 0, 0, ui.cellScreenWidth, ui.cellScreenHeight)
    })

    const dismiss = action(() => {
        ui.showing = { screen: 'board' }
    })

    return <div className="UnitView">
        <header>
            <canvas ref={canvasRef} width={ui.cellScreenWidth} height={ui.cellScreenHeight}/>
            <button className="close" onClick={dismiss}>x</button>
        </header>
        <table>
            <tr>
                <td>Name</td>
                <td>Elswin</td>
            </tr>
            <tr>
                <td>Speed</td>
                <td>{unit.moveRange}</td>
            </tr>
            <tr>
                <td>Gender</td>
                <td>Mystery</td>
            </tr>
            <tr>
                <td>Personality</td>
                <td>Egosyntonic</td>
            </tr>
        </table>
    </div>
}