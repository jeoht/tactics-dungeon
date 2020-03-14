import { GameView } from "./GameView"
import { observable, computed, action, autorun, IReactionDisposer } from "mobx"
import { Cell } from "./Cell"
import { PointVector } from "./PointVector"
import _ = require("lodash")
import { Unit, Team } from "./Unit"
import { AI } from "./AI"
import { BOARD_COLS, BOARD_ROWS } from "./settings"
import { Structure, Biome, Pattern } from "./Tile"
import { Class, Peep } from "./Peep"
import { Block, floorOne, MapBase } from "./MapBase"

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
}

type BasicFloorEventType = 'floorCleared'

export type FloorEvent = { type: BasicFloorEventType } | AttackEvent | PathMoveEvent | TeleportEvent | EndMoveEvent | StartPhaseEvent | EndPhaseEvent | DefeatedEvent

export class Floor {
    @observable cells: Cell[] = []
    @observable units: Unit[] = []
    @observable eventLog: FloorEvent[] = []
    ai: AI
    disposers: IReactionDisposer[]  = []
    @observable phase: Team = Team.Player
    base: MapBase

    @computed get save() {
        return {
            base: this.base.save,
            cells: this.cells.map(c => c.save),
            units: this.units.map(u => u.save),
            phase: this.phase,
        }
    }

    constructor(props: { team: Peep[] } | Floor['save']) {
        if ('cells' in props) {
            this.base = new MapBase(props.base)
            this.cells = props.cells.map(c => new Cell(this, c))
            this.units = props.units.map(u => new Unit(this, u))
            this.phase = props.phase
        } else {
            this.base = floorOne
            this.loadMap(floorOne, props.team)
        }

        this.ai = new AI(this, Team.Enemy)

        // Victory condition
        this.disposers.push(autorun(() => {
            if (this.units.length && this.units.every(u => u.team === Team.Player)) {
                this.event('floorCleared')
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

    @action loadMap(base: MapBase, team: Peep[]) {
        for (let i = 0; i < base.width; i++) {
            for (let j = 0; j < base.height; j++) {
                const pos = new PointVector(i, j)
                const cell = new Cell(this, { pos, blocks: base.blocks[i][j] })
                this.cells.push(cell)
            }
        }

        // Resolve spawns
        const teamLeft = team.slice()
        for (const cell of this.cells) {
            if (cell.blockSet.has(Block.EnemySpawn)) {
                this.spawnUnit(new Peep({ class: Class.Skeleton }), { team: Team.Enemy, cell: cell })
            } else if (cell.blockSet.has(Block.PlayerSpawn)) {
                const peep = teamLeft.pop()
                if (peep)
                    this.spawnUnit(peep, { team: Team.Player, cell: cell })
            }
        }
    }

    @computed get width(): number {
        return this.base.width
    }

    @computed get height(): number {
        return this.base.height
    }

    @computed get playerUnits(): Unit[] {
        return this.units.filter(u => u.team === Team.Player)
    }

    @computed get spawnableCells(): Cell[] {
        return this.cells.filter(c => c.pathable && !c.unit)
    }

    @computed get unitsByPos(): {[key: string]: Unit|undefined} {
        return _.keyBy(this.units, u => u.pos.key)
    }

    @computed get cellsByPos(): {[key: string]: Cell|undefined} {
        return _.keyBy(this.cells, c => c.pos.key)
    }

    cellAt(pos: PointVector): Cell|undefined {
        return this.cellsByPos[pos.key]
    }

    unitAt(pos: PointVector): Unit|undefined {
        return this.unitsByPos[pos.key]
    }

    spawnUnit(peep: Peep, props: { cell?: Cell, team: Team }): Unit {
        const cell = props.cell || _.sample(this.spawnableCells) as Cell
        const unit = new Unit(this, { pos: cell.pos, peep: peep, team: props.team })
        this.units.push(unit)
        return unit
    }

    @action removeUnit(unit: Unit) {
        this.units = this.units.filter(u => u !== unit)
    }

    @action event(event: FloorEvent|BasicFloorEventType) {
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