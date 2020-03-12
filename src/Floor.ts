import { GameView } from "./GameView"
import { observable, computed, action, autorun, IReactionDisposer } from "mobx"
import { Cell } from "./Cell"
import { PointVector } from "./PointVector"
import _ = require("lodash")
import { Unit, Team } from "./Unit"
import { AI } from "./AI"
import { Feature, MapDefinition } from "./MapDefinition"
import { BOARD_COLS, BOARD_ROWS } from "./settings"
import { Structure, Biome, Pattern } from "./Tile"
import { Class, UnitSpec, Peep } from "./Peep"

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
    @observable grid: Cell[][] = []
    boardWidth: number = BOARD_COLS
    boardHeight: number = BOARD_ROWS
    @observable eventLog: FloorEvent[] = []
    ai: AI
    disposers: IReactionDisposer[]  = []
    @observable phase: Team = Team.Player

    constructor(team: Peep[]) {
        const map2: MapDefinition = {
            key: `
                ########
                #e>>>>e#
                #..ee..#
                #......#
                ###..###
                ________
                ________
                ________
                ________
                __pppp__
                ________
                ________
            `,
            where: {
                '.': [Biome.Stone, Pattern.Floor],
                '#': [Biome.Stone, Pattern.Wall],
                '>': [Biome.Stone, Structure.DownStair],
                '_': [Biome.Stone, Pattern.Floor],
                'e': [Biome.Stone, Pattern.Floor, Feature.EnemySpawn],
                'p': [Biome.Stone, Pattern.Floor, Feature.PlayerSpawn]
            }
        }

        const map: MapDefinition = {
            key: `
                ########
                #..>>..#
                #.####.#
                #...e..#
                ###..###
                __#__#__
                _##__##_
                __#__#__
                _#____#_
                __pppp___
                _#_##_#_
                ########
            `,
            where: {
                '.': [Biome.Mossy, Pattern.Floor],
                '#': [Biome.Mossy, Pattern.Wall],
                '>': [Biome.Mossy, Structure.DownStair],
                '_': [Biome.Mossy, Pattern.Floor],
                'e': [Biome.Mossy, Pattern.Floor, Feature.EnemySpawn],
                'p': [Biome.Mossy, Pattern.Floor, Feature.PlayerSpawn]
            }
        }
        const map3: MapDefinition = {
            key: `
                ______##########
                _p____#......e.#
                _p____..##..e>.#
                _p____..##..e>.#
                _p____#......e.#
                ______##########
            `,
            where: {
                '.': [Biome.Mossy, Pattern.Floor],
                '#': [Biome.Mossy, Pattern.Wall],
                '>': [Biome.Mossy, Structure.DownStair],
                '_': [Biome.Mossy, Pattern.Floor],
                'e': [Biome.Mossy, Pattern.Floor, Feature.EnemySpawn],
                'p': [Biome.Mossy, Pattern.Floor, Feature.PlayerSpawn]
            }
        }

        this.loadMap(map, team)

        this.ai = new AI(this, Team.Enemy)

        // Victory condition
        this.disposers.push(autorun(() => {
            if (this.units.every(u => u.team === Team.Player)) {
                this.event('floorCleared')
            }
        }))

        // Turn ends
        this.disposers.push(autorun(() => {
            if (this.units.filter(u => u.team === this.phase).every(u => u.moved)) {
                this.endPhase()
            }
        }))
    }

    dispose() {
        for (const disposer of this.disposers) {
            disposer()
        }
    }

    @action loadMap(defs: MapDefinition, team: Peep[]) {
        const lines = defs.key.trim().split("\n").map(l => l.trim())

        for (let x = 0; x < this.boardWidth; x++) {
            this.grid[x] = []
            for (let y = 0; y < this.boardHeight; y++) {
                const def = defs.where[lines[y][x]]
                this.grid[x][y] = new Cell(this, x, y, def)
            }
        }

        // Resolve patterns
        for (const cell of this.cells) {
            const { biome, pattern } = cell
            if (!pattern) continue

            const cols = 38
            if (pattern === Pattern.Floor)
                cell.tileIndex = biome*cols + (Math.random() > 0.5 ? Structure.Floor : Structure.FloorIndent)
            if (pattern === Pattern.Wall) {
                cell.tileIndex = biome*cols + cell.wallType
            }
        }

        // Resolve features
        const teamLeft = team.slice()
        for (const cell of this.cells) {
            if (cell.features.has(Feature.EnemySpawn)) {
                this.spawnUnit(new Peep({ class: Class.Skeleton }), { team: Team.Enemy, cell: cell })
            } else if (cell.features.has(Feature.PlayerSpawn)) {
                const peep = teamLeft.pop()
                if (peep)
                    this.spawnUnit(peep, { team: Team.Player, cell: cell })
            }
        }
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

    @computed get playerUnits(): Unit[] {
        return this.units.filter(u => u.team === Team.Player)
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

    spawnUnit(peep: Peep, props: { cell?: Cell, team: Team }): Unit {
        const cell = props.cell || _.sample(this.spawnableCells) as Cell
        return new Unit(cell, peep, props.team)
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