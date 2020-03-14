import { observable, computed } from "mobx"

import { PointVector } from "./PointVector"
import { Unit } from "./Unit"
import { Floor } from "./Floor"
import { Block } from "./MapBase"

export class Cell {
    readonly floor: Floor
    readonly pos: PointVector
    readonly random: number = Math.random()
    @observable blocks: Block[]

    constructor(floor: Floor, props: { pos: PointVector, blocks: Block[] } | Cell['save']) {
        this.floor = floor
        this.blocks = props.blocks
        if ('random' in props) {
            this.pos = new PointVector(props.x, props.y)
            this.random = props.random
        } else {
            this.pos = props.pos
            this.blocks = props.blocks
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

    @computed get unit(): Unit|undefined {
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

    @computed get north(): Cell|undefined {
        return this.floor.cellAt(this.pos.north())
    }

    @computed get east(): Cell|undefined {
        return this.floor.cellAt(this.pos.east())
    }

    @computed get south(): Cell|undefined {
        return this.floor.cellAt(this.pos.south())
    }

    @computed get west(): Cell|undefined {
        return this.floor.cellAt(this.pos.west())
    }

    isAdjacentTo(otherCell: Cell) {
        return this.pos.manhattanDistance(otherCell.pos) === 1
    }
}