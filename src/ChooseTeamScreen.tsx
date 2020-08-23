import { action, observable } from "mobx"

import { GameContext } from "./GameView"
import { useContext } from "react"
import styled from "styled-components"
import { Creature, TileRef } from "./Tile"
import React = require("react")
import { useLocalStore, useObserver } from "mobx-react-lite"
import classNames = require("classnames")
import { PeepKind } from "./PeepKind"
import { World } from "./World"
import { Peep } from "./Peep"
import { UI } from "./UI"

const ChooseTeamDiv = styled.div`
    h1 {
        font-size: 1rem; 
        text-align: center;
        padding: 1rem;
    }

    ul.team {
        list-style-type: none;
        display: flex;
        justify-content: space-between;
        margin-top: 0.5rem;
        padding: 0 1rem;

        li {
            width: calc(2rem + 0.75rem);
            height: calc(2rem + 0.75rem);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ccc;
        }

        img {
            width: 48px;
        }
    }

    ul.choices {
        list-style-type: none;
        padding: 1rem;
        display: grid;
        justify-items: center;  
        grid-template-columns: repeat(5, 1fr);
        row-gap: 18px;

        img {
            width: 48px;
        }

        li {
            padding: 6px;
            border: 2px solid rgba(0, 0, 0, 0);
        }

        li.highlight {
            border: 2px solid lightblue;
        }

        li.locked {
            position: relative;
        }

        li.locked img {
            filter: grayscale(100%);
            opacity: 0.8;
        }

        li.locked::after {
            content: '';
            display: block;
            position: absolute;
            width: 70%;
            height: 70%;
            left: 50%;
            top: 50%;
            transform: translate(-55%, -50%);
            background: url("/padlock.png");
            background-size: cover;
            background-repeat: no-repeat;
            filter: grayscale(100%);
            opacity: 0.8;
        }
    }

    button {
        width: 100%;
        font-size: 1rem;
    }
`


type Choice = {
    name: string
    tile: TileRef
    locked?: true
}

const CHOICES: Choice[] = [
    PeepKind.SunPaladin,
    PeepKind.Esper,
    PeepKind.Ranger,
    PeepKind.Sniper,
    PeepKind.Bird
]

class ChooseTeamState {
    @observable.ref highlight: Choice | null = null
    @observable team: (Choice | null)[] = [null, null, null, null]

    constructor(readonly ui: UI, readonly world: World) {
    }

    @action choose(choice: Choice) {
        if (this.team.includes(choice))
            return

        for (let i = 0; i < this.team.length; i++) {
            if (this.team[i] === null) {
                this.team[i] = choice
                break
            }
        }
    }

    @action unchoose(choice: Choice) {
        for (let i = 0; i < this.team.length; i++) {
            if (this.team[i] === choice) {
                this.team[i] = null
            }
        }
    }

    @action setHighlight(choice: Choice) {
        this.highlight = choice
    }

    @action.bound startGame() {
        if (this.team.includes(null))
            return

        const team = this.team as PeepKind[]
        this.world.peeps = team.map(choice => Peep.create({ kind: choice }))
        this.ui.goto('dungeon')
    }
}

const InfoBoxDiv = styled.div`
    padding: 0 2rem;

    h2 {
        font-size: 2rem;
    }

    ul {
        padding-top: 1rem;
        padding-left: 2rem;
        list-style-position: outside;
    }

    li {
        margin-bottom: 1rem;
    }
`

function InfoBox(props: { choice: Choice }) {
    const { choice } = props

    return <InfoBoxDiv>
        <h2>{choice.name}</h2>
        <ul>
            <li>Should be centered on the li element</li>
        </ul>
    </InfoBoxDiv>
}

export function ChooseTeamScreen() {
    const { world, ui } = useContext(GameContext)

    const state = useLocalStore(() => new ChooseTeamState(ui, world))

    return useObserver(() => <ChooseTeamDiv>
        <h1>
            Choose Your Team
        </h1>
        <ul className="team">
            {state.team.map((choice, i) => <li key={i} onClick={() => choice && state.unchoose(choice)}>
                {choice === null ? "Empty" : <img src={ui.assets.tileToDataUrl(choice.tile)} />}
            </li>)}
            {/* Chosen team goes here */}
        </ul>
        <ul className="choices">
            {CHOICES.map(choice => {
                const dataUrl = ui.assets.tileToDataUrl(choice.tile)

                return <li className={classNames(choice.locked && "locked", (choice === state.highlight) && 'highlight')} key={choice.name} onClick={() => state.choose(choice)}>
                    <img src={dataUrl} />
                </li>
            })}
        </ul>
        {state.highlight && <InfoBox choice={state.highlight} />}
        <button className="btn" onClick={state.startGame} disabled={state.team.includes(null)}>Start</button>
    </ChooseTeamDiv >)
}