import React = require("react")
import { useContext } from "react"
import { action } from "mobx"
import { useObserver } from "mobx-react-lite"

import { GameContext } from "./GameView"
import { PeepBadge } from "./PeepBadge"
import { Peep } from "./Peep"

function AbilitiesTab(props: { peep: Peep }) {
    const { peep } = props

    const levels = Array.from(peep.abilityLevels).reverse()

    return <>
        {levels.map(level => <section key={level.level}>
            <h3>Level {level.level}</h3>
            {level.abilities.map(ability => <button key={ability.name} className="btn ability">
                <div>
                    <h4>{ability.name}</h4>
                    <span>{peep.knows(ability) ? `Learned` : `1 AP`}</span>
                </div>
                <p>{ability.description}</p>
            </button>)}
        </section>)}
    </>
}

export function PeepScreen(props: { peepId: string, tab: 'equipment'|'abilities' }) {
    const { peepId, tab } = props
    const { world, ui } = useContext(GameContext)
    const peep = world.team.find(p => p.id === peepId)!

    const changeName = action((e: React.ChangeEvent<HTMLInputElement>) => {
        peep.name = e.currentTarget.value
    })

    const back = () => ui.goto('team')
    const gotoEquipment = () => ui.goto({ id: 'peep', peepId: peepId, tab: 'equipment' })
    const gotoAbilities = () => ui.goto({ id: 'peep', peepId: peepId, tab: 'abilities' })
    const promote = () => peep.promote()

    return useObserver(() => {
        return <div className="menu PeepScreen">
            <header className="d-flex align-items-center">
                <button className="back" onClick={back}/>
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
            <div className="tabs">
                <button onClick={gotoEquipment}>Equipment</button>
                <button onClick={gotoAbilities}>Abilities</button>
            </div>
            {tab === 'equipment' ? null : <AbilitiesTab peep={peep}/>}
        </div>
    })
}