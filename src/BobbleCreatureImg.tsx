import { computed } from "mobx"
import { useLocalStore, useObserver } from "mobx-react-lite"
import { useContext } from "react"
import React = require("react")

import { GameContext } from "./GameView"
import { Peep } from "./Peep"
import { TileRef } from "./Tile"
import { UI } from "./UI"

class BobbleState {
    constructor(readonly ui: UI, readonly tile: TileRef) {
    }

    @computed get isAltTile(): boolean {
        return this.ui.time.now % 500 >= 250
    }

    @computed get dataUrl1(): string {
        return this.ui.assets.tileToDataUrl(this.tile)
    }

    @computed get dataUrl2(): string {
        const { ui, tile } = this
        const tileset = ui.assets.getTileset(tile.tilesetId)
        return this.ui.assets.tileToDataUrl({ tilesetId: tile.tilesetId, index: tile.index + tileset.columns })
    }

    @computed get dataUrl(): string {
        return this.isAltTile ? this.dataUrl2 : this.dataUrl1
    }
}

export function BobbleCreatureImage(props: { tile: TileRef }) {
    const { ui } = useContext(GameContext)

    const state = useLocalStore(() => new BobbleState(ui, props.tile))

    return useObserver(() => <img src={state.dataUrl} />)
}