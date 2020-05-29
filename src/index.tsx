import * as _ from 'lodash'
import './index.sass'
import { GameView } from './GameView'
import { Game } from './Game'
import { Assets } from './Assets'

import { World } from './World'
import { UI } from './UI'
import ReactDOM = require('react-dom')
import React = require('react')
import * as mobx from 'mobx'
import { loadSounds } from './Soundboard'
import { loadMusic } from '../public/music'

/** 
 * Strict mode for mobx-- all state mutations
 * must happen inside an action
 */
mobx.configure({ enforceActions: 'observed' })


declare global {
    interface Window {
        game: Game
    }
}

async function main() {
    const world = new World()
    const assets = new Assets()
    const assetLoad = assets.load()
    const soundLoad = loadSounds()
    const musicLoad = loadMusic()
    await assetLoad
    const sounds = await soundLoad
    const music = await musicLoad
    const ui = new UI(world, assets, sounds, music)

    const save = JSON.parse(localStorage.getItem('save') || "null")
    const game = new Game(world, ui, save)



    const root = document.querySelector("#root")!
    ReactDOM.render(<GameView game={game} />, root)

    // Debug
    window.game = game
}

main()