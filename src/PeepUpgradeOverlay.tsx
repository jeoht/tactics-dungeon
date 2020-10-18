import { useContext } from "react"
import React = require("react")
import { PeepBadge } from "./PeepBadge"
import { FloorContext } from "./GameView"
import styled from "styled-components"
import { Overlay } from "./Overlay"
import { action } from "mobx"

const PeepUpgradeDiv = styled.div`
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    > div {
        border: 1px solid #ccc;
        width: 100%;
        max-width: 90vw;
    }

    header {
        text-align: center;
        padding: 0.6rem;
        font-size: 0.7rem;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
            width: 1.2rem;
            margin-left: 0.2rem;
            margin-right: 0.2rem;
        }
    }

    ul {
        padding: 0;
        list-style-type: none;
    }

    li {
        background-color: #333;
        padding: 0.2rem;
    }

    h4 {
        font-size: 1rem;
    }

    p {
        font-size: 0.5rem;
        margin: 0;
    }
`

export function PeepUpgradeOverlay(props: { peepId: string }) {
    const { ui, world } = useContext(FloorContext)
    const peep = world.peeps.find(p => p.id === props.peepId)!

    const upgrades = [
        {
            name: "Counter",
            desc: "Strike back against melee attacks."
        },

    ]

    const doUpgrade = action((upgrade: any) => {
        ui.goto('dungeon')
    })

    return <Overlay>
        <PeepUpgradeDiv>
            <div>
                <header>
                    Choose new ability for <PeepBadge peep={peep} /> {peep.name}
                </header>
                <ul>
                    {upgrades.map(upgrade => <li onClick={() => doUpgrade(upgrade)} key={upgrade.name}>

                        <div>
                            <h4>{upgrade.name}</h4>
                            <p>{upgrade.desc}</p>
                        </div>
                    </li>)}
                </ul>
            </div>
        </PeepUpgradeDiv>
    </Overlay>
}
