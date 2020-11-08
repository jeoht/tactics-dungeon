import { useContext } from "react"
import React = require("react")
import { PeepBadge } from "./PeepBadge"
import { FloorContext } from "./GameView"
import styled from "styled-components"
import { Overlay } from "./Overlay"
import { action } from "mobx"
import { Peep } from "./Peep"
import { TileRef } from "./Tile"
import { PeepKind } from "./PeepKind"
import _ = require("lodash")
import { AbilityDef } from "./AbilityDef"

const PeepUpgradeDiv = styled.div`
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #eee;

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
        background-color: #222;
        border: 2px solid #666;
        padding: 1rem 0.8rem;
        display: flex;
        align-items: center;
        margin-bottom: 0.8rem;

        img {
            min-width: 1.5rem;
            min-height: 1.5rem;
            margin-right: 0.8rem;
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

type PotentialUpgrade = {
    name: string
    description: string
    tile: TileRef
}

function getUpgradesFor(peep: Peep): PotentialUpgrade[] {
    return peep.learnableNewAbilities
    return [
        {
            name: "Counter",
            desc: "Strike back against melee attacks.",
            icon: { tilesetId: 'items', index: 209 }
        },
        {
            name: "Swap",
            desc: "Move into an ally to swap places.",
            icon: { tilesetId: 'items', index: 227 }
        },
        {
            name: "Sunburst",
            desc: "Once per floor, deal 1 damage in radius 2 around unit.",
            icon: { tilesetId: 'items', index: 101 }
        }
    ]
}

function PeepPromoter(props: { peep: Peep }) {
    const { ui } = useContext(FloorContext)
    const { peep } = props
    const kinds = _.sampleSize(peep.kind.promotionOptions, 3)

    const doClassChange = action((kind: PeepKind) => {
        peep.kind = kind
        ui.goto('dungeon')
    })

    return <PeepUpgradeDiv>
        <div>
            <header>
                Choose a class for <PeepBadge peep={peep} /> {peep.name}
            </header>
            <ul>
                {kinds.map(kind => <li onClick={() => doClassChange(kind)} key={kind.id}>
                    <img src={ui.assets.tileToDataUrl(kind.tile)} />
                    <div>
                        <h4>{kind.name}</h4>
                        <p>Promote {peep.name} to {kind.name}</p>
                    </div>
                </li>)}
            </ul>
        </div>
    </PeepUpgradeDiv>
}


export function PeepUpgradeOverlay(props: { peepId: string }) {
    const { ui, world } = useContext(FloorContext)
    const peep = world.peeps.find(p => p.id === props.peepId)!

    const upgrades = getUpgradesFor(peep)

    const doUpgrade = action((upgrade: AbilityDef) => {
        peep.abilityLevels[upgrade.id] = 1
        ui.goto('dungeon')
    })

    return <Overlay>
        {!!peep.kind.promotionOptions.length && <PeepPromoter peep={peep} />}
        {!peep.kind.promotionOptions.length && <PeepUpgradeDiv>
            <div>
                <header>
                    Choose new ability for <PeepBadge peep={peep} /> {peep.name}
                </header>
                <ul>
                    {upgrades.map(upgrade => <li onClick={() => doUpgrade(upgrade)} key={upgrade.name}>
                        <img src={ui.assets.tileToDataUrl(upgrade.tile)} />
                        <div>
                            <h4>{upgrade.name}</h4>
                            <p>{upgrade.description}</p>
                        </div>
                    </li>)}
                </ul>
            </div>
        </PeepUpgradeDiv>}
    </Overlay>
}
