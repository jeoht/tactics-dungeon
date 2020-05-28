import { observer } from "mobx-react-lite"
import { useContext } from "react"
import React = require("react")
import { GameContext } from "./GameView"
import { FloorEvent } from "./Floor"
import { Team } from "./Unit"

function transcribeEvent(ev: FloorEvent, i: number) {
    if (ev.type === "attack") {
        return <>
            {ev.unit.displayName} hits {ev.target.displayName} for {ev.damage} damage
        </>
    } else if (ev.type === "defeated") {
        if (ev.unit.team === Team.Player) {
            return <span className="text-danger">
                {ev.unit.displayName} was defeated
            </span>
        } else {
            return <>
                {ev.unit.displayName} was defeated
            </>
        }
    } else {
        return null
    }
}

export const MessageLog = observer(function MessageLog() {
    const { ui } = useContext(GameContext)
    if (!ui.board) return null
    const events = ui.board.messageEvents

    const messages = []
    for (let i = events.length-1; i > 0; i--) {
        const ev = events[i]

        const msg = transcribeEvent(ev, i)
        if (msg) {
            messages.push(msg)
        }

        if (messages.length >= 2)
            break
    }
    messages.reverse()

    return <ul className="MessageLog">
        {messages.map((msg, i) => <li key={i}>{msg}</li>)}
    </ul>
})
