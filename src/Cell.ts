import { observable, computed, action } from "mobx"

import { PointVector } from "./PointVector"
import { Unit } from "./Unit"
import { ActiveFloor } from "./Floor"
import { Block } from "./MapBase"
import { bresenham } from "./pathfinding"
import { Chest } from "./Chest"
import { Item, loadItem, isItem } from "./Item"

type Placeable = (Chest | Item) & { blocksMovement?: boolean }

export class Cell {
    @observable blocks: Block[] = []
    @observable contents: Placeable[] = []
    random: number

    static load(floor: ActiveFloor, save: Cell['save']): Cell {
        const cell = new Cell(floor, new PointVector(save.x, save.y), { random: save.random })
        cell.blocks = save.blocks
        cell.contents = (save.contents ?? []).map(c => {
            if (c.type === 'chest')
                return Chest.load(c as Chest['save'])
            else
                return loadItem(c as Item['save'])
        })
        return cell
    }

    static create(floor: ActiveFloor, props: { pos: PointVector, blocks: Block[] }): Cell {
        const cell = new Cell(floor, props.pos)
        cell.blocks = props.blocks
        return cell
    }

    constructor(readonly floor: ActiveFloor, readonly pos: PointVector, props: { random?: number } = {}) {
        this.random = props.random ?? Math.random()
    }

    @computed get biome() {
        return this.floor.biome
    }

    @computed get unoccupied(): boolean {
        return this.pathable && !this.unit
    }

    @computed get save() {
        return {
            x: this.pos.x,
            y: this.pos.y,
            blocks: this.blocks,
            random: this.random,
            contents: this.contents.map(c => c.save)
        }
    }

    @computed get x(): number {
        return this.pos.x
    }

    @computed get y(): number {
        return this.pos.y
    }

    @computed get blockSet(): Set<Block> {
        return new Set(this.blocks)
    }

    @computed get unit(): Unit | undefined {
        return this.floor.unitAt(this.pos)
    }

    @computed get pathable() {
        return !this.isWall && !this.contents.some(c => c.blocksMovement)
    }

    @computed get neighbors(): Cell[] {
        const neighbors = []
        for (const n of this.pos.neighbors()) {
            const cell = this.floor.cellAt(n)
            if (cell) {
                neighbors.push(cell)
            }
        }
        return neighbors
    }

    @computed get isWall(): boolean {
        return this.blockSet.has(Block.Wall)
    }

    @computed get north(): Cell | undefined {
        return this.floor.cellAt(this.pos.north())
    }

    @computed get east(): Cell | undefined {
        return this.floor.cellAt(this.pos.east())
    }

    @computed get south(): Cell | undefined {
        return this.floor.cellAt(this.pos.south())
    }

    @computed get west(): Cell | undefined {
        return this.floor.cellAt(this.pos.west())
    }

    @computed get chest(): Chest | undefined {
        return this.contents.find(c => c instanceof Chest) as Chest
    }

    @computed get items(): Item[] {
        return this.contents.filter(c => isItem(c)) as Item[]
    }

    @action add(thing: Placeable) {
        // if ('cell' in thing) {
        //     if (thing.cell)
        //         thing.cell.remove(thing)
        //     thing.cell = this
        // }
        this.contents.push(thing)
    }

    @action remove(thing: Placeable) {
        this.contents.splice(this.contents.indexOf(thing), 1)
    }

    isAdjacentTo(otherCell: Cell) {
        return this.pos.manhattanDistance(otherCell.pos) === 1
    }

    lineOfSight(otherCell: Cell): Cell[] | undefined {
        const line: Cell[] = []
        let blocked: boolean = false
        bresenham(this.x, this.y, otherCell.x, otherCell.y, (x, y) => {
            const cell = this.floor.cellAt(new PointVector(x, y))
            if (!cell || cell.isWall) {
                blocked = true
                return false
            } else {
                if (cell !== this)
                    line.push(cell)
                return true
            }
        })

        if (blocked) {
            return undefined
        } else {
            return line
        }
    }
}