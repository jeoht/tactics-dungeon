import { useContext } from "react"
import React = require("react")
import { action } from "mobx"

import { Unit } from "./Unit"
import { UnitBadge } from "./UnitBadge"
import { GameContext } from "./GameView"

function UnitReport(props: { unit: Unit }) {
    const { unit } = props

    return <tr className="UnitReport">
        <td><UnitBadge unit={unit}/> {unit.stats.name}</td>
        <td><span className="levelUp">Level Up!</span></td>
    </tr>
}

export function FloorCleared() {
    const { ui, world } = useContext(GameContext)

    const onwards = action(() => {
        ui.goto('dungeon')
    })

    return <div className="FloorCleared">
        <h1>
            <div className="floor">Floor 1</div>
            <div className="cleared">Cleared!</div>
        </h1>
        <table className="unitReports">
            <tbody>
                {world.playerUnits.map((u, i) => <UnitReport key={i} unit={u}/>)}
            </tbody>
        </table>
        {/* <section className="items">
            <h3>Items</h3>
            <p>No items acquired.</p>
        </section> */}
        <button onClick={onwards} className="btn continue">
            Continue
        </button>
    </div>
}
