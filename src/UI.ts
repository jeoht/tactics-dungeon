import { Assets } from "./Assets"
import { computed, observable, action } from "mobx"
import { World } from "./World"
import { ScreenVector } from "./ScreenVector"
import { Cell } from "./Cell"
import { Unit } from "./Unit"
import { TimeReactor } from "./TimeReactor"

export type SelectedUnitState = { type: 'selectedUnit', unit: Unit }
export type TargetAbilityState = { type: 'targetAbility', unit: Unit, ability: 'teleport' }

export type DragState = {
    type: 'dragUnit'
    plan: UnitMovePlan
    /** Current position of the cursor in screen coordinates */
    cursorPos: ScreenVector
    /** The cell underneath the current cursor position */
    cursorCell: Cell
    /** Enemy underneath the current cursor position, if any */
    cursorEnemy?: Unit
    /** Unit rendering offset relative to the cursor position */
    cursorOffset: ScreenVector
}

export type TapMoveState = {
    type: 'tapMove'
    plan: UnitMovePlan
}

export type UnitMovePlan = {
    /** The unit being moved */
    unit: Unit
    /** The current path the unit will follow on plan execution */
    path: Cell[]
    /** Enemy the unit will attack */
    attacking?: Unit
}

type Showing = { type: 'titleScreen' } | { type: 'board' } | { type: 'enemyPhase' } | { type: 'event' } | { type: 'selectedUnit', unit: Unit } | DragState | TargetAbilityState | { type: 'unit', unit: Unit } | { type: 'floorCleared' } | TapMoveState

export class UI {
    @observable state: Showing = { type: 'board' }
    world: World
    assets: Assets
    time: TimeReactor

    constructor(world: World, assets: Assets) {
        this.world = world
        this.assets = assets
        this.time = new TimeReactor()
    }

    @computed get main(): boolean {
        return this.state.type === 'board' || this.state.type === 'dragUnit'
    }

    @computed get selectedUnit(): Unit|null {
        return this.state.type === 'selectedUnit' ? this.state.unit : null
    }

    @action selectUnit(unit: Unit) {
        this.state = { type: 'selectedUnit', unit: unit }
    }

    @action goto(stateType: 'board'|'enemyPhase'|'titleScreen'|'event'|'floorCleared') {
        this.state = { type: stateType }
    }

    @action prepareTapMove(plan: UnitMovePlan) {
        this.state = {
            type: 'tapMove',
            plan: plan
        }        
    }
}