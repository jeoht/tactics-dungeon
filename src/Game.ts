import { Assets } from "./Assets"
import { World } from "./World"
import { UIState } from "./UIState"

export class Game {
    world: World
    ui: UIState
    constructor(world: World, ui: UIState) {
        this.world = world
        this.ui = ui
    }
}