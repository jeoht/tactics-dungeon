import { observable, computed, action } from "mobx"
import _ = require("lodash")

import { Cell } from "./Cell"
import { Peep } from "./Peep"
import { dijkstra, dijkstraRange } from "./pathfinding"

export enum Team {
    Player = "Player",
    Enemy = "Enemy"
}

export class Unit {
    private _cell!: Cell
    peep: Peep
    @observable team: Team
    @observable moved: boolean = false
    @observable moveRange: number = 3
    @observable inventory: string[] = ['teleport']
    @observable health: number = 10
    @observable maxHealth: number = 10

    @computed get defeated() {
        return this.health <= 0
    }

    constructor(cell: Cell, stats: Peep, team: Team) {
        this._cell = cell
        this._cell.unit = this
        this.peep = stats
        this.team = team
    }

    get tileIndex() { return this.peep.tileIndex }

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

    @computed get playerMove(): boolean {
        return this.team === Team.Player && !this.moved
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
        world.eventLog.push({ type: 'defeated', unit: this })
        this.cell.unit = undefined        
    }

    @action endMove() {
        this.cell.world.eventLog.push({ type: 'endMove', unit: this })
        this.moved = true
    }

    canOccupy(cell: Cell) {
        return (!cell.unit || cell.unit === this) && cell.pathable
    }

    canMoveTo(cell: Cell) {
        return this.reachableUnoccupiedCells.includes(cell)
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

    getPathToOccupyEventually(cell: Cell): Cell[]|null {
        if (!this.canOccupy(cell)) return null

        return dijkstra({
            start: this.cell,
            goal: (node: Cell) => node === cell,
            expand: node => node.neighbors.filter(n => this.canPathThrough(n))
        })
    }

    getPathToOccupyThisTurn(cell: Cell): Cell[]|null {
        const path = this.getPathToOccupyEventually(cell)
        if (path && path.length <= this.moveRange)
            return path
        else
            return null
    }

    getPathToAttackEventually(enemy: Unit): Cell[]|null {
        const goal = (node: Cell) => this.canOccupy(node) && this.canAttackFrom(node, enemy)
        return dijkstra({
            start: this.cell,
            goal: goal,
            expand: node => node.neighbors.filter(n => this.canPathThrough(n))
        })
    }

    getPathToAttackThisTurn(enemy: Unit): Cell[]|null {
        const path = this.getPathToAttackEventually(enemy)
        if (path && path.length <= this.moveRange)
            return path
        else
            return null
    }

    isEnemy(other: Unit): boolean {
        return other.team !== this.team
    }
}