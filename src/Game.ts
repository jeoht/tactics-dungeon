import { World } from "./World"
import { UI } from "./UI"
import { computed, toJS, autorun, action, observable } from "mobx"
import { Debug } from "./Debug"

export class Game {
    @observable.ref world: World
    ui: UI
    debug: Debug

    constructor(world: World, ui: UI, save: Game['save'] | null) {
        this.world = world
        this.ui = ui
        this.debug = new Debug(this)

        if (save) {
            this.load(save)
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
        this.world = World.load(save.world)
        this.ui.goto(save.screen)
    }

    @action clearSave() {
        localStorage.removeItem('save')
    }
}