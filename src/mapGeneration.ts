import { makeGrid, randomPos } from "./util";
import { Block, MapBase } from "./MapBase";
import { BOARD_ROWS, BOARD_COLS } from "./settings";
import { Biome } from "./Tile";
import _ = require("lodash");


interface CellDef {
    x: number
    y: number
    
}

interface MapgenSettings {

}

function randomBlocks(): Block[] {
    if (Math.random() > 0.8) { 
        return [Block.Floor, Block.Wall]
    } else {
        return [Block.Floor]
    }
}

export function generateMap(props: MapgenSettings = {}) {
    const biome = _.sample(Object.values(Biome)) as Biome

    const [width, height] = [BOARD_COLS, BOARD_ROWS]
    const blocks = makeGrid<Block[]>(width, height)


    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            blocks[i][j] = randomBlocks()
        }
    }

    const enemySpawns = 8
    const teamSpawns = 6

    for (const i of _.range(enemySpawns)) {
        const { x, y } = randomPos(width, height)
        blocks[x][y].push(Block.EnemySpawn)
    }

    for (const i of _.range(teamSpawns)) {
        const { x, y } = randomPos(width, height)
        blocks[x][y].push(Block.PlayerSpawn)
    }

    return new MapBase({ biome, blocks })
}