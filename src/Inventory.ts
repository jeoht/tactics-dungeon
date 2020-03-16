import { observable, computed, action } from "mobx"
import { Item } from "./Item"
import { Weapon, WeaponId } from "./Weapon"
import { Consumable, ConsumableId } from "./Consumable"

type Stack = {
    item: Item
    amount: number
}

// Represents the whole team's inventory stash
export class Inventory {
    @observable stacks: Stack[] = []

    constructor(save?: Inventory['save']) {
        if (save) {
            for (const stack of save.stacks) {
                const { itemType, id, amount } = stack

                if (itemType === 'weapon')
                    this.stacks.push({ item: Weapon[id as WeaponId], amount })
                else if (itemType === 'consumable')
                    this.stacks.push({ item: Consumable[id as ConsumableId], amount })
            }
        }

        this.add(Weapon.SteelSword)
        this.add(Consumable.TeleportScroll)
        this.add(Consumable.TeleportScroll)
    }

    @computed get stacksByItem(): Map<Item, Stack> {
        const map = new Map()
        for (const stack of this.stacks) {
            map.set(stack.item, stack)
        }
        return map
    }

    @action add(item: Item) {
        let stack = this.stacksByItem.get(item)
        if (stack) {
            stack.amount += 1
        } else {
            stack = { item: item, amount: 1}
            this.stacks.push(stack)
        }
    }

    @computed get save() {
        return { stacks: this.stacks.map(stack => ({ itemType: stack.item.itemType, id: stack.item.id, amount: stack.amount }))}
    }
}