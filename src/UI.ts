import { Assets } from "./Assets"
import { observable, action } from "mobx"
import { World } from "./World"
import { TimeReactor } from "./TimeReactor"
import { CanvasBoard } from "./CanvasBoard"


export type PeepScreenRef = {
    id: 'peep'
    peepId: string
    tab: 'equipment'|'abilities'
}

export type SimpleScreenId = 'titleScreen'|'dungeon'|'board'|'enemyPhase'|'event'|'floorCleared'|'team'
export type ScreenRef = { id: SimpleScreenId } | PeepScreenRef

export class UI {
    @observable screen: ScreenRef = { id: 'titleScreen' }
    @observable.ref board?: CanvasBoard
    world: World
    assets: Assets
    time: TimeReactor

    constructor(world: World, assets: Assets) {
        this.world = world
        this.assets = assets
        this.time = new TimeReactor()
    }

    @action goto(screen: SimpleScreenId | ScreenRef) {
        if (typeof screen === "string")
            this.screen = { id: screen }
        else
            this.screen = screen
    }
}