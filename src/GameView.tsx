import * as React from 'react'
import { observer, useObserver } from 'mobx-react-lite'

import { Game } from './Game'
import { TitleScreen } from './TitleScreen'
import { useContext, useEffect } from 'react'
import { UI } from './UI'
import { CanvasBoard } from './CanvasBoard'
import { BoardFooter } from './BoardFooter'
import { World } from './World'
import { FloorCleared } from './FloorCleared'
import { PeepBadge } from './PeepBadge'
import { action, autorun, IReactionDisposer, runInAction } from 'mobx'
import { Peep } from './Peep'
import _ = require('lodash')
import { Floor } from './Floor'

export const GameContext = React.createContext<{ game: Game, ui: UI, world: World }>({} as any)
export const FloorContext = React.createContext<{ ui: UI, floor: Floor }>({} as any)

const BoardHeader = observer(function BoardHeader() {
    return <header/>
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

    const nextFloor = () => {
        world.nextFloor()
        ui.goto('board')
    }
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

function TeamScreen() {
    const { ui, world } = useContext(GameContext)

    const gotoPeep = (peep: Peep) => {
        ui.goto({ id: 'peep', peepId: peep.id })
    }

    return <div className="TeamScreen d-flex justify-content-center mt-4">
        <table className="unitReports">
            <tbody>
                {world.team.map(peep => <tr key={peep.id} onClick={() => gotoPeep(peep)}>
                    <td><PeepBadge peep={peep}/> {peep.name}</td>
                    <td><span className="levelUp">Level Up!</span></td>
                </tr>)}
            </tbody>
        </table>
    </div>
}

function PeepScreen(props: { peepId: string }) {
    const { peepId } = props
    const { world } = useContext(GameContext)
    const peep = world.team.find(p => p.id === peepId)!

    const changeName = action((e: React.ChangeEvent<HTMLInputElement>) => {
        peep.name = e.currentTarget.value
    })

    const promote = () => peep.promote()

    return useObserver(() => {
        return <div className="PeepScreen d-flex flex-column justify-content-center mt-2">
            <header className="d-flex align-items-center">
                <PeepBadge peep={peep}/>
                <div>
                    <input className="name" type="text" value={peep.name} onChange={changeName}/>
                    <br/><span className={`unitClass ${peep.class.name.replace(' ', '')}`}>{peep.class.name}</span>
                    {}
                </div>
            </header>
            {peep.canPromote && <section>
                <button className="btn promote" onClick={promote}>Promote Unit</button>
            </section>}
            {Array.from(peep.abilityLevels).reverse().map(level => <section key={level.level}>
                <h3>Level {level.level}</h3>
                {level.abilities.map(ability => <button key={ability.name} className="btn ability">
                    <div>
                        <h4>{ability.name}</h4>
                        <span>{peep.knows(ability) ? `Learned` : `1 AP`}</span>
                    </div>
                    <p>{ability.description}</p>
                </button>)}
            </section>)}
        </div>
    })
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
            return <PeepScreen peepId={ui.screen.peepId}/>
        } else if (world.floor) {
            const context = { ui: ui, floor: world.floor }
            return <FloorContext.Provider value={context}>
                <BoardHeader/>
                <BoardCanvas/>
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