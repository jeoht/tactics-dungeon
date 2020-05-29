import { observable, computed, action } from "mobx"

import { PointVector } from "./PointVector"
import { Unit } from "./Unit"
import { Floor } from "./Floor"
import { Block } from "./MapBase"
import { bresenham } from "./pathfinding"
import { Placeable } from "./Placeable"
import { Chest } from "./Chest"

export class Cell {
    readonly floor: Floor
    readonly pos: PointVector
    readonly random: number = Math.random()
    @observable blocks: Block[]
    @observable contents: Placeable[] = []

    constructor(floor: Floor, props: { pos: PointVector, blocks: Block[] } | Cell['save']) {
        this.floor = floor
        this.blocks = props.blocks
        if ('random' in props) {
            this.pos = new PointVector(props.x, props.y)
            this.random = props.random
        } else {
            this.pos = props.pos
        }
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
            random: this.random
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
        return !this.isWall
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
        return this.contents.find(c => c instanceof Chest)
    }

    @action add(thing: Placeable) {
        if (thing.cell) {
            thing.cell.remove(thing)
        }
        thing.cell = this
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