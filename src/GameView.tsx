import * as React from 'react'
import { useObserver } from 'mobx-react'

import { CanvasScene } from './BoardView'
import { Game } from './Game'
import { SelectedUnitState, UIState } from './UIState'
import { action } from 'mobx'
import { Team } from './Unit'
import { TitleScreen } from './TitleScreen'
import { useContext } from 'react'

export const GameContext = React.createContext<{ game: Game, ui: UIState }>({} as any)

function ActionChoices() {
    const { ui } = useContext(GameContext)
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

function BoardFooter() {
    const { ui } = useContext(GameContext)

    function contents() {
        if (ui.state.type === 'selectedUnit') {
            return <ActionChoices/>
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

function BoardHeader() {
    function contents() {
        return null
    }

    return useObserver(() => <header>
        {contents()}
    </header>)
}

function BoardCanvas() {
    const { game, ui } = useContext(GameContext)
    const canvasRef = React.createRef<HTMLCanvasElement>()

    let boardView: CanvasScene|null = null
    React.useEffect(() => {
        // Set the canvas 
        if (!boardView && canvasRef.current) {
            boardView = new CanvasScene(game, canvasRef.current)
            boardView.start()
            ui.startFrames()
        }
    })

    return <canvas ref={canvasRef} id="board"></canvas>
}

export function GameView(props: { game: Game }) {
    const { game } = props
    const { ui } = game



    function contents() {
        if (ui.state.type === 'titleScreen') {
            return <TitleScreen/>
        } else {
            return <>
                <BoardHeader/>
                <BoardCanvas/>
                <BoardFooter/>
            </>
        }    
    }

    const context = { game: game, ui: game.ui }

    return useObserver(() => {
        return <GameContext.Provider value={context}>
            {contents()}
        </GameContext.Provider>
    })
}