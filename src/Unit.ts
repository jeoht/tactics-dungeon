import { Cell } from "./Cell"
import { dijkstra, dijkstraRange } from "./pathfinding"
import { observable, computed, action } from "mobx"
import _ = require("lodash")
import { nameByRace } from "fantasy-name-generator"
import { format } from "d3"

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
    @observable team: Team
    @observable moved: boolean = false
    @observable moveRange: number = 3
    @observable inventory: string[] = ['teleport']
    @observable health: number = 10
    @observable maxHealth: number = 10

    @computed get defeated() {
        return this.health <= 0
    }

    constructor(cell: Cell, stats: UnitStats, team: Team) {
        this._cell = cell
        this._cell.unit = this
        this.stats = stats
        this.team = team
    }

    /** Move along a given path, constrained by this unit's ability to do so */
    moveAlong(path: Cell[]) {
        // Truncate the path if it runs into something
        const blockIndex = path.findIndex(c => !this.canPathThrough(c))
        if (blockIndex !== -1) {
            path = path.slice(0, blockIndex)
        }

        // Truncate the path if it's outside our max move range
        if (path.length > this.moveRange) {
            path = path.slice(0, this.moveRange)
        }

        // Go as far along the path as we can and still end up somewhere
        for (let i = path.length-1; i >= 0; i--) {
            const cell = path[i]
            if (this.canOccupy(cell)) {
                path = path.slice(0, i+1)
                break
            }
        }

        if (!path.length)
            return // Not going anywhere

        const from = this.cell
        this.cell = path[path.length-1]
        this.cell.world.event({ type: 'pathMove', unit: this, fromCell: from, path: path })
    }

    teleportTo(cell: Cell) {
        const from = this.cell
        this.cell = cell
        this.cell.world.event({ type: 'teleport', unit: this, fromCell: from, toCell: cell })
    }

    canAttackFrom(cell: Cell, enemy: Unit): boolean {
        return cell.neighbors.includes(enemy.cell)
    }

    canAttackFromHere(enemy: Unit): boolean {
        return this.canAttackFrom(this.cell, enemy)
    }

    set cell(cell: Cell) {
        const from = this._cell
        if (from)
            from.unit = undefined

        this._cell = cell
        this._cell.unit = this
    }

    get cell(): Cell {
        return this._cell
    }

    @computed get tileIndex(): number {
        if (this.stats.class === Class.Rookie) {
            return 47
        } else if (this.stats.class === Class.Skeleton) {
            return 370
        }

        return 0
    }

    @computed get fracHealth(): number {
        return this.health / this.maxHealth
    }

    @computed get unitsOnMyTeam(): Unit[] {
        return this.cell.world.units.filter(u => u.team === this.team)
    }

    /** Find all cells which this unit could occupy in a single move. */
    @computed get reachableUnoccupiedCells(): Cell[] {
        return dijkstraRange({
            start: this.cell,
            range: this.moveRange,
            expand: node => node.neighbors.filter(n => this.canPathThrough(n))
        }).filter(c => this.canOccupy(c))
    }

    /** Find all cells which the unit can attack in the next turn, but not move into */
    @computed get attackBorderCells(): Cell[] {
        const nonBorderCells = new Set<Cell>()
        const candidates = new Set<Cell>()
        for (const cell of this.reachableUnoccupiedCells) {
            nonBorderCells.add(cell)
            for (const c of cell.neighbors) {
                candidates.add(c)
            }
        }

        return Array.from(candidates).filter(c => !nonBorderCells.has(c))
    }

    @computed get enemies() {
        return this.cell.world.units.filter(u => this.isEnemy(u))
    }

    /** Get the shortest path to a point where we can attack some enemy from */
    @computed get pathTowardsAttackPosition() {
        const goal = (node: Cell) => this.canOccupy(node) && this.enemies.some(enemy => this.canAttackFrom(node, enemy))
        return dijkstra({
            start: this.cell,
            goal: goal,
            expand: node => node.neighbors.filter(n => this.canPathThrough(n))
        })
    }

    @action attack(enemy: Unit) {
        const damage = 4
        this.cell.world.eventLog.push({ type: 'attack', unit: this, target: enemy, damage: damage })

        enemy.health -= damage
        if (enemy.health <= 0) {
            enemy.defeat()
        }
    }

    @action defeat() {
        const { world } = this.cell
        this.cell.unit = undefined
        
        world.eventLog.push({ type: 'defeated', unit: this })

        if (this.unitsOnMyTeam.length === 0) {
            if (this.team === Team.Enemy) {
                world.eventLog.push({ type: 'floorCleared' })
            } else {
                // player defeat stuff todo
            }
        }
    }

    @action endMove() {
        this.moved = true
        this.cell.world.eventLog.push({ type: 'endMove', unit: this })

        if (this.unitsOnMyTeam.every(unit => unit.moved)) {
            this.cell.world.endPhase(this.team)
        }
    }

    canOccupy(cell: Cell) {
        return (!cell.unit || cell.unit === this) && cell.pathable
    }

    canPathThrough(cell: Cell): boolean {
        return cell.pathable && (!cell.unit || cell.unit.team === this.team)
    }

    getPathTo(cell: Cell): Cell[]|null {
        return dijkstra({
            start: this.cell,
            goal: (node: Cell) => node === cell,
            expand: node => node.neighbors.filter(n => this.canPathThrough(n))
        })
    }

    getPathToAttack(enemy: Unit) {
        const goal = (node: Cell) => this.canOccupy(node) && this.canAttackFrom(node, enemy)
        return dijkstra({
            start: this.cell,
            goal: goal,
            expand: node => node.neighbors.filter(n => this.canPathThrough(n))
        })
    }

    isEnemy(other: Unit): boolean {
        return other.team !== this.team
    }
}