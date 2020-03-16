import { computed } from "mobx"
import { ItemType } from "./Item"

export type ConsumableDef = {
    id?: string
    name: string
}

export class Consumable {
    id: string
    name: string
    itemType: ItemType = 'consumable'

    constructor(props: ConsumableDef) {
        this.id = props.id || props.name.replace(/ /g, '') as ConsumableId
        this.name = props.name
    }
}

export namespace Consumable {
    export const TeleportScroll = new Consumable({ 
        id: "TeleportScroll",
        name: "Scroll of Teleport"
    })
}

export type ConsumableId = keyof typeof Consumable
