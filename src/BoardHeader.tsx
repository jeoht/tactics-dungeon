import { observer } from "mobx-react-lite"
import { useContext } from "react"
import React = require("react")
import { FloorContext } from "./GameView"

export const BoardHeader = observer(function BoardHeader() {
    const { world } = useContext(FloorContext)
    return <header className="BoardHeader">
        {world.floorId}
    </header>
})