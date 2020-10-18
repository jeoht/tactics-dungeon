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
        margin-bottom: 0.5rem;

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
        background-color: #000;
        padding: 1rem 0.8rem;
        border: 0.1rem solid #999;
        display: flex;
        align-items: center;
        margin-bottom: 0.8rem;

        img {
            min-width: 1.8rem;
            min-height: 1.8rem;
            margin-right: 0.5rem;
        }

        h4 {
            font-size: 1rem;
        }

        p {
            font-size: 0.5rem;
            margin: 0;
        }
    }

`

export function PeepUpgradeOverlay(props: { peepId: string }) {
    const { ui, world } = useContext(FloorContext)
    const peep = world.peeps.find(p => p.id === props.peepId)!

    const upgrades = [
        {
            name: "Counter",
            desc: "Strike back against melee attacks.",
            icon: ui.assets.tileToDataUrl({ tilesetId: 'items', index: 209 })
        },
        {
            name: "Swap",
            desc: "Move into an ally to swap places.",
            icon: ui.assets.tileToDataUrl({ tilesetId: 'items', index: 227 })
        },
        {
            name: "Sunburst",
            desc: "Once per floor, deal 1 damage in radius 2 around unit.",
            icon: ui.assets.tileToDataUrl({ tilesetId: 'items', index: 101 })
        }
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
                        <img src={upgrade.icon} />
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
