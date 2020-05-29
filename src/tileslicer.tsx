import * as _ from 'lodash'
import './index.sass'

import ReactDOM = require('react-dom')
import React = require('react')
import * as mobx from 'mobx'
import { observable, action } from 'mobx'
import { observer, useObserver, useLocalStore } from 'mobx-react-lite'
import { CELL_WIDTH, CELL_HEIGHT } from './settings'

/** 
 * Strict mode for mobx-- all state mutations
 * must happen inside an action
 */
mobx.configure({ enforceActions: 'observed' })

class SlicerState {
    @observable tileIndex: number | null = null
}

function SlicerWithImg(props: { src: string, width?: number }) {
    const state = useLocalStore(() => new SlicerState())

    const width = props.width || 24
    const height = width || 24

    const onMouseMove = action((e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const col = Math.floor(x / width)
        const row = Math.floor(y / height)
        const imgWidth = e.currentTarget.naturalWidth
        const tilesPerRow = Math.ceil(imgWidth / width)
        state.tileIndex = row * tilesPerRow + col
    })

    return useObserver(() => <div>
        <p>{state.tileIndex}</p>
        <img src={props.src} onMouseMove={onMouseMove} />
    </div>)
}

function Tileslicer() {
    return <div>
        <SlicerWithImg src="/oryx_16bit_fantasy_world_trans.png" />
        <SlicerWithImg src="/oryx_16bit_fantasy_creatures_trans.png" />
        <SlicerWithImg src="/oryx_16bit_fantasy_items_trans.png" width={16} />
    </div>
}

async function main() {
    const root = document.querySelector("#root")!
    ReactDOM.render(<Tileslicer />, root)
}

main()