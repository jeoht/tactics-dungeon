import {sampleBest, sampleEnum } from "./util";
import { Block } from "./MapBase";
import { BOARD_ROWS, BOARD_COLS } from "./settings";
import { Biome } from "./Tile";
import _ = require("lodash");
import { Floor } from "./Floor";
import { Cell } from "./Cell";
import { PointVector } from "./PointVector";
import { Peep, Class } from "./Peep";
import { Team } from "./Unit";


function randomBlocks(): Block[] {
    if (Math.random() > 0.8) { 
        return [Block.Floor, Block.Wall]
    } else {
        return [Block.Floor]
    }
}

export type MapgenOpts = {
    peeps: Peep[]
}

export function generateMap(map: Floor, opts: MapgenOpts) {
    const biome = sampleEnum(Biome)
    map.biome = biome

    const [width, height] = [BOARD_COLS, BOARD_ROWS]

    // Start with some empty cells
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            const pos = new PointVector(i, j)
            const cell = new Cell(map, { pos, blocks: [] })
            map.cells.push(cell)
        }
    }
    
    const upstairCell = _.sample(map.cells)!
    upstairCell.blocks = [Block.Floor, Block.UpStair]

    const downstairCell = sampleBest(map.cells, c => Math.min(height, c.pos.manhattanDistance(upstairCell.pos)))!
    downstairCell.blocks = [Block.Floor, Block.DownStair]

    let enemies = 4
    for (const cell of _.sortBy(map.cells, c => c.pos.manhattanDistance(downstairCell.pos))) {
        if (cell === downstairCell) continue

        cell.blocks = [Block.Floor]
        map.spawnUnit(new Peep({ class: Class.Skeleton }), { cell: cell, team: Team.Enemy })
        enemies--
        if (enemies === 0) break
    }

    for (const cell of _.sortBy(map.cells, c => c.pos.manhattanDistance(upstairCell.pos))) {
        if (cell === upstairCell) continue

        const peep = opts.peeps.pop()
        if (!peep) break

        cell.blocks = [Block.Floor]
        map.spawnUnit(peep, { cell: cell, team: Team.Player })
    }

    for (const cell of map.cells) {
        if (!cell.blocks.length)
            cell.blocks = randomBlocks()
    }
}