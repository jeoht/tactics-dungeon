import * as React from 'react'
import { observer } from 'mobx-react-lite'

import { Game } from './Game'
import { TitleScreen } from './TitleScreen'
import { useContext, useEffect } from 'react'
import { UI, SelectedUnitState } from './UI'
import { CanvasBoard } from './CanvasBoard'
import { BoardFooter } from './BoardFooter'
import { World } from './World'
import { Unit } from './Unit'
import { UnitBadge } from './UnitBadge'

export const GameContext = React.createContext<{ game: Game, ui: UI, world: World }>({} as any)

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

function UnitReport(props: { unit: Unit }) {
    const { unit } = props

    return <tr className="UnitReport">
        <td><UnitBadge unit={unit}/> {unit.stats.name}</td>
        <td><span className="levelUp">Level Up!</span></td>
    </tr>
}

function FloorCleared() {
    const { world } = useContext(GameContext)

    return <div className="FloorCleared">
        <h1>
            <div className="floor">Floor 1</div>
            <div className="cleared">Cleared!</div>
        </h1>
        <table className="unitReports">
            {world.playerUnits.map((u, i) => <UnitReport key={i} unit={u}/>)}
        </table>
        <button className="btn continue">
            Continue
        </button>
    </div>
}

const CurrentScreen = observer(function CurrentScreen() {
    const { ui } = useContext(GameContext)

    if (ui.state.type === 'titleScreen') {
        return <TitleScreen/>
    } else {
        return <>
            <BoardHeader/>
            <BoardCanvas/>
            <BoardFooter/>
            {ui.state.type === 'floorCleared' && <FloorCleared/>}
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

    const context = { game: game, ui: ui, world: game.world }

    return <GameContext.Provider value={context}>
        <CurrentScreen/>
    </GameContext.Provider>
})