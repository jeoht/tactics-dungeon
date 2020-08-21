import { observable, computed, action } from "mobx"
import _ = require("lodash")

import { Cell } from "./Cell"
import { Peep } from "./Peep"
import { dijkstra, dijkstraRange } from "./pathfinding"
import { Floor } from "./Floor"
import { PointVector } from "./PointVector"
import { Item, Scroll, loadItem, Potion } from "./Item"

export enum Team {
    Player = "Player",
    Enemy = "Enemy"
}

export class Unit {
    @observable pos: PointVector
    @observable team: Team
    @observable moved: boolean
    @observable moveRange: number
    @observable inventory: Item[]
    @observable health: number
    @observable maxHealth: number

    static load(floor: Floor, save: Unit['save']) {
        return new Unit(floor, Peep.load(save.peep), {
            ..._.omit(save, 'peep'),
            pos: new PointVector(save.x, save.y),
            inventory: save.inventory.map(loadItem)
        })
    }

    static create(floor: Floor, peep: Peep, props: { pos: PointVector, team: Team }) {
        return new Unit(floor, peep, props)
    }

    constructor(readonly floor: Floor, readonly peep: Peep, props: Partial<Unit>) {
        this.pos = props.pos ?? new PointVector(0, 0)
        this.team = props.team ?? Team.Enemy
        this.moved = props.moved ?? false
        this.moveRange = props.moveRange ?? 3
        this.inventory = props.inventory ?? [Scroll.create("teleport")]
        this.health = props.health ?? 10
        this.maxHealth = props.maxHealth ?? 10
    }

    @computed get save() {
        return {
            x: this.pos.x,
            y: this.pos.y,
            peep: this.peep.save,
            team: this.team,
            moved: this.moved,
            moveRange: this.moveRange,
            inventory: this.inventory.map(i => i.save),
            health: this.health,
            maxHealth: this.maxHealth
        }
    }

    @computed get defeated() {
        return this.health <= 0
    }

    @computed get displayName() {
        if (this.team === Team.Player) {
            return this.peep.name
        } else {
            return this.peep.class.name
        }
    }

    @computed get attackRange(): number {
        return this.peep.weaponType === 'bow' ? 3 : 1
    }

    @computed get cell(): Cell {
        return this.floor.cellAt(this.pos)!
    }

    set cell(cell: Cell) {
        this.pos = cell.pos
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
        for (let i = path.length - 1; i >= 0; i--) {
            const cell = path[i]
            if (this.canOccupy(cell)) {
                path = path.slice(0, i + 1)
                break
            }
        }

        if (!path.length)
            return // Not going anywhere

        const from = this.cell
        this.cell = path[path.length - 1]
        this.cell.floor.event({ type: 'pathMove', unit: this, fromCell: from, path: path })
    }

    teleportTo(cell: Cell) {
        const from = this.cell
        this.cell = cell
        this.cell.floor.event({ type: 'teleport', unit: this, fromCell: from, toCell: cell })
    }

    canAttackFrom(cell: Cell, enemy: Unit): boolean {
        return this.canAttackCellFrom(cell, enemy.cell)
    }

    canAttackCellFrom(cell: Cell, target: Cell) {
        return cell.isAdjacentTo(target)
        // const line = cell.lineOfSight(target)
        // return !!(line && line.length <= this.attackRange)
    }

    canAttackFromHere(enemy: Unit): boolean {
        return this.canAttackFrom(this.cell, enemy)
    }

    @computed get isPlayerTeam(): boolean {
        return this.team === Team.Player
    }

    @computed get playerMove(): boolean {
        return this.team === Team.Player && !this.moved
    }

    @computed get fracHealth(): number {
        return this.health / this.maxHealth
    }

    @computed get unitsOnMyTeam(): Unit[] {
        return this.cell.floor.units.filter(u => u.team === this.team)
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
        const reachable = new Set(this.reachableUnoccupiedCells)
        const attackCells: Cell[] = []
        for (const target of this.floor.cells) {
            if (reachable.has(target)) continue

            for (const cell of this.reachableUnoccupiedCells) {
                if (this.canAttackCellFrom(cell, target)) {
                    attackCells.push(target)
                    break
                }
            }
        }

        return attackCells
    }

    @computed get enemies() {
        return this.cell.floor.units.filter(u => this.isEnemy(u))
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
        this.cell.floor.event({ type: 'attack', unit: this, target: enemy, damage: damage })

        enemy.health -= damage
        if (enemy.health <= 0) {
            enemy.defeat(this)
        }
    }

    @action defeat(by?: Unit) {
        const { floor } = this
        floor.event({ type: 'defeated', unit: this, by: by })
        floor.removeUnit(this)
    }

    @action endMove() {
        this.cell.floor.event({ type: 'endMove', unit: this })
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

    getPathTo(cell: Cell): Cell[] | null {
        return dijkstra({
            start: this.cell,
            goal: (node: Cell) => node === cell,
            expand: node => node.neighbors.filter(n => this.canPathThrough(n))
        })
    }

    getPathToOccupyEventually(cell: Cell): Cell[] | null {
        if (!this.canOccupy(cell)) return null

        return dijkstra({
            start: this.cell,
            goal: (node: Cell) => node === cell,
            expand: node => node.neighbors.filter(n => this.canPathThrough(n))
        })
    }

    getPathToOccupyThisTurn(cell: Cell): Cell[] | null {
        const path = this.getPathToOccupyEventually(cell)
        if (path && path.length <= this.moveRange)
            return path
        else
            return null
    }

    getPathToAttackEventually(enemy: Unit): Cell[] | null {
        const goal = (node: Cell) => this.canOccupy(node) && this.canAttackFrom(node, enemy)
        return dijkstra({
            start: this.cell,
            goal: goal,
            expand: node => node.neighbors.filter(n => this.canPathThrough(n))
        })
    }

    getPathToAttackThisTurn(enemy: Unit): Cell[] | null {
        const path = this.getPathToAttackEventually(enemy)
        if (path && path.length <= this.moveRange)
            return path
        else
            return null
    }

    isEnemy(other: Unit): boolean {
        return other.team !== this.team
    }

    @action receive(item: Item) {
        this.inventory.push(item)
        this.cell.floor.event({ type: 'pickupItem', unit: this, item: item })
    }

    @computed get canOpenNearby(): boolean {
        return this.cell.neighbors.some(cell => cell.chest && cell.chest.item)
    }

    @action openNearby() {
        const cell = this.cell.neighbors.find(c => c.chest)
        if (cell && cell.chest && cell.chest.item) {
            this.cell.floor.event({ type: 'openChest', unit: this, targetCell: cell })
            const { item } = cell.chest
            cell.chest.item = null
            this.receive(item)
        }
    }

    @computed get consumables() {
        return this.inventory.filter(i => i instanceof Scroll || i instanceof Potion)
    }

    @action heal(amount: number) {
        this.health = Math.min(this.maxHealth, this.health + amount)
    }

    @action removeItem(item: Item) {
        const i = this.inventory.indexOf(item)
        if (i !== -1) {
            this.inventory.splice(i, 1)
        }
    }

    @action useItem(item: Item) {
        if (item.effectId === 'healing') {
            this.heal(10)
        }
        this.removeItem(item)
    }

    @computed get canPickupBelow(): boolean {
        return !!this.cell.items.length
    }

    @action pickupBelow() {
        if (this.cell.items.length) {
            const item = this.cell.items[0]
            this.cell.remove(item)
            this.receive(item)
        }
    }
}