import { observable, computed, action, autorun, IReactionDisposer } from "mobx"
import { Cell } from "./Cell"
import { PointVector } from "./PointVector"
import _ = require("lodash")
import { Unit, Team } from "./Unit"
import { Class, Peep } from "./Peep"
import { Block, MapBase } from "./MapBase"
import { generateMap } from "./mapGeneration"

export class FloorMap {
    @observable cells: Cell[] = []
    @observable units: Unit[] = []
    disposers: IReactionDisposer[]  = []

    @computed get save() {
        return {
            cells: this.cells.map(c => c.save),
            units: this.units.map(u => u.save)
        }
    }

    constructor(props: { team: Peep[] } | Floor['save']) {
        if ('cells' in props) {
            this.base = new MapBase(props.base)
            this.cells = props.cells.map(c => new Cell(this, c))
            this.units = props.units.map(u => new Unit(this, u))
        } else {
            const base = generateMap()
            this.base = base
            this.loadMap(base, props.team)
        }
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
}