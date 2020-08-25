import { Creature, TileRef } from "./Tile"
import { computed } from "mobx"

interface PeepKindDef {
    name: string
    tile: TileRef
    attackRange?: number
}

export class PeepKind {
    constructor(readonly def: PeepKindDef) {
    }

    get name(): string {
        return this.def.name
    }

    get tile(): TileRef {
        return this.def.tile
    }

    get attackRange(): number {
        return this.def.attackRange || 1
    }

    @computed get id(): PeepKindId {
        return this.name.replace(/ /g, '') as PeepKindId
    }
}

export namespace PeepKind {
    export const Esper = new PeepKind({
        name: "Esper",
        tile: Creature.Esper
    })
    export const SunPaladin = new PeepKind({
        name: "Sun Paladin",
        tile: Creature.SunPaladin
    })
    export const Ranger = new PeepKind({
        name: "Ranger",
        tile: Creature.Ranger2
    })
    export const Sniper = new PeepKind({
        name: "Sniper",
        tile: Creature.Sniper,
        attackRange: 2
    })
    export const Bird = new PeepKind({
        name: "Bird",
        tile: Creature.Bird
    })

    export const Skeleton = new PeepKind({
        name: "Skeleton",
        tile: Creature.Skeleton
    })
}

export type PeepKindId = keyof typeof PeepKind
