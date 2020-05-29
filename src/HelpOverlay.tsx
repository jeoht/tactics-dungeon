import { useContext } from "react"
import React = require("react")
import { action } from "mobx"

import { FloorContext } from "./GameView"


export function HelpOverlay() {
    const { ui, floor } = useContext(FloorContext)

    const back = action(() => {
        ui.goto('board')
    })

    return <div className="HelpOverlay">
        <h2>Hints</h2>
        <ul>
            <li>Drag unit to move</li>
            <li>Select action for unit after moving</li>
            <li>Drag unit into enemy to autoattack</li>
        </ul>
        <button onClick={back} className="btn continue">
            Continue
        </button>
    </div>
}
