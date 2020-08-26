import { useContext } from "react"
import React = require("react")

import { GameContext } from "./GameView"
import { Peep } from "./Peep"

export function PeepBadge(props: { peep: Peep }) {
    const { peep } = props
    const { ui } = useContext(GameContext)

    const dataUrl = ui.assets.tileToDataUrl(peep.tile)
    return <img src={dataUrl} />
}