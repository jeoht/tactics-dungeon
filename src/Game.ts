import { Assets } from "./Assets"
import { World } from "./World"
import { UI } from "./UI"
import { computed, toJS } from "mobx"
import { Floor } from "./Floor"

declare const window: any

class Debug {
    game: Game
    constructor(game: Game) {
        this.game = game
        window.debug = this
        window.world = game.world
    }

    @computed get lastEvent() {
        const { floor } = this.game.world
        if (floor)
            return toJS(floor.eventLog[floor.eventLog.length-1])
        else
            return undefined
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