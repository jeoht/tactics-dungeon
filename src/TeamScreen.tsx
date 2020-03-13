import { useContext } from "react"
import React = require("react")

import { GameContext } from "./GameView"
import { Peep } from "./Peep"
import { PeepBadge } from "./PeepBadge"

export function TeamScreen() {
    const { ui, world } = useContext(GameContext)

    const gotoPeep = (peep: Peep) => {
        ui.goto({ id: 'peep', peepId: peep.id, tab: 'abilities' })
    }

    const back = () => ui.goto('dungeon')

    return <div className="menu TeamScreen">
        <header>
            <button className="back" onClick={back}/>
        </header>
        <div className="d-flex justify-content-center mt-4">
            <table className="unitReports">
                <tbody>
                    {world.team.map(peep => <tr key={peep.id} onClick={() => gotoPeep(peep)}>
                        <td><PeepBadge peep={peep}/> {peep.name}</td>
                        <td><span className="levelUp">Level Up!</span></td>
                    </tr>)}
                </tbody>
            </table>
        </div>
    </div>
}