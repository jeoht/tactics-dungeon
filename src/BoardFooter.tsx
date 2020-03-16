import { observer, useObserver } from "mobx-react-lite"
import { useContext } from "react"
import { action } from "mobx"
import React = require("react")

import { FloorContext } from "./GameView"
import { Unit } from "./Unit"

function ActionChoices(props: { unit: Unit }) {
    const { unit } = props
    const { ui } = useContext(FloorContext)
    const touch = ui.board!.touch

    const teleport = action(() => {
        touch.state = { type: 'targetAbility', unit: unit, ability: 'teleport' }
    })

    return useObserver(() => <ul className="ActionChoices">
        {unit.inventory.length ? <li onClick={teleport}>Teleport x1</li> : <li className="disabled">Teleport x0</li>}
    </ul>)
}

const TargetAbilityInfo = observer(function TargetAbilityInfo() {
    return <div className="TargetAbilityInfo">
        <h3>scroll of teleport</h3>
        <p>Teleports unit anywhere on the map. One-time use item. Doesn't cost an action.</p>
    </div>
})

const MainFooter = () => {
    const { ui, world, floor } = useContext(FloorContext)

    const retreat = action(() => {
        world.prevFloor()
        ui.goto('dungeon')
    })

    const endTurn = action(() => {
        for (const unit of floor.playerUnits)
            unit.moved = true
    })

    return <ul className="MainFooter">
        <li onClick={endTurn}>End<br/>Turn</li>
        <li onClick={retreat}>Retreat</li>
    </ul>
}

export function BoardFooter() {
    const { ui } = useContext(FloorContext)

    return useObserver(() => {
        const touch = ui.board?.touch

        const contents = () => {
            if (!touch) return null
    
            if (touch.selectedUnit && touch.selectedUnit.playerMove) {
                return <ActionChoices unit={touch.selectedUnit}/>
            } else if (touch.state.type === 'targetAbility') {
                return <TargetAbilityInfo/>
            } else if (touch.state.type === 'board') {
                return <MainFooter/>
            } else {
                return null
            }
        }
    
        return <footer className="BoardFooter">{contents()}</footer>
    })
}