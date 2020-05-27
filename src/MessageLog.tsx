import { observer } from "mobx-react-lite"
import { useContext } from "react"
import React = require("react")
import { GameContext } from "./GameView"
import { FloorEvent } from "./Floor"

function transcribeEvent(ev: FloorEvent, i: number) {
    console.log(ev)
    if (ev.type == "attack") {
        return <>
            {ev.unit.peep.name} hits {ev.target.peep.name} for {ev.damage} damage
        </>
    } else {
        return null
    }
}

export const MessageLog = observer(function MessageLog() {
    const { world } = useContext(GameContext)
    if (!world.floor) return null
    const { eventLog } = world.floor

    const messages = []
    for (let i = eventLog.length-1; i > 0; i--) {
        const ev = eventLog[i]

        const msg = transcribeEvent(ev, i)
        if (msg) {
            messages.push(msg)
        }

        if (messages.length >= 2)
            break
    }

    return <ul className="MessageLog">
        {messages.map((msg, i) => <li key={i}>{msg}</li>)}
    </ul>
})
