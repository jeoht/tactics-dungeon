import { observable, computed, action, autorun, IReactionDisposer } from "mobx"
import { Cell } from "./Cell"
import { PointVector } from "./PointVector"
import _ = require("lodash")
import { Unit, Team } from "./Unit"
import { AI } from "./AI"
import { Biome } from "./Tile"
import { Peep } from "./Peep"
import { generateMap } from "./mapGeneration"
import { Item } from "./Item"

type AttackEvent = {
    type: 'attack'
    unit: Unit
    target: Unit
    damage: number
}

type PathMoveEvent = {
    type: 'pathMove'
    unit: Unit
    fromCell: Cell
    path: Cell[]
}

type TeleportEvent = {
    type: 'teleport'
    unit: Unit
    fromCell: Cell
    toCell: Cell
}

type EndMoveEvent = {
    type: 'endMove'
    unit: Unit
}

type EndPhaseEvent = {
    type: 'endPhase'
    team: Team
}

type StartPhaseEvent = {
    type: 'startPhase'
    team: Team
}

type DefeatedEvent = {
    type: 'defeated'
    unit: Unit
    by?: Unit
}

type OpenChestEvent = {
    type: 'openChest'
    unit: Unit
    targetCell: Cell
}

type PickupItemEvent = {
    type: 'pickupItem'
    unit: Unit
    item: Item
}

type BasicFloorEventType = 'floorCleared' | 'floorFailed'

export type FloorEvent = { type: BasicFloorEventType } | AttackEvent | PathMoveEvent | TeleportEvent | EndMoveEvent | StartPhaseEvent | EndPhaseEvent | DefeatedEvent | OpenChestEvent | PickupItemEvent

export class Floor {
    @observable cells: Cell[]
    @observable units: Unit[]
    @observable phase: Team
    biome: Biome
    seed: string

    @observable eventLog: FloorEvent[] = []
    disposers: IReactionDisposer[] = []
    ai: AI

    static load(save: Partial<Floor['save']>): Floor {
        const floor = new Floor(_.omit(save, 'cells', 'units'))
        floor.cells = save.cells ? save.cells.map(c => Cell.load(floor, c)) : []
        floor.units = save.units ? save.units.map(u => Unit.load(floor, u)) : []
        return floor
    }

    static create(props: { seed: string, peeps: Peep[] }) {
        const floor = new Floor(props)
        generateMap(floor, { peeps: props.peeps })
        return floor
    }

    constructor(props: Partial<Floor> = {}) {
        this.biome = props.biome ?? Biome.Stone
        this.cells = []
        this.units = []
        this.phase = props.phase ?? Team.Player
        this.seed = props.seed ?? Math.random().toString()
        this.ai = new AI(this, Team.Enemy)
    }

    @computed get save() {
        return {
            biome: this.biome,
            cells: this.cells.map(c => c.save),
            units: this.units.map(u => u.save),
            phase: this.phase,
            seed: this.seed
        }
    }

    prepare() {
        // Victory condition
        this.disposers.push(autorun(() => {
            if (this.units.length && this.units.every(u => u.team === Team.Player)) {
                this.event('floorCleared')
            }
        }))

        // Loss condition
        this.disposers.push(autorun(() => {
            if (this.units.length && this.units.every(u => u.team === Team.Enemy)) {
                this.event('floorFailed')
            }
        }))

        // Turn ends
        this.disposers.push(autorun(() => {
            if (this.units.length && this.units.filter(u => u.team === this.phase).every(u => u.moved)) {
                this.endPhase()
            }
        }))
    }

    dispose() {
        for (const disposer of this.disposers) {
            disposer()
        }
    }

    @computed get width(): number {
        const xs = this.cells.map(c => c.pos.x)
        return 1 + (_.max(xs)! - _.min(xs)!)
    }

    @computed get height(): number {
        const ys = this.cells.map(c => c.pos.y)
        return 1 + (_.max(ys)! - _.min(ys)!)
    }

    @computed get playerUnits(): Unit[] {
        return this.units.filter(u => u.team === Team.Player)
    }

    @computed get unoccupiedCells(): Cell[] {
        return this.cells.filter(c => c.pathable && !c.unit)
    }

    @computed get unitsByPos(): { [key: string]: Unit | undefined } {
        return _.keyBy(this.units, u => u.pos.key)
    }

    @computed get cellsByPos(): { [key: string]: Cell | undefined } {
        return _.keyBy(this.cells, c => c.pos.key)
    }

    cellAt(pos: PointVector): Cell | undefined {
        return this.cellsByPos[pos.key]
    }

    unitAt(pos: PointVector): Unit | undefined {
        return this.unitsByPos[pos.key]
    }

    spawnUnit(peep: Peep, props: { cell?: Cell, team: Team }): Unit {
        const cell = props.cell || _.sample(this.unoccupiedCells) as Cell
        const unit = Unit.create(this, peep, { pos: cell.pos, team: props.team })
        this.units.push(unit)
        return unit
    }

    @action removeUnit(unit: Unit) {
        this.units = this.units.filter(u => u !== unit)
    }

    @action event(event: FloorEvent | BasicFloorEventType) {
        if (typeof event === "string") {
            this.eventLog.push({ type: event })
        } else {
            this.eventLog.push(event)
        }
    }

    startPhase(team: Team) {
        this.event({ type: 'startPhase', team: team })
        this.phase = team

        for (const unit of this.units) {
            if (unit.team === team) {
                unit.moved = false
            }
        }

        if (team === Team.Enemy) {
            // Do AI stuff
            this.ai.doPhase()
        }
    }

    @action endPhase() {
        const { phase } = this
        this.event({ type: 'endPhase', team: phase })

        if (phase === Team.Player) {
            this.startPhase(Team.Enemy)
        } else {
            this.startPhase(Team.Player)
        }
    }
}