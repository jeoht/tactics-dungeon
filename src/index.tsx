import * as _ from 'lodash'
import './index.scss'
import { observable, computed, action, autorun } from 'mobx'
import { dijkstra } from './pathfinding'
import { PointVector } from './PointVector'
import { Tileset } from './Tileset'
import { GameView } from './GameView'
import { Game } from './Game'
import { Assets } from './Assets'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { World } from './World'
import { UIState } from './UIState'



declare global {
    interface Window { 
        game: Game
    }
}

async function main() {
    const world = new World()
    const assets = new Assets()
    await assets.load()
    const ui = new UIState(world, assets)
    const game = new Game(world, ui)


    const root = document.querySelector("#root")!
    ReactDOM.render(<GameView game={game}/>, root)

    // Debug
    window.game = game
}

main()