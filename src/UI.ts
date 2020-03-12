import { Assets } from "./Assets"
import { computed, observable, action } from "mobx"
import { World } from "./World"
import { Cell } from "./Cell"
import { Unit } from "./Unit"
import { TimeReactor } from "./TimeReactor"
import { UnitDragState } from "./TouchInterface"
import { Peep } from "./Peep"

export type SelectedUnitState = { type: 'selectedUnit', unit: Unit }
export type TargetAbilityState = { type: 'targetAbility', unit: Unit, ability: 'teleport' }

export type TapMoveState = {
    type: 'tapMove'
    plan: UnitMovePlan
}

export type PeepState = {
    type: 'peep'
    peep: Peep
}

export type UnitMovePlan = {
    /** The unit being moved */
    unit: Unit
    /** The current path the unit will follow on plan execution */
    path: Cell[]
    /** Enemy the unit will attack */
    attacking?: Unit
}

type SimpleStateType = 'titleScreen'|'dungeon'|'board'|'enemyPhase'|'event'|'floorCleared'|'team'
type Showing = { type: SimpleStateType } | { type: 'selectedUnit', unit: Unit } | UnitDragState | TargetAbilityState | PeepState | TapMoveState

export class UI {
    @observable state: Showing = { type: 'titleScreen' }
    world: World
    assets: Assets
    time: TimeReactor

    constructor(world: World, assets: Assets) {
        this.world = world
        this.assets = assets
        this.time = new TimeReactor()
    }

    @computed get main(): boolean {
        return this.state.type === 'board' || this.state.type === 'unitDrag'
    }

    @computed get selectedUnit(): Unit|null {
        return this.state.type === 'selectedUnit' ? this.state.unit : null
    }

    @action selectUnit(unit: Unit) {
        this.state = { type: 'selectedUnit', unit: unit }
    }

    @action goto(state: SimpleStateType | Showing) {
        if (typeof state === "string")
            this.state = { type: state }
        else
            this.state = state
    }

    @action prepareTapMove(plan: UnitMovePlan) {
        this.state = {
            type: 'tapMove',
            plan: plan
        }        
    }
}