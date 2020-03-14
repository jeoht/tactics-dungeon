import { observable, computed } from "mobx"

import { PointVector } from "./PointVector"
import { Unit } from "./Unit"
import { CellDef } from "./MapDefinition"
import { Pattern, Structure } from "./Tile"
import { Floor } from "./Floor"

export class Cell {
    readonly floor: Floor
    readonly def: CellDef
    readonly pos: PointVector
    readonly random: number = Math.random()

    @computed get save() {
        return {
            x: this.pos.x,
            y: this.pos.y,
            def: this.def,
            random: this.random
        }
    }

    constructor(floor: Floor, props: { pos: PointVector, def: CellDef } | Cell['save']) {
        this.floor = floor
        this.def = props.def
        if ('random' in props) {
            this.pos = new PointVector(props.x, props.y)
            this.random = props.random
        } else {
            this.pos = props.pos
            this.def = props.def
        }
    }

    @computed get x(): number {
        return this.pos.x
    }

    @computed get y(): number {
        return this.pos.y
    }

    @computed get unit(): Unit|undefined {
        return this.floor.unitAt(this.pos)
    }

    @computed get pathable() {
        return !this.isWall
    }

    @computed get features() {
        return new Set(this.def[2] ? [this.def[2]] : [])
    }

    @computed get biome() {
        return this.def[0]
    }

    @computed get pattern() {
        return typeof this.def[1] === 'string' ? this.def[1] : undefined
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
        return this.pattern === Pattern.Wall
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