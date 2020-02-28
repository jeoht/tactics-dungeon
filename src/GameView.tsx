import * as React from 'react'

import { BoardView } from './BoardView'
import { GameUI } from './GameUI'
import { Game } from './Game'

export function GameView(props: { game: Game }) {
    const { game } = props

    const canvasRef = React.createRef<HTMLCanvasElement>()

    React.useEffect(() => {
        // Set the canvas renderer
        console.log("boardView")
        const boardView = new BoardView(game, canvasRef.current!)
        boardView.start()
        return () => boardView.stop()
    })

    return <>
        <GameUI game={game}/>
        <canvas ref={canvasRef} id="board"></canvas>
    </>
}