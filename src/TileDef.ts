/** 
 * A tileset id + LTR index uniquely specifies a particular tile 
 * for rendering
 **/
export type TileDef = {
    tilesetId: 'world' | 'creatures' | 'items'
    index: number
}

/**
 * This defines the sequence of a single row of structures
 * There are many rows of them in the tileset, one for each biome variation
 */
export enum Structure {
    Wall = 0,
    WallCracked,
    WallVeryCracked,
    Floor,
    FloorIndent,
    FloorCracked,
    FloorPattern,
    UpStair,
    DownStair,
    WallRaised,
    WallEast,
    WallEastWest,
    WallWest,
    WallSouth,
    WallNorthSouth,
    WallNorth,
    WallEastSouth,
    WallSouthWest,
    WallNorthEast,
    WallNorthWest,
    WallIntersection,
    WallEastSouthWest,
    WallNorthSouthWest,
    WallNorthEastSouth,
    WallNorthEastWest,
    WallNorthSouthCracked,
    WallEastWestCracked
}

/** Corresponds to all the variant rows of structure tiles */
export enum Biome {
    Stone = 0,
    Stone2,
    Rock,
    Clay,
    Inlaid,
    Jade,
    Cyan,
    Blue,
    Yellow,
    Grates,
    Metal,
    OldStone,
    Mossy,
    Dirt,
    Hedge,
    SkullHedge,
    Fences,
    SnowStone,
    SnowStone2,
    Sandstone
}