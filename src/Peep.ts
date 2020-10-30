import { observable, computed, action, toJS } from "mobx"
import { nameByRace } from "fantasy-name-generator"
import _ = require("lodash")

import { uuid } from './util'
import { Weapon } from "./Weapon"
import { Consumable } from "./Consumable"
import { PeepKindDef, PeepKindDefOf, PeepKindDefId } from "./PeepKindDef"
import { AbilityDef, AbilityDefId, AbilityDefOf } from "./AbilityDef"


/** 
 * Represents a unit's base state, before they're actually
 * attached to any position on an active map
 */
export class Peep {
    @observable name: string
    @observable kindId: PeepKindDefId
    @observable level: number
    @observable abilityLevels: { [abilityId: string]: number | undefined }
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
            kindId: props.kind?.id,
            ...props
        })
    }

    constructor(readonly id: string, props: Partial<Peep>) {
        this.kindId = props.kindId || "Bird"
        this.name = props.name || randomName()
        this.level = props.level || 1
        this.abilityLevels = props.abilityLevels || {}
    }

    @computed get save() {
        return {
            id: this.id,
            name: this.name,
            kindId: this.kindId,
            level: this.level,
            abilityLevels: this.abilityLevels
        }
    }

    @computed get kind(): PeepKindDef {
        return PeepKindDefOf[this.kindId]
    }

    set kind(kind: PeepKindDef) {
        this.kindId = kind.id
    }

    @computed get tile() {
        return this.kind.tile
    }

    @computed get learnedAbilities(): AbilityDef[] {
        const learnedAbilityIds = Object.keys(this.abilityLevels).filter(k => this.abilityLevels[k]! > 0)
        return learnedAbilityIds.map(id => AbilityDefOf[id as AbilityDefId])
    }

    getAbilityLevel(ability: AbilityDef) {
        return this.abilityLevels[ability.id] || 0
    }

    @computed get learnableNewAbilities() {
        if (this.kind === PeepKindDefOf.Esper) {
            return [AbilityDefOf.ForceWall]
        } else {
            return []
        }
    }

    @computed get levelableAbilities() {
        return this.learnedAbilities.filter(a => this.getAbilityLevel(a) < a.maxLevel)
    }

    // @computed get abilityLevels(): { level: number, abilities: Ability[] }[] {
    //     const grouped = _(this.class.abilities).groupBy(d => d.level).value()

    //     const abilityLevels = []
    //     for (const level of _(grouped).keys().sortBy().value()) {
    //         abilityLevels.push({
    //             level: parseInt(level),
    //             abilities: grouped[level].map(d => d.ability)
    //         })
    //     }

    //     return abilityLevels
    // }

    // @action learn(ability: Ability) {
    //     this.learnedAbilityIds.push(ability.id)
    // }

    // knows(ability: Ability) {
    //     return this.learnedAbilities.has(ability)
    // }
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

function randomName(gender?: Gender): string {
    if (gender === Gender.Boy)
        return nameByRace("human", { gender: "male" }) as string
    else if (gender === Gender.Girl)
        return nameByRace("human", { gender: "female" }) as string
    else
        return nameByRace("human") as string
}