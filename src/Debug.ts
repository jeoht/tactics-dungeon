import { computed, autorun, toJS, action } from "mobx"
import { Game } from "./Game"
import { World } from "./World"

declare const window: any

/** Debug commands and inspection from the JS console */
export class Debug {
    game: Game
    constructor(game: Game) {
        this.game = game
        window.debug = this
        window.game = game
        window.ui = game.ui

        autorun(() => window.world = game.world)
        autorun(() => window.floor = game.world.floor)
        autorun(() => window.board = game.ui.board)
    }

    @computed get lastEvent() {
        const { floor } = this.game.world
        if (floor)
            return toJS(floor.eventLog[floor.eventLog.length - 1])
        else
            return undefined
    }

    @action restart() {
        this.game.world = World.create()
        this.game.ui.screen = { id: 'titleScreen' }
    }
}