import { useContext } from "react"
import { GameContext } from "./GameView"
import { Unit } from "./Unit"
import React = require("react")

export function UnitBadge(props: { unit: Unit }) {
    const { unit } = props
    const { ui } = useContext(GameContext)

    const dataUrl = ui.assets.tileToDataUrl(ui.assets.creatures, unit.tileIndex)
    return <img src={dataUrl}/>
}