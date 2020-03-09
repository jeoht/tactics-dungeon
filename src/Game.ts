import { Assets } from "./Assets"
import { World } from "./World"
import { UI } from "./UI"
import { computed, toJS } from "mobx"

declare const window: any

class Debug {
    game: Game
    constructor(game: Game) {
        this.game = game
        window.debug = this
        window.world = game.world
    }

    @computed get lastEvent() {
        return toJS(this.game.world.eventLog[this.game.world.eventLog.length-1])
    }
}

export class Game {
    world: World
    ui: UI
    constructor(world: World, ui: UI) {
        this.world = world
        this.ui = ui

        const debug = new Debug(this)
    }
}