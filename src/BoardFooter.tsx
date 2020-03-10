import { observer, useObserver } from "mobx-react-lite"
import { useContext } from "react"
import { action } from "mobx"
import React = require("react")

import { GameContext } from "./GameView"
import { SelectedUnitState } from "./UI"

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

const MainFooter = () => {
    const { game } = useContext(GameContext)

    const endTurn = action(() => {
        game.world.endPlayerPhase()
    })

    return <ul className="MainFooter">
        <li onClick={endTurn}>End<br/>Turn</li>
    </ul>
}

export const BoardFooter = observer(function BoardFooter() {
    const { ui } = useContext(GameContext)

    const contents = () => {
        if (ui.selectedUnit && ui.selectedUnit.player) {
            return <ActionChoices/>
        } else if (ui.state.type === 'targetAbility') {
            return <TargetAbilityInfo/>
        } else if (ui.main) {
            return <MainFooter/>
        } else {
            return null
        }
    }

    return <footer>{contents()}</footer>
})