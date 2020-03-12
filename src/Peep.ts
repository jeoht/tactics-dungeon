import { observable, computed, action } from "mobx"
import { nameByRace } from "fantasy-name-generator"
import _ = require("lodash")
import { v4 as uuidv4 } from 'uuid'

interface AbilityDef {
    name: string
    description: string
}

interface ClassDef {
    name: string
    abilities: { level: number, ability: AbilityDef }[]
    tileIndex: number
}

export namespace Ability {
    export const SenseThoughts = {
        name: "Sense Thoughts",
        description: `Creatures on the next floor are revealed in advance. Only living creatures with minds can be sensed this way.`
    }

    export const KineticHold = {
        name: "Kinetic Hold",
        description: `Once per floor, target an enemy within line of sight to reduce their movement range to 0 for one turn.`
    }
    export const EmpathicBond = {
        name: "Empathic Bond",
        description: `Activate to bond with a friendly unit. Until deactivated, damage to either unit is split across both.`
    }

    export const ForceWall = {
        name: "Force Wall",
        description: `Once per encounter, generate a wall of psychic force across a target line that prevents all movement for a turn.`
    }
}

export namespace Class {
    export const Rookie = { 
        name: "Rookie", 
        tileIndex: 47,
        abilities: [] 
    }
    export const Esper = {
        name: "Esper",
        tileIndex: 3,
        abilities: [
            { level: 1, ability: Ability.SenseThoughts },
            { level: 2, ability: Ability.KineticHold },
            { level: 2, ability: Ability.EmpathicBond },
        ]
    }
    export const SunPaladin = {
        name: "Sun Paladin",
        tileIndex: 0,
        abilities: []
    }

    export const Skeleton = {
        name: "Skeleton", 
        abilities: [],
        tileIndex: 370
    }
}


/** 
 * Represents a unit's base state, before they're actually
 * attached to any position on an active map
 */
export class Peep {
    id: string
    @observable name: string
    @observable gender: Gender
    @observable.ref class: ClassDef
    @observable level: number = 2
    @observable.ref learnedAbilities: Set<AbilityDef> = new Set([Ability.SenseThoughts])

    constructor(props: UnitSpec) {
        this.id = uuidv4()
        this.class = props.class || Class.Rookie
        this.gender = props.gender || randomGender()
        this.name = props.name || randomName(this.gender)
    }

    @computed get tileIndex(): number {
        return this.class.tileIndex
    }

    @computed get canPromote(): boolean {
        return this.class === Class.Rookie && this.level > 1
    }

    @computed get abilityLevels(): { level: number, abilities: AbilityDef[] }[] {
        const grouped = _(this.class.abilities).groupBy(d => d.level).value()

        const abilityLevels = []
        for (const level of _(grouped).keys().sortBy().value()) {
            abilityLevels.push({
                level: parseInt(level),
                abilities: grouped[level].map(d => d.ability)
            })
        }

        return abilityLevels
    }

    @action promote() {
        this.class = Class.Esper
    }

    knows(ability: AbilityDef) {
        return this.learnedAbilities.has(ability)
    }
}

export enum Gender {
    Boy = "Boy",
    Girl = "Girl",
    Soft = "Soft",
    Powerful = "Powerful",
    Mystery = "Mystery"
}   


function randomGender(): Gender {
    const r = Math.random()

    if (r <= 0.4)
        return Gender.Boy
    else if (r <= 0.8)
        return Gender.Girl
    else
        return _.sample(_.values(Gender)) as Gender
}

function randomName(gender: Gender): string {
    if (gender === Gender.Boy)
        return nameByRace("human", { gender: "male"}) as string
    else if (gender === Gender.Girl)
        return nameByRace("human", { gender: "female"}) as string
    else
        return nameByRace("human") as string
}

export type UnitSpec = {
    class?: ClassDef
    name?: string
    gender?: Gender
}