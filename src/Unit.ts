import { Cell } from "./Cell"
import { dijkstra, dijkstraRange } from "./pathfinding"
import { observable } from "mobx"
import _ = require("lodash")
import { nameByRace } from "fantasy-name-generator"

export enum Gender {
    Boy = "Boy",
    Girl = "Girl",
    Soft = "Soft",
    Powerful = "Powerful",
    Mystery = "Mystery"
}

export enum Class {
    Rookie = "Rookie",
    Skeleton = "Skeleton"
}

export enum Team {
    Player = "Player",
    Enemy = "Enemy"
}

function randomGender(): Gender {
    const r = Math.random()

    if (r <= 0.4)
        return Gender.Boy
    else if (r <= 0.8)
        return Gender.Girl
    else
        return _.sample(_.values(Gender)) as Gender
}

function randomName(gender: Gender): string {
    if (gender === Gender.Boy)
        return nameByRace("human", { gender: "male"}) as string
    else if (gender === Gender.Girl)
        return nameByRace("human", { gender: "female"}) as string
    else
        return nameByRace("human") as string
}

export type UnitSpec = {
    class?: Class
    name?: string
    gender?: Gender
}

/** 
 * Represents a unit's base state, before they're actually
 * attached to any position on an active map
 */
export class UnitStats {
    @observable name: string
    @observable gender: Gender
    @observable class: Class

    constructor(props: UnitSpec) {
        this.class = props.class || Class.Rookie
        this.gender = props.gender || randomGender()
        this.name = props.name || randomName(this.gender)
    }
}

type UnitAction = { type: 'attack', target: Unit }

export class Unit {
    private _cell!: Cell
    stats: UnitStats
    team: Team
    moved: boolean = false
    moveRange: number = 3

    constructor(cell: Cell, stats: UnitStats, team: Team) {
        this._cell = cell
        this._cell.unit = this
        this.stats = stats
        this.team = team
    }

    moveTo(cell: Cell) {
        const from = this._cell
        from!.unit = undefined
        this._cell = cell
        cell.unit = this

        cell.world.event({ type: 'move', unit: this, from: from, to: cell })
    }

    get cell(): Cell {
        return this._cell
    }

    get tileIndex(): number {
        if (this.stats.class === Class.Rookie) {
            return 47
        } else if (this.stats.class === Class.Skeleton) {
            return 370
        }

        return 0
    }

    attack(enemy: Unit) {
        this.cell.world.eventLog.push({ type: 'attack', unit: this, target: enemy, damage: 10 })
    }

    endMove() {
        this.moved = true
        this.cell.world.eventLog.push({ type: 'endMove', unit: this })
    }

    canPathThrough(cell: Cell): boolean {
        return cell.pathable && (!cell.unit || cell.unit === this)
    }

    getPathTo(cell: Cell): Cell[] {
        return dijkstra({
            start: this.cell,
            goal: cell,
            expand: node => node.neighbors().filter(n => this.canPathThrough(n))
        })
    }

    findCellsInMoveRange(): Cell[] {
        return dijkstraRange({
            start: this.cell,
            range: this.moveRange,
            expand: node => node.neighbors().filter(n => this.canPathThrough(n))
        })
    }

    isEnemy(other: Unit): boolean {
        return other.team !== this.team
    }
}