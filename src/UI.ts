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
    /** The unit being dragged */
    unit: Unit
    /** The current path the unit will follow on drag release */
    path: Cell[]
    /** Current position of the cursor in screen coordinates */
    cursorPos: ScreenVector
    /** The cell underneath the current cursor position */
    cursorCell: Cell
    /** Enemy underneath the current cursor position, if any */
    cursorEnemy?: Unit
    /** Unit rendering offset relative to the cursor position */
    cursorOffset: ScreenVector
    /** Cells the unit can move to */
    possibleMoves: Cell[]
}

type Showing = { type: 'titleScreen' } | { type: 'board' } | { type: 'selectedUnit', unit: Unit } | DragState | TargetAbilityState | { type: 'unit', unit: Unit }

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

    @action selectUnit(unit: Unit) {
        this.state = { type: 'selectedUnit', unit: unit }
    }

    @action goto(stateType: 'board'|'titleScreen') {
        this.state = { type: stateType }
    }
}