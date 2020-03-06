import * as React from 'react'
import { useObserver, observer } from 'mobx-react-lite'

import { Game } from './Game'
import { action } from 'mobx'
import { Team } from './Unit'
import { TitleScreen } from './TitleScreen'
import { useContext, useEffect } from 'react'
import { UI, SelectedUnitState } from './UI'
import { CanvasBoard } from './CanvasBoard'

export const GameContext = React.createContext<{ game: Game, ui: UI }>({} as any)

const ActionChoices = observer(function ActionChoices() {
    const { ui } = useContext(GameContext)
    const { unit } = ui.state as SelectedUnitState
    
    const teleport = action(() => {
        ui.state = { type: 'targetAbility', unit: unit, ability: 'teleport' }
    })

    return <ul className="ActionChoices">
        {unit.inventory.length && <li onClick={teleport}>Teleport x1</li>}
        {!unit.inventory.length && <li className="disabled">Teleport x0</li>}
    </ul>
})

const TargetAbilityInfo = observer(function TargetAbilityInfo() {
    return <div className="TargetAbilityInfo">
        <h3>scroll of teleport</h3>
        <p>Teleports unit anywhere on the map. One-time use item. Doesn't cost an action.</p>
    </div>
})

const BoardFooter = observer(function BoardFooter() {
    const { ui } = useContext(GameContext)

    if (ui.state.type === 'selectedUnit') {
        return <ActionChoices/>
    } else if (ui.state.type === 'targetAbility') {
        return <TargetAbilityInfo/>
    } else {
        return <footer/>
    }
})

const BoardHeader = observer(function BoardHeader() {
    return <header/>
})

const BoardCanvas = observer(() => {
    const { game, ui } = useContext(GameContext)
    const canvasRef = React.createRef<HTMLCanvasElement>()

    let board: CanvasBoard|null = null
    useEffect(() => {
        // Set the canvas 
        if (!board && canvasRef.current) {
            board = new CanvasBoard(game, canvasRef.current)
            ui.time.add(board)
        }

        return () => {
            if (board) {
                ui.time.remove(board)
                board = null
            }
        }
    })

    return <canvas ref={canvasRef} id="board"></canvas>
})

const CurrentScreen = observer(function CurrentScreen() {
    const { ui } = useContext(GameContext)

    if (ui.state.type === 'titleScreen') {
        return <TitleScreen/>
    } else {
        return <>
            <BoardHeader/>
            <BoardCanvas/>
            <BoardFooter/>
        </>
    }    
})

export const GameView = observer(function GameView(props: { game: Game }) {
    const { game } = props
    const { ui } = game

    useEffect(() => {
        ui.time.start()
        return () => ui.time.stop()
    })

    const context = { game: game, ui: ui }

    return <GameContext.Provider value={context}>
        <CurrentScreen/>
    </GameContext.Provider>
})