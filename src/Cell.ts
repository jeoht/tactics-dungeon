import { observable, computed } from "mobx"

import { PointVector } from "./PointVector"
import { Unit } from "./Unit"
import { World } from "./World"
import { Feature, CellDef } from "./MapDefinition"
import { pathable, Biome, Pattern, Structure } from "./Tile"

export class Cell {
    readonly world: World
    readonly def: CellDef
    readonly pos: PointVector
    @observable tileIndex: number = -1
    @observable unit?: Unit

    constructor(world: World, x: number, y: number, def: CellDef) {
        this.world = world
        this.pos = new PointVector(x, y)
        this.def = def
        if (typeof def[1] === 'number') {
            this.tileIndex = def[1]
        }
    }

    @computed get x(): number {
        return this.pos.x
    }

    @computed get y(): number {
        return this.pos.y
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
            const cell = this.world.cellAt(n)
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
        return this.world.cellAt(this.pos.north())
    }

    @computed get east(): Cell|undefined {
        return this.world.cellAt(this.pos.east())
    }

    @computed get south(): Cell|undefined {
        return this.world.cellAt(this.pos.south())
    }

    @computed get west(): Cell|undefined {
        return this.world.cellAt(this.pos.west())
    }

    /** 
     * Determine what kind of wall this is based on its neighbors
     **/
    @computed get wallType(): Structure {
        // Find whether our neighbors are walls
        const north = this.north && this.north.isWall
        const east = this.east && this.east.isWall
        const south = this.south && this.south.isWall
        const west = this.west && this.west.isWall

        if (north && east && south && west) {
            return Structure.WallIntersection
        } else if (north && east && south) {
            return Structure.WallNorthEastSouth
        } else if (north && east && west) {
            return Structure.WallNorthEastWest
        } else if (north && south && west) {
            return Structure.WallNorthSouthWest
        } else if (east && south && west) {
            return Structure.WallEastSouthWest
        } else if (north && east) {
            return Structure.WallNorthEast
        } else if (north && west) {
            return Structure.WallNorthWest
        } else if (north && south) {
            return Structure.WallNorthSouth
        } else if (east && south) {
            return Structure.WallEastSouth
        } else if (east && west) {
            return Structure.WallEastWest
        } else if (south && west) {
            return Structure.WallSouthWest
        } else if (north) {
            return Structure.WallNorth
        } else if (east) {
            return Structure.WallEast
        } else if (south) {
            return Structure.WallSouth
        } else if (west) {
            return Structure.WallWest
        } else {
            return Structure.Wall
        }
    }

    isAdjacentTo(otherCell: Cell) {
        return this.pos.manhattanDistance(otherCell.pos) === 1
    }
}