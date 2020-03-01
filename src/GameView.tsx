import * as React from 'react'
import { useObserver } from 'mobx-react'

import { CanvasScene } from './BoardView'
import { GameUI } from './GameUI'
import { Game } from './Game'
import { UnitView } from './UnitView'

export function GameView(props: { game: Game }) {
    const { game } = props
    const { ui } = game

    const canvasRef = React.createRef<HTMLCanvasElement>()

    React.useEffect(() => {
        // Set the canvas renderer
        const boardView = new CanvasScene(game, canvasRef.current!)
        boardView.start()
        ui.startFrames()
    })

    return useObserver(() => {
        if (ui.showing.screen === 'board') {
            return <canvas ref={canvasRef} id="board"></canvas>
        } else if (ui.showing.screen === 'unit') {
            return <>
                <UnitView game={game} unit={ui.showing.unit}/>
                <canvas ref={canvasRef} id="board"></canvas>
            </>
        }

        return null
    })
}