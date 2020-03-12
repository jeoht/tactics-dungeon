import { Assets } from "./Assets"
import { computed, observable, action } from "mobx"
import { World } from "./World"
import { Cell } from "./Cell"
import { Unit } from "./Unit"
import { TimeReactor } from "./TimeReactor"
import { UnitDragState } from "./TouchInterface"
import { Peep } from "./Peep"
import { CanvasBoard } from "./CanvasBoard"


export type PeepScreenRef = {
    id: 'peep'
    peepId: string
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