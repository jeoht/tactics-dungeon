import * as React from 'react'
import { useObserver } from 'mobx-react'

import { CanvasScene } from './BoardView'
import { GameUI } from './GameUI'
import { Game } from './Game'
import { UnitView } from './UnitView'
import { UnitActionChoiceState } from './UIState'
import { action } from 'mobx'

function ActionChoices(props: { game: Game }) {
    const { ui } = props.game
    const { unit } = ui.state as UnitActionChoiceState
   
    const fight = action(() => {

    })
    
    const wait = action(() => {
        unit.endMove()
    })

    return <ul className="ActionChoices">
        <li onClick={fight}>Fight</li>
        <li onClick={wait}>Wait</li>
    </ul>

}

function BoardFooter(props: { game: Game }) {
    const { ui } = props.game

    return useObserver(() => <footer>
        {ui.state.type === 'unitActionChoice' && <ActionChoices game={props.game}/>}
    </footer>)
}

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
        return <>
            <header></header>
            <canvas ref={canvasRef} id="board"></canvas>
            <BoardFooter game={game}/>
        </>
    })
}