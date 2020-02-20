import * as _ from 'lodash'
import './index.scss'
import { observable, computed, action, autorun } from 'mobx'
import { dijkstra } from './pathfinding'
import { PointVector } from './PointVector'
import { Tileset } from './Tileset'
import { GameView } from './GameView'
import { Game } from './Game'
import { Assets } from './Assets'



declare global {
    interface Window { 
        game: Game
        view: GameView
    }
}

async function main() {
    const game = new Game()

    const assets = new Assets()
    await assets.load()

    const view = new GameView(game, assets)
    view.start()

    // Debug
    window.game = game
    window.view = view
}

main()