import { Biome, Pattern, Structure } from "./Tile"

export enum Feature {
    PlayerSpawn = 'playerSpawn',
    EnemySpawn = 'enemySpawn'
}

export type CellDef = [Biome, Pattern|Structure] | [Biome, Pattern|Structure, Feature]

export type MapDefinition = {
    key: string
    where: {[ch: string]: CellDef}
}