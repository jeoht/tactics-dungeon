import { Creature, TileRef } from "./Tile"
import { computed } from "mobx"

interface PeepKindDef {
    name: string
    tile: TileRef
}

export class PeepKind {
    name: string
    tile: TileRef

    constructor(def: PeepKindDef) {
        this.name = def.name
        this.tile = def.tile
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
        tile: Creature.Sniper
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
