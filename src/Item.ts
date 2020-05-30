import { computed } from "mobx"

export interface ItemDef {
    id: string
    name: string
    itemType: 'weapon' | 'consumable'
}
export type ItemType = ItemDef['itemType']

export const PotionEffects = ['healing']

export const ScrollEffects = ['teleport']

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

export type PotionEffectId = ArrayElement<typeof PotionEffects>
export type ScrollEffectId = ArrayElement<typeof ScrollEffects>

export class Potion {
    static load(save: Potion['save']) {
        return new Potion(save.effectId)
    }

    static create(effectId: PotionEffectId) {
        return new Potion(effectId)
    }

    constructor(readonly effectId: PotionEffectId) {
        this.effectId = effectId
    }

    @computed get save() {
        return {
            type: 'potion',
            effectId: this.effectId
        }
    }

    @computed get name(): string {
        if (this.effectId === "healing") {
            return "Potion of Healing"
        } else {
            return "Potion of Mystery"
        }
    }
}

export class Scroll {
    static load(save: Scroll['save']) {
        return new Scroll(save.effectId)
    }

    static create(effectId: ScrollEffectId) {
        return new Scroll(effectId)
    }

    constructor(readonly effectId: ScrollEffectId) {
        this.effectId = effectId
    }

    @computed get save() {
        return {
            type: 'scroll',
            effectId: this.effectId
        }
    }

    @computed get name(): string {
        if (this.effectId === "teleport") {
            return "Scroll of Teleport"
        } else {
            return "Scroll of Mystery"
        }
    }
}

export function loadItem(save: Item['save']): Item {
    if (save.type === 'potion') {
        return Potion.load(save)
    } else if (save.type === 'scroll') {
        return Scroll.load(save)
    } else {
        // Unknown item
        return Potion.create("healing")
    }
}

export type Item = Potion | Scroll
