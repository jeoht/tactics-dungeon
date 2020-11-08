import { useContext } from "react"
import React = require("react")
import { action } from "mobx"

import { Unit } from "./Unit"
import { PeepBadge } from "./PeepBadge"
import { FloorContext } from "./GameView"
import styled from "styled-components"
import { Overlay } from "./Overlay"

function UnitReport(props: { unit: Unit }) {
    const { ui } = useContext(FloorContext)
    const { unit } = props

    return <li onClick={() => ui.goto({ id: 'upgrade', peepId: unit.peep.id })}>
        <PeepBadge peep={unit.peep} /> {unit.peep.name}
    </li>
}

const FloorClearedDiv = styled.div`
	color: #feffa8;
    height: 100%;
	display: flex;
	align-items: center;
    justify-content: center;
    text-align: center;

    > div {
        margin-top: -1rem;
        flex-grow: 1;
    }

	h1 {
		font-size: 2rem;
    }

	.floor {
		animation: pop 0.25s ease-in-out;
    }

	@keyframes pop {
		0% {
			opacity: 0;
        }
		50% {
			opacity: 0.5;
			transform: scale(1.25);
        }
    }


	.cleared {
		transform: translateX(-500px);
		animation: zoomin 0.1s ease-in-out forwards;
		animation-delay: 0.5s;
    }

	@keyframes zoomin {
		0% {
			opacity: 0;
			transform: translateX(-500px);
        }
		50% {
			transform: translateX(-250px);
        }
		100% {
			opacity: 1;
			transform: translateX(0px);
        }
    }

	.items p {
        color: white;
        font-size: 0.9rem;
    }

	.continue {
		margin-top: 5rem;
		font-size: 0.9rem;
    }

    ul {
        list-style-type: none;
        width: 100%;
        max-width: 90vw;
        margin: auto;
        padding: 0;
    }

    li {
        color: #eee;
        font-size: 0.8rem;
        text-align: left;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.8rem;
        padding: 1rem;
        background-color: #222;
        border: 2px solid #666;

        img {
            padding-right: 0.3rem;
            width: 2rem;
        }
    }
`

export function FloorCleared() {
    const { world, floor } = useContext(FloorContext)

    return <Overlay>
        <FloorClearedDiv>
            <div>
                <h1>
                    <div className="floor">Floor {world.floorDepth}</div>
                    <div className="cleared">Cleared!</div>
                </h1>
                <p>Choose a character to upgrade</p>
                <ul>
                    {floor.playerUnits.map((u, i) => <UnitReport key={i} unit={u} />)}
                </ul>
            </div>
            {/* <section className="items">
                <h3>Items</h3>
                <p>No items acquired.</p>
            </section> */}
        </FloorClearedDiv>
    </Overlay>
}
