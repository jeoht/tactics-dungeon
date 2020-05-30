import { observable, computed } from "mobx"

export class Chest {
    @observable itemId: string | null
    blocksMovement = true

    static load(save: Chest['save']) {
        return new Chest(save)
    }

    static create() {
        return new Chest({ itemId: 'waffles' })
    }

    constructor(props: Partial<Chest> = {}) {
        this.itemId = props.itemId ?? null
    }

    @computed get save() {
        return {
            type: 'chest',
            itemId: this.itemId
        }
    }
}