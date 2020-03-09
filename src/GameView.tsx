import * as React from 'react'
import { useObserver, observer } from 'mobx-react-lite'

import { Game } from './Game'
import { action } from 'mobx'
import { Team } from './Unit'
import { TitleScreen } from './TitleScreen'
import { useContext, useEffect } from 'react'
import { UI, SelectedUnitState } from './UI'
import { CanvasBoard } from './CanvasBoard'
import { BoardFooter } from './BoardFooter'

export const GameContext = React.createContext<{ game: Game, ui: UI }>({} as any)

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

function FloorCleared() {
    return <div className="FloorCleared pop">
        <div>
            <div className="floor">Floor 1</div>
            <div className="cleared">Cleared!</div>
        </div>
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

    const context = { game: game, ui: ui }

    return <GameContext.Provider value={context}>
        <CurrentScreen/>
    </GameContext.Provider>
})