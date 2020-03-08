const cols = 38

// The oryx world tiles have a number of different sets of
// tiles that vary together, we call them a Biome
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

export enum Pattern {
    Floor = "floor",
    Wall = "wall"
}


export function pathable(tile: number): boolean {
    return tile % cols !== 0
}    