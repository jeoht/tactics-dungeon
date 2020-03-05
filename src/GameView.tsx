import * as React from 'react'
import { useObserver } from 'mobx-react'

import { CanvasScene } from './BoardView'
import { Game } from './Game'
import { SelectedUnitState } from './UIState'
import { action } from 'mobx'
import { Team } from './Unit'

function ActionChoices(props: { game: Game }) {
    const { ui } = props.game
    const { unit } = ui.state as SelectedUnitState
    
    const teleport = action(() => {
        ui.state = { type: 'targetAbility', unit: unit, ability: 'teleport' }
    })

    return <ul className="ActionChoices">
        {unit.inventory.length && <li onClick={teleport}>Teleport x1</li>}
        {!unit.inventory.length && <li className="disabled">Teleport x0</li>}
    </ul>

}

function TargetAbilityInfo() {
    return <div className="TargetAbilityInfo">
        <h3>scroll of teleport</h3>
        <p>Teleports unit anywhere on the map. One-time use item. Doesn't cost an action.</p>
    </div>
}

function BoardFooter(props: { game: Game }) {
    const { ui } = props.game

    function contents() {
        if (ui.state.type === 'selectedUnit') {
            return <ActionChoices game={props.game}/>
        } else if (ui.state.type === 'targetAbility') {
            return <TargetAbilityInfo/>
        } else {
            return null
        }
    }

    return useObserver(() => <footer>
        {contents()}
    </footer>)
}

function BoardHeader(props: { game: Game }) {
    const { ui } = props.game

    function contents() {
        return null
    }

    return useObserver(() => <header>
        {contents()}
    </header>)
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
        // game.world.endPhase(Team.Player)
    })

    return useObserver(() => {
        return <>
            <BoardHeader game={game}/>
            <canvas ref={canvasRef} id="board"></canvas>
            <BoardFooter game={game}/>
        </>
    })
}