import { Assets } from "./Assets"
import { World } from "./World"
import { UI } from "./UI"
import { computed, toJS, autorun, action } from "mobx"
import { Floor } from "./Floor"

declare const window: any

class Debug {
    game: Game
    constructor(game: Game) {
        this.game = game
        window.debug = this
        window.game = game
        window.world = game.world
        window.ui = game.ui

        autorun(() => window.floor = game.world.floor)
        autorun(() => window.board = game.ui.board)
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
    debug: Debug

    constructor(world: World, ui: UI, save: Game['save']|null) {
        this.world = world
        this.ui = ui
        this.debug = new Debug(this)

        if (save) {
            try {
                // this.load(save)
                this.world.newGame()
            } catch (err) {
                console.error(err)
                this.world.newGame()
            }
        }

        autorun(() => {
            localStorage.setItem('save', JSON.stringify(this.save))
        })
    }

    @computed get save() {
        return {
            world: this.world.save,
            screen: this.ui.screen
        }
    }

    @action load(save: Game['save']) {
        this.world.load(save.world)
        this.ui.screen = save.screen
    }

    @action clearSave() {
        localStorage.removeItem('save')
    }
}