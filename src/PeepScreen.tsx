import React = require("react")
import { useContext } from "react"
import { action } from "mobx"
import { useObserver, useLocalStore } from "mobx-react-lite"

import { GameContext } from "./GameView"
import { PeepBadge } from "./PeepBadge"
import { Peep } from "./Peep"

function AbilitiesTab(props: { peep: Peep }) {
    const { peep } = props

    return useObserver(() => {
        const levels = Array.from(peep.abilityLevels).reverse()

        return <div className="AbilitiesTab">
            {levels.map(level => <section key={level.level}>
                <h3>Level {level.level}</h3>
                {level.abilities.map(ability => <button onClick={() => peep.learn(ability)} key={ability.name} className="btn ability">
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

type EquipmentSlot = 'weapon' | 'item1' | 'item2'

function EquipmentPicker(props: { peep: Peep, slot: EquipmentSlot, done: () => void }) {
    const { peep, slot, done } = props
    const { world } = useContext(GameContext)

    let stacks = world.inventory.stacks
    if (slot === 'weapon') {
        stacks = stacks.filter(s => s.item.itemType === 'weapon')
    } else {
        stacks = stacks.filter(s => s.item.itemType === 'consumable')
    }

    return <div className="EquipmentPicker overlay">
        <button className="back" onClick={done} />
        <ul>
            {stacks.map(stack => <li key={stack.item.id}>

            </li>)}
        </ul>
    </div>
}

function EquipmentTab(props: { peep: Peep }) {
    const { peep } = props

    const state: { editingSlot?: EquipmentSlot } = useLocalStore(() => ({}))

    return useObserver(() => {
        return <div className="EquipmentTab">
            {state.editingSlot && <EquipmentPicker peep={peep} slot={state.editingSlot} done={action(() => state.editingSlot = undefined)} />}
            <section>
                <h3>Weapon</h3>
                <button className="btn ability" onClick={action(() => state.editingSlot = 'weapon')}>
                    <div>
                        <h4>{peep.weapon ? peep.weapon.name : "None"}</h4>
                    </div>
                    {/* <table>
                        <tbody>
                            <tr>
                                <td>Attack Range</td>
                                <td>3</td>
                            </tr>
                        </tbody>
                    </table> */}
                </button>
            </section>
            <section>
                <h3>Item 1</h3>
                <button className="btn ability">
                    <div>
                        <h4>{peep.item1 ? peep.item1.name : "None"}</h4>
                    </div>
                </button>
            </section>
            <section>
                <h3>Item 2</h3>
                <button className="btn ability">
                    <div>
                        <h4>{peep.item2 ? peep.item2.name : "None"}</h4>
                    </div>
                </button>
            </section>
        </div>
    })
}

export function PeepScreen(props: { peepId: string, tab: 'equipment' | 'abilities' }) {
    const { peepId, tab } = props
    const { world, ui } = useContext(GameContext)
    const peep = world.peeps.find(p => p.id === peepId)!

    const changeName = action((e: React.ChangeEvent<HTMLInputElement>) => {
        peep.name = e.currentTarget.value
    })

    const back = () => ui.goto('team')
    const gotoEquipment = () => ui.goto({ id: 'peep', peepId: peepId, tab: 'equipment' })
    const gotoAbilities = () => ui.goto({ id: 'peep', peepId: peepId, tab: 'abilities' })
    // const promote = () => peep.promote()

    return useObserver(() => {
        return <div className="menu PeepScreen">
            <header className="d-flex align-items-center">
                <button className="back" onClick={back} />
                <PeepBadge peep={peep} />
                <div>
                    <input className="name" type="text" value={peep.name} onChange={changeName} />
                    <br /><span className={`unitClass ${peep.kind.name.replace(' ', '')}`}>{peep.kind.name}</span>
                    {}
                </div>
            </header>
            {/* {peep.canPromote && <section>
                <button className="btn promote" onClick={promote}>Promote Unit</button>
            </section>}
            <div className="tabs">
                <button onClick={gotoEquipment}>Equipment</button>
                <button onClick={gotoAbilities}>Abilities</button>
            </div>
            {tab === 'equipment' ? <EquipmentTab peep={peep}/> : <AbilitiesTab peep={peep}/>} */}
        </div>
    })
}