import React = require("react")
import { Unit } from "./Unit"
import { Game } from "./Game"
import { action } from "mobx"
import { useObserver } from "mobx-react"

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

    return useObserver(() => <div className="UnitView">
        <header>
            <canvas ref={canvasRef} width={ui.cellScreenWidth} height={ui.cellScreenHeight}/>
            <div>
                <input className="name" type="text" value={unit.stats.name} onChange={action((e: React.ChangeEvent<HTMLInputElement>) => unit.stats.name = e.currentTarget.value)}/>
                <br/><span className={`unitClass ${unit.stats.class}`}>{unit.stats.class}</span>

            </div>
        </header>
        <table>
            <tbody>
                <tr>
                    <td>Speed</td>
                    <td>{unit.moveRange}</td>
                </tr>
                <tr>
                    <td>Gender</td>
                    <td>{unit.stats.gender}</td>
                </tr>
                {/* <tr>
                    <td>Personality</td>
                    <td></td>
                </tr> */}
            </tbody>
        </table>
        <footer>
            <button className="close" onClick={dismiss}>&lt; Back</button>
        </footer>
    </div>)
}