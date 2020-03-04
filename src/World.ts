import { GameView } from "./GameView"
import { observable, computed } from "mobx"
import { Cell } from "./Cell"
import { PointVector } from "./PointVector"
import _ = require("lodash")
import { Unit, Class, UnitStats, UnitSpec, Team } from "./Unit"
import { AI } from "./AI"

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

export type WorldEvent = AttackEvent | PathMoveEvent | TeleportEvent | EndMoveEvent | StartPhaseEvent | EndPhaseEvent | DefeatedEvent

export class World {
    @observable grid: Cell[][] = []
    boardWidth: number = 6
    boardHeight: number = 8
    @observable eventLog: WorldEvent[] = []
    ai: AI

    constructor() {
        for (let x = 0; x < this.boardWidth; x++) {
            this.grid[x] = []
            for (let y = 0; y < this.boardHeight; y++) {
                this.grid[x][y] = new Cell(this, x, y)
            }
        }

        this.spawnUnit({ team: Team.Player, class: Class.Rookie })
        this.spawnUnit({ team: Team.Player, class: Class.Rookie })
        this.spawnUnit({ team: Team.Player, class: Class.Rookie })
        this.spawnUnit({ team: Team.Player, class: Class.Rookie })

        this.spawnUnit({ team: Team.Enemy, class: Class.Skeleton })
        this.spawnUnit({ team: Team.Enemy, class: Class.Skeleton })
        this.spawnUnit({ team: Team.Enemy, class: Class.Skeleton })
        this.spawnUnit({ team: Team.Enemy, class: Class.Skeleton })

        this.ai = new AI(this, Team.Enemy)
    }

    @computed get cells(): Cell[] {
        const cells: Cell[] = []
        for (let i = 0 ; i < this.boardWidth; i++) {
            for (let j = 0; j < this.boardHeight; j++) {
                cells.push(this.grid[i][j])
            }
        }
        return cells
    }

    @computed get units(): Unit[] {
        const units = []
        for (const cell of this.cells) {
            if (cell.unit)
                units.push(cell.unit)
        }
        return units
    }

    @computed get spawnableCells(): Cell[] {
        return this.cells.filter(c => c.pathable && !c.unit)
    }

    cellAt(pos: PointVector): Cell|undefined {
        if (pos.x < 0 || pos.y < 0 || pos.x >= this.grid.length || pos.y >= this.grid[0].length)
            return undefined
        else
            return this.grid[pos.x][pos.y]
    }

    spawnUnit(props: UnitSpec & { cell?: Cell, team: Team }): Unit {
        const cell = props.cell || _.sample(this.spawnableCells) as Cell
        const stats = new UnitStats(props)
        return new Unit(cell, stats, props.team)
    }

    event(event: WorldEvent) {
        this.eventLog.push(event)
    }

    startPhase(team: Team) {
        this.event({ type: 'startPhase', team: team })
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

    endPhase(team: Team) {
        this.event({ type: 'endPhase', team: team })
        if (team === Team.Player) {
            this.startPhase(Team.Enemy)
        } else {
            this.startPhase(Team.Player)
        }
    }
}