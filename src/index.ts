import * as _ from 'lodash'
import './index.scss'
import { observable, computed, action, autorun } from 'mobx'
import { dijkstra } from './pathfinding'
import { PointVector } from './PointVector'
import { Tileset } from './Tileset'
import { GameView } from './GameView'
import { Game } from './Game'

async function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(img)
    })
}

declare global {
    interface Window { 
        game: Game
        view: GameView
    }
}

async function main() {
    const game = new Game()

    const [world, creatures] = await Promise.all([
        loadImage('oryx_16bit_fantasy_world_trans.png'),
        loadImage('oryx_16bit_fantasy_creatures_trans.png')
    ])
    const worldTileset = new Tileset(world, 24, 24)
    const creaturesTileset = new Tileset(creatures, 24, 24)

    const view = new GameView(game, worldTileset, creaturesTileset)
    view.start()

    // Debug
    window.game = game
    window.view = view
}

main()