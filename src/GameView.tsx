import * as React from 'react'
import { useContext, useEffect } from 'react'
import { observer, useObserver } from 'mobx-react-lite'
import { runInAction, action } from 'mobx'
import _ = require('lodash')

import { Game } from './Game'
import { TitleScreen } from './TitleScreen'
import { UI } from './UI'
import { CanvasBoard } from './CanvasBoard'
import { BoardFooter } from './BoardFooter'
import { World } from './World'
import { FloorCleared } from './FloorCleared'
import { Floor } from './Floor'
import { PeepScreen } from './PeepScreen'
import { TeamScreen } from './TeamScreen'
import { MessageLog } from './MessageLog'

export const GameContext = React.createContext<{ game: Game, ui: UI, world: World }>({} as any)
export const FloorContext = React.createContext<{ ui: UI, world: World, floor: Floor }>({} as any)

const BoardHeader = observer(function BoardHeader() {
    return <header className="BoardHeader"/>
})

function BoardCanvas() {
    const { ui, floor } = useContext(FloorContext)
    const canvasRef = React.createRef<HTMLCanvasElement>()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        runInAction(() => {
            ui.board = new CanvasBoard(floor, ui, canvas)
            ui.time.add(ui.board)
        })

        return () => {
            runInAction(() => {
                ui.time.remove(ui.board!)
                ui.board = undefined    
            })
        }
    }, [])

    return <canvas ref={canvasRef} id="board"></canvas>
}

function DungeonScreen() {
    const { ui, world } = useContext(GameContext)

    const nextFloor = action(() => {
        world.nextFloor()
        ui.goto('board')
    })
    const gotoTeam = () => ui.goto('team')

    return <div className="DungeonScreen">
        <div className="d-flex mt-4 justify-content-center">
            <button className="td-btn" onClick={nextFloor}>
                Next Floor
            </button>
            <button className="td-btn" onClick={gotoTeam}>
                Team
            </button>
        </div>
    </div>
}

function CurrentScreen() {
    const { ui, world } = useContext(GameContext)

    // useEffect(() => ui.goto({ type: 'peep', peep: world.team[0] }), [])

    return useObserver(() => {
        if (ui.screen.id === 'titleScreen') {
            return <TitleScreen/>
        } else if (ui.screen.id === 'dungeon') {
            return <DungeonScreen/>
        } else if (ui.screen.id === 'team') {
            return <TeamScreen/>
        } else if (ui.screen.id === 'peep') {
            return <PeepScreen peepId={ui.screen.peepId} tab={ui.screen.tab}/>
        } else if (world.floor) {
            const context = { ui: ui, world: world, floor: world.floor }
            return <FloorContext.Provider value={context}>
                <BoardHeader/>
                <div className="boardContainer">
                    <BoardCanvas/>
                    <MessageLog/>
                </div>
                <BoardFooter/>
                {ui.screen.id === 'floorCleared' && <FloorCleared/>}
            </FloorContext.Provider>
        } else {
            return null
        }    
    })
}

export function GameView(props: { game: Game }) {
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
}