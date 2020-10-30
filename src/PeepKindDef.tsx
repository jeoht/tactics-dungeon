import { Creature, TileRef } from "./Tile"
import { computed } from "mobx"
import { defOf } from "./util"

export class PeepKindDef {
    readonly name: string
    readonly tile: TileRef
    readonly attackRange: number
    readonly maxHealth: number

    constructor(readonly id: PeepKindDefId, props: {
        name: string
        tile: TileRef
        attackRange?: number
        maxHealth?: number
    }) {
        this.name = props.name
        this.tile = props.tile
        this.attackRange = props.attackRange || 1
        this.maxHealth = props.maxHealth || 3
    }

    @computed get promotionOptions(): PeepKindDef[] {
        if (this === PeepKindDefOf.Rookie) {
            return [
                PeepKindDefOf.Esper,
                PeepKindDefOf.SunPaladin,
                PeepKindDefOf.Ranger,
                PeepKindDefOf.Sniper
            ]
        } else {
            return []
        }
    }
}

const peepKindsJson = {
    Rookie: {
        name: "Rookie",
        tile: Creature.Rookie
    },
    Esper: {
        name: "Esper",
        tile: Creature.Esper
    },
    SunPaladin: {
        name: "Sun Paladin",
        tile: Creature.SunPaladin,
        maxHealth: 5
    },
    Ranger: {
        name: "Ranger",
        tile: Creature.Ranger2
    },
    Sniper: {
        name: "Sniper",
        tile: Creature.Sniper,
        attackRange: 2
    },
    Bird: {
        name: "Bird",
        tile: Creature.Bird,
        maxHealth: 2
    },
    Skeleton: {
        name: "Skeleton",
        tile: Creature.Skeleton,
        maxHealth: 2
    },
    SkeletonArcher: {
        name: "Skeleton Archer",
        tile: Creature.SkeletonArcher,
        maxHealth: 2
    },
    SkeletonWarrior: {
        name: "Skeleton Warrior",
        tile: Creature.SkeletonEquipped,
        maxHealth: 3
    }
}

export const PeepKindDefOf = defOf(PeepKindDef, peepKindsJson)
export type PeepKindDefId = keyof typeof peepKindsJson
