import { computed } from "mobx"
import { defOf } from "./util"
import type { TileDef } from "./TileDef"
import { CreatureTileDefOf } from "./CreatureTileDef"

export class PeepKindDef {
    readonly name: string
    readonly tile: TileDef
    readonly attackRange: number
    readonly maxHealth: number

    constructor(readonly id: PeepKindDefId, props: {
        name: string
        tile: TileDef
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
        tile: CreatureTileDefOf.Rookie
    },
    Esper: {
        name: "Esper",
        tile: CreatureTileDefOf.Esper
    },
    SunPaladin: {
        name: "Sun Paladin",
        tile: CreatureTileDefOf.SunPaladin,
        maxHealth: 5
    },
    Ranger: {
        name: "Ranger",
        tile: CreatureTileDefOf.Ranger2
    },
    Sniper: {
        name: "Sniper",
        tile: CreatureTileDefOf.Sniper,
        attackRange: 2
    },
    Bird: {
        name: "Bird",
        tile: CreatureTileDefOf.Bird,
        maxHealth: 2
    },
    Skeleton: {
        name: "Skeleton",
        tile: CreatureTileDefOf.Skeleton,
        maxHealth: 2
    },
    SkeletonArcher: {
        name: "Skeleton Archer",
        tile: CreatureTileDefOf.SkeletonArcher,
        maxHealth: 2
    },
    SkeletonWarrior: {
        name: "Skeleton Warrior",
        tile: CreatureTileDefOf.SkeletonEquipped,
        maxHealth: 3
    }
}

export const PeepKindDefOf = defOf(PeepKindDef, peepKindsJson)
export type PeepKindDefId = keyof typeof peepKindsJson
