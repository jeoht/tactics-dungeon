import { computed } from "mobx"
import { Item, ItemType } from "./Item"

export type WeaponDef = {
    name: string,
    type: 'sword'|'bow'
}

export class Weapon implements Item {
    name: string
    itemType: ItemType = 'weapon'
    type: 'sword'|'bow'

    constructor(props: WeaponDef) {
        this.name = props.name
        this.type = props.type
    }

    @computed get id(): WeaponId {
        return this.name.replace(/ /g, '') as WeaponId
    }
}

export namespace Weapon {
    export const SteelSword = new Weapon({ 
        name: "Steel Sword",
        type: 'sword'
    })
}

export type WeaponId = keyof typeof Weapon
