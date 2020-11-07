import _ = require("lodash")
import { action } from "mobx"
import { useContext, useEffect } from "react"
import React = require("react")
import styled from "styled-components"
import { GameContext } from "./GameView"

const DungeonMapDiv = styled.div`
.node-row {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
}

.node {
    width: 3em;
    height: 3em;
    border-radius: 3em;
    background-color: green;
}
`

function DungeonMap() {
    const ref = React.createRef<HTMLDivElement>()

    const rows: any[][] = []
    for (let i = 0; i < 10; i++) {
        const row = []
        const nodes = _.random(2, 4)
        for (let i = 0; i < nodes; i++) {
            row.push({})
        }
        rows.push(row)
    }

    useEffect(() => {
        const divs = ref.current!.querySelectorAll("div.node")
        for (const div of Array.from(divs) as HTMLDivElement[]) {
            div.style.backgroundColor = 'red'
        }
    }, [])

    return <DungeonMapDiv ref={ref}>
        {rows.map(row => <div className="node-row">
            {row.map(node => <div className="node">
                <svg className="line" />
            </div>)}
        </div>)}
    </DungeonMapDiv>
}

export function DungeonScreen() {
    const { ui, world } = useContext(GameContext)

    const nextFloor = action(() => {
        world.nextFloor()
        ui.goto('board')
    })
    const gotoTeam = () => ui.goto('team')

    return <div className="DungeonScreen">
        <div className="d-flex mt-4 justify-content-center">
            <button className="td-btn" onClick={nextFloor}>
                Next Floor
            </button>
            <button className="td-btn" onClick={gotoTeam}>
                Team
            </button>
        </div>
        <DungeonMap />
    </div>
}