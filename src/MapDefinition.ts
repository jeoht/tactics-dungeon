
export enum Feature {
    PlayerSpawn = 'playerSpawn',
    EnemySpawn = 'enemySpawn'
}

const cols = 38

export namespace Tile {
    export enum Stone {
        Wall = 0,
        Floor = 3,
        Upstair = 7,
        Downstair = 8
    }

    export enum Sandstone {
        Wall = cols*3+0,
        Floor = cols*3+3,
        Upstair = cols*3+7,
        Downstair = cols*3+8
    }


    export enum Jade {
        Wall = cols*5+0,
        Floor = cols*5+3,
        Floor2 = cols*5+4,
        Upstair = cols*5+7,
        Downstair = cols*5+8
    }

    export enum Mossy {
        Wall = cols*12+0,
        Floor = cols*12+3,
        Floor2 = cols*12+4,
        Upstair = cols*12+7,
        Downstair = cols*12+8
    }

    export type Tile = Stone|Sandstone|Jade|Mossy

    export function pathable(tile: Tile): boolean {
        return tile % cols !== 0
    }    
}


export type MapDefinition = {
    key: string
    where: {[ch: string]: (Feature|Tile.Tile)[]|Tile.Tile}
}