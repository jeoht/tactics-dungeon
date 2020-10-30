import { CreatureTileDefOf } from "./CreatureTileDef"
import { Structure, TileDef } from "./TileDef"
import { defOf } from "./util"

export class AbilityDef {
    name: string
    description: string
    tile: TileDef
    maxLevel: number

    constructor(readonly id: AbilityDefId, props: {
        name: string
        description: string
        tile?: TileDef
        maxLevel?: number
    }) {
        this.name = props.name
        this.description = props.description
        this.tile = props.tile ?? CreatureTileDefOf.Bat
        this.maxLevel = props.maxLevel ?? 0
    }
}

const abilityDefsJson = {
    SenseThoughts: {
        name: "Sense Thoughts",
        description: `Creatures on the next floor are revealed in advance. Only living creatures with minds can be sensed this way.`
    },
    KineticHold: {
        name: "Kinetic Hold",
        description: `Once per floor, target an enemy within line of sight to reduce their movement range to 0 for one turn.`
    },
    EmpathicBond: {
        name: "Empathic Bond",
        description: `Activate to bond with a friendly unit. Until deactivated, damage to either unit is split across both.`
    },
    ForceWall: {
        name: "Force Wall",
        description: `Once per encounter, generate a wall of psychic force across a target line that prevents all movement for a turn.`,
        tile: { tilesetId: 'world', index: Structure.Wall }
    }
}

export const AbilityDefOf = defOf(AbilityDef, abilityDefsJson)
export type AbilityDefId = keyof typeof abilityDefsJson
