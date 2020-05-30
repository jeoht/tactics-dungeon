import { observable, computed, action, toJS } from "mobx"
import { nameByRace } from "fantasy-name-generator"
import _ = require("lodash")

import { uuid } from './util'
import { Creature } from "./Tile"
import { Weapon } from "./Weapon"
import { Consumable } from "./Consumable"

interface AbilityDef {
    name: string
    description: string
}

export class Ability {
    name: string
    description: string
    constructor(def: AbilityDef) {
        this.name = def.name
        this.description = def.description
    }

    @computed get id(): AbilityId {
        return this.name.replace(/ /g, '') as AbilityId
    }
}

export namespace Ability {
    export const SenseThoughts = new Ability({
        name: "Sense Thoughts",
        description: `Creatures on the next floor are revealed in advance. Only living creatures with minds can be sensed this way.`
    })
    export const KineticHold = new Ability({
        name: "Kinetic Hold",
        description: `Once per floor, target an enemy within line of sight to reduce their movement range to 0 for one turn.`
    })
    export const EmpathicBond = new Ability({
        name: "Empathic Bond",
        description: `Activate to bond with a friendly unit. Until deactivated, damage to either unit is split across both.`
    })
    export const ForceWall = new Ability({
        name: "Force Wall",
        description: `Once per encounter, generate a wall of psychic force across a target line that prevents all movement for a turn.`
    })
}

export type AbilityId = keyof typeof Ability

interface ClassDef {
    name: string
    abilities: { level: number, ability: Ability }[]
    tileIndex: number
}

export class Class {
    name: string
    abilities: { level: number, ability: Ability }[]
    tileIndex: number

    constructor(def: ClassDef) {
        this.name = def.name
        this.abilities = def.abilities
        this.tileIndex = def.tileIndex
    }

    @computed get id(): ClassId {
        return this.name.replace(/ /g, '') as ClassId
    }
}

export namespace Class {
    export const Rookie = new Class({
        name: "Rookie",
        tileIndex: 47,
        abilities: []
    })
    export const Esper = new Class({
        name: "Esper",
        tileIndex: 3,
        abilities: [
            { level: 1, ability: Ability.SenseThoughts },
            { level: 2, ability: Ability.KineticHold },
            { level: 2, ability: Ability.EmpathicBond },
        ]
    })
    export const SunPaladin = new Class({
        name: "Sun Paladin",
        tileIndex: Creature.SunPaladin,
        abilities: []
    })
    export const Skeleton = new Class({
        name: "Skeleton",
        abilities: [],
        tileIndex: Creature.Skeleton
    })
}

export type ClassId = keyof typeof Class


/** 
 * Represents a unit's base state, before they're actually
 * attached to any position on an active map
 */
export class Peep {
    @observable name: string
    @observable gender: Gender
    @observable classId: ClassId
    @observable level: number
    @observable learnedAbilityIds: AbilityId[] = []
    @observable weaponType: 'bow' | 'sword' = 'sword'

    // Equipment
    weapon?: Weapon
    item1?: Consumable
    item2?: Consumable

    static load(save: Peep['save']) {
        return new Peep(save.id, save)
    }

    static create(props: Partial<Peep>) {
        return new Peep(uuid(), {
            classId: props.class?.id,
            ...props
        })
    }

    constructor(readonly id: string, props: Partial<Peep>) {
        this.classId = props.classId || Class.Rookie.id
        this.gender = props.gender || randomGender()
        this.name = props.name || randomName(this.gender)
        this.level = props.level || 1
        this.learnedAbilityIds = props.learnedAbilityIds || []
    }

    @computed get save() {
        return {
            id: this.id,
            name: this.name,
            gender: this.gender,
            classId: this.classId,
            level: this.level,
            learnedAbilityIds: this.learnedAbilityIds
        }
    }

    @computed get class(): Class {
        return Class[this.classId]
    }

    set class(klass: Class) {
        this.classId = klass.id
    }

    @computed get tileIndex(): number {
        return this.class.tileIndex
    }

    @computed get canPromote(): boolean {
        return this.class === Class.Rookie && this.level > 1
    }

    @computed get learnedAbilities(): Set<Ability> {
        return new Set(this.learnedAbilityIds.map(id => Ability[id]))
    }

    @computed get abilityLevels(): { level: number, abilities: Ability[] }[] {
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

    @action learn(ability: Ability) {
        this.learnedAbilityIds.push(ability.id)
    }

    knows(ability: Ability) {
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
        return nameByRace("human", { gender: "male" }) as string
    else if (gender === Gender.Girl)
        return nameByRace("human", { gender: "female" }) as string
    else
        return nameByRace("human") as string
}

export type UnitSpec = {
    class?: Class
    name?: string
    gender?: Gender
}