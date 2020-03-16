import _ = require("lodash")
import { Class, Peep } from "./Peep"
import { Floor } from "./Floor"
import { action, observable, computed, toJS } from "mobx"
import { Inventory } from "./Inventory"

export class World {
    @observable peeps: Peep[] = []
    @observable inventory: Inventory = new Inventory()
    @observable.ref private _floor: Floor|null = null

    get floor(): Floor|null {
        return this._floor
    }

    set floor(floor: Floor|null) {
        if (this._floor) this._floor.dispose()
        this._floor = floor
        floor?.prepare()
    }

    constructor() {

    }

    @computed get save() {
        return {
            peeps: this.peeps.map(p => p.save),
            inventory: this.inventory.save,
            floor: this._floor?.save
        }
    }

    @action load(save: World['save']) {
        this.peeps = save.peeps.map(t => new Peep(t))
        this.inventory = new Inventory(save.inventory)
        if (save.floor) {
            this.floor = new Floor(save.floor)
        }
    }

    @action newGame() {
        this.peeps = []
        this.inventory = new Inventory()
        for (let i of _.range(4)) {
            this.peeps.push(new Peep({ class: Class.Esper }))
        }

        this.floor = new Floor({ peeps: this.peeps })
    }

    @action nextFloor() {
        this.floor = new Floor({ peeps: this.peeps })
    }
}