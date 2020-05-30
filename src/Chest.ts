import { observable, computed } from "mobx"
import { Item, loadItem } from "./Item"

export class Chest {
    @observable item: Item | null
    blocksMovement = true

    static load(save: Chest['save']) {
        return new Chest({
            item: save.item ? loadItem(save.item) : null
        })
    }

    static create(item: Item) {
        return new Chest({ item: item })
    }

    constructor(props: Partial<Chest> = {}) {
        this.item = props.item ?? null
    }

    @computed get save() {
        return {
            type: 'chest',
            item: this.item ? this.item.save : null
        }
    }
}