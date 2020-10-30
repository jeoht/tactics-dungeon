import { Biome } from "./TileDef"
import { computed } from "mobx"

// Maps are built out of Blocks
// Blocks are gameplay elements, they may be represented by
// a variety of different visual tiles (or not at all) depending on the situation
export enum Block {
    Floor = '.',
    Wall = '#',
    UpStair = '<',
    DownStair = '>',
    PlayerSpawn = 'p',
    EnemySpawn = 'e'
}

/**
 * A MapBase is a 3-dimensional collection of Blocks that represents
 * the initial (base) structure of a map. 
 */
export class MapBase {
    readonly biome: Biome
    readonly blocks: Block[][][]
    readonly width: number
    readonly height: number

    constructor(props: { biome?: Biome, blocks: Block[][][] }) {
        this.biome = props.biome || Biome.Stone
        this.blocks = props.blocks
        this.width = this.blocks.length
        this.height = this.blocks[0].length
    }

    @computed get save() {
        return {
            biome: this.biome,
            blocks: this.blocks
        }
    }
}

function defineMap(props: { biome?: Biome, layout: string, where: { [ch: string]: Block[] } }) {
    const { layout, where, biome } = props
    const lines = layout.trim().split("\n").map(l => l.trim())
    const width = lines[0].length
    const height = lines.length

    const blocks: Block[][][] = []

    for (let i = 0; i < width; i++) {
        blocks[i] = Array.from({ length: height }, () => [])
        for (let j = 0; j < height; j++) {
            const ch = lines[j][i]
            blocks[i][j] = where[ch]
        }
    }

    return new MapBase({ biome, blocks })

}

export const floorOne = defineMap({
    layout: `
        ########
        #..>>..#
        #.####.#
        #...e..#
        ###..###
        __#__#__
        _##__##_
        __#__#__
        _#____#_
        __pppp___
        _#_##_#_
        ########
    `,
    where: {
        '.': [Block.Floor],
        '#': [Block.Floor, Block.Wall],
        '>': [Block.DownStair],
        '_': [Block.Floor],
        'e': [Block.Floor, Block.EnemySpawn],
        'p': [Block.Floor, Block.PlayerSpawn]
    }
})