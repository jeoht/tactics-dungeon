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

export class Unit {
    private _cell!: Cell
    stats: UnitStats
    team: Team
    moved: boolean = false
    moveRange: number = 3

    constructor(cell: Cell, stats: UnitStats, team: Team) {
        this.cell = cell
        this.stats = stats
        this.team = team
    }

    set cell(cell: Cell) {
        this._cell = cell
        cell.unit = this
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

    moveTo(cell: Cell) {
        this.cell.unit = undefined
        cell.unit = this
        this.cell = cell
    }

    canPathThrough(cell: Cell) {
        return cell.pathable && (!cell.unit || cell.unit === this)
    }

    getPathTo(cell: Cell) {
        return dijkstra({
            start: this.cell,
            goal: cell,
            expand: node => node.neighbors().filter(n => this.canPathThrough(n))
        })
    }

    findCellsInMoveRange() {
        return dijkstraRange({
            start: this.cell,
            range: this.moveRange,
            expand: node => node.neighbors().filter(n => this.canPathThrough(n))
        })
    }
}