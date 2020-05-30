import { Block } from "./MapBase";
import { BOARD_ROWS, BOARD_COLS } from "./settings";
import { Biome } from "./Tile";
import _ = require("lodash");
import { Floor } from "./Floor";
import { Cell } from "./Cell";
import { PointVector } from "./PointVector";
import { Peep, Class } from "./Peep";
import { Team } from "./Unit";
import { RNG } from "./RNG";
import { Chest } from "./Chest";

function randomBlocks(rng: RNG): Block[] {
    if (rng.random() > 0.8) {
        return [Block.Floor, Block.Wall]
    } else {
        return [Block.Floor]
    }
}

export type MapgenOpts = {
    peeps: Peep[]
}

export function generateMap(map: Floor, opts: MapgenOpts) {
    const rng = new RNG(map.seed)
    const biome = rng.sampleEnum(Biome)
    map.biome = biome

    const [width, height] = [BOARD_COLS, BOARD_ROWS]

    // Start with some empty cells
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            const pos = new PointVector(i, j)
            const cell = Cell.create(map, { pos, blocks: [] })
            map.cells.push(cell)
        }
    }

    const upstairCell = rng.sample(map.cells)
    upstairCell.blocks = [Block.Floor, Block.UpStair]

    const downstairCell = rng.sampleBest(map.cells, c => Math.min(height, c.pos.manhattanDistance(upstairCell.pos)))
    downstairCell.blocks = [Block.Floor, Block.DownStair]

    const cell = rng.sampleFind(map.cells, cell => cell.pathable)
    if (cell) {
        cell.add(new Chest())
    }


    let enemies = 4
    for (const cell of _.sortBy(map.cells, c => c.pos.manhattanDistance(downstairCell.pos))) {
        if (cell === downstairCell) continue

        cell.blocks = [Block.Floor]
        map.spawnUnit(Peep.create({ class: Class.Skeleton }), { cell: cell, team: Team.Enemy })
        enemies--
        if (enemies === 0) break
    }

    const peeps = [...opts.peeps]
    for (const cell of _.sortBy(map.cells, c => c.pos.manhattanDistance(upstairCell.pos))) {
        if (cell === upstairCell) continue

        const peep = peeps.pop()
        if (!peep) break

        cell.blocks = [Block.Floor]
        map.spawnUnit(peep, { cell: cell, team: Team.Player })
    }

    for (const cell of map.cells) {
        if (!cell.blocks.length)
            cell.blocks = randomBlocks(rng)
    }
}