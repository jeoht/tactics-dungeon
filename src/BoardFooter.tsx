import { observer, useObserver } from "mobx-react-lite"
import { useContext } from "react"
import { action, untracked } from "mobx"
import React = require("react")

import { FloorContext } from "./GameView"
import { Unit } from "./Unit"
import { Item } from "./Item"
import { AbilityDef } from "./AbilityDef"
import { SnipeAction } from "./UnitAction"

const ActionChoices = observer(function ActionChoices(props: { unit: Unit }) {
    const { unit } = props
    const { ui } = useContext(FloorContext)
    const touch = ui.board!.touch

    const openNearby = action(() => {
        unit.openNearby()
    })

    const useItem = action((item: Item) => {
        if (item.effectId === 'teleport') {
            touch.state = { type: 'targetAbility', unit: unit, ability: 'teleport' }
        } else {
            unit.useItem(item)
        }
    })

    const useAbility = action((ability: AbilityDef) => {
        touch.state = { type: 'targetAction', unit: unit, action: new SnipeAction(unit) }
    })

    return <ul className="ActionChoices">
        {unit.consumables.map((item, i) => <li key={i} onClick={() => useItem(item)}>
            {item.name}
        </li>)}
        {unit.peep.actionAbilities.map(ab => <li key={ab.id} onClick={() => useAbility(ab)}>
            {ab.name}
        </li>)}
        {unit.canPickupBelow && <li onClick={() => unit.pickupBelow()}>Get Item</li>}
        {unit.canOpenNearby && <li onClick={openNearby}>Open</li>}
    </ul>
})

const TargetAbilityInfo = observer(function TargetAbilityInfo() {
    return <div className="TargetAbilityInfo">
        <h3>scroll of teleport</h3>
        <p>Teleports unit anywhere on the map. One-time use item. Doesn't cost an action.</p>
    </div>
})

const TargetActionInfo = () => {
    const { board } = useContext(FloorContext)

    const cancelAction = action(() => {
        board.touch.state = { type: 'board' }
    })
    return <ul className="ActionChoices">
        <li onClick={cancelAction}>Cancel</li>
    </ul>
}

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

    const help = action(() => {
        ui.goto('help')
    })

    return <ul className="MainFooter">
        <li onClick={endTurn}>End<br />Turn</li>
        <li onClick={retreat}>Retreat</li>
        <li onClick={help}>Help</li>
    </ul>
}

export function BoardFooter() {
    const { ui } = useContext(FloorContext)

    return useObserver(() => {
        const touch = ui.board?.touch

        const contents = () => {
            if (!touch) return null

            if (touch.selectedUnit && touch.selectedUnit.playerMove) {
                return <ActionChoices unit={touch.selectedUnit} />
            } else if (touch.state.type === 'targetAction') {
                return <TargetActionInfo />
            } else if (touch.state.type === 'targetAbility') {
                return <TargetAbilityInfo />
            } else if (touch.state.type === 'board') {
                return <MainFooter />
            } else {
                return null
            }
        }

        return <footer className="BoardFooter">{contents()}</footer>
    })
}