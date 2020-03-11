import { observable, computed, action } from "mobx"
import { nameByRace } from "fantasy-name-generator"
import _ = require("lodash")

/** 
 * Represents a unit's base state, before they're actually
 * attached to any position on an active map
 */
export class Peep {
    @observable name: string
    @observable gender: Gender
    @observable class: Class
    @observable level: number = 1

    @computed get tileIndex(): number {
        if (this.class === Class.Rookie) {
            return 47
        } else if (this.class === Class.Skeleton) {
            return 370
        }

        return 0
    }

    @computed get canPromote(): boolean {
        return this.class === Class.Rookie && this.level > 1
    }

    @action promote() {
        
    }

    constructor(props: UnitSpec) {
        this.class = props.class || Class.Rookie
        this.gender = props.gender || randomGender()
        this.name = props.name || randomName(this.gender)
    }
}

export enum Gender {
    Boy = "Boy",
    Girl = "Girl",
    Soft = "Soft",
    Powerful = "Powerful",
    Mystery = "Mystery"
}   

export enum Class {
    Rookie = "Rookie",
    Skeleton = "Skeleton"
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
    class?: Class
    name?: string
    gender?: Gender
}