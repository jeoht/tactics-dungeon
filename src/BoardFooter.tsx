import { observer, useObserver } from "mobx-react-lite"
import { useContext } from "react"
import { action } from "mobx"
import React = require("react")

import { FloorContext } from "./GameView"
import { SelectedUnitState } from "./UI"

const ActionChoices = observer(function ActionChoices() {
    const { ui } = useContext(FloorContext)
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

const MainFooter = () => {
    const { floor } = useContext(FloorContext)

    const endTurn = action(() => {
        for (const unit of floor.playerUnits)
            unit.moved = true
    })

    return <ul className="MainFooter">
        <li onClick={endTurn}>End<br/>Turn</li>
    </ul>
}

export function BoardFooter() {
    const { ui } = useContext(FloorContext)

    const contents = () => {
        if (ui.selectedUnit && ui.selectedUnit.playerMove) {
            return <ActionChoices/>
        } else if (ui.state.type === 'targetAbility') {
            return <TargetAbilityInfo/>
        } else if (ui.main) {
            return <MainFooter/>
        } else {
            return null
        }
    }

    return useObserver(() => <footer>{contents()}</footer>)
}