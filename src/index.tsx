import * as _ from 'lodash'
import './index.scss'
import { GameView } from './GameView'
import { Game } from './Game'
import { Assets } from './Assets'

import { World } from './World'
import { UIState } from './UIState'
import ReactDOM = require('react-dom')
import React = require('react')



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