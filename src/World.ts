import _ = require("lodash")
import { Class, Peep } from "./Peep"
import { Floor } from "./Floor"
import { action, observable, computed, toJS } from "mobx"
import { Inventory } from "./Inventory"
import seedrandom = require('seedrandom')

export class World {
    @observable peeps: Peep[] = []
    @observable inventory: Inventory = new Inventory()
    @observable.ref private _floor: Floor|null = null
    @observable floorId: string = '1-1'
    seed: string = Math.random().toString()

    get floor(): Floor|null {
        return this._floor
    }

    set floor(floor: Floor|null) {
        if (this._floor) this._floor.dispose()
        this._floor = floor
        floor?.prepare()
    }

    @computed get floorDepth() {
        return parseInt(this.floorId.split('-')[0])
    }

    @computed get floorBranch() {
        return parseInt(this.floorId.split('-')[1])
    }

    @computed get save() {
        return {
            peeps: this.peeps.map(p => p.save),
            inventory: this.inventory.save,
            floorId: this.floorId,
            seed: this.seed,
            floor: this._floor?.save
        }
    }

    @action load(save: World['save']) {
        this.peeps = save.peeps.map(t => new Peep(t))
        this.inventory = new Inventory(save.inventory)
        if (save.floorId)
            this.floorId = save.floorId
        if (save.seed) // TODO Important pattern for adding stuff, gotta abstract
            this.seed = save.seed
        if (save.floor)
            this.floor = new Floor(save.floor)
    }

    @action startFloor() {
        this.floor = new Floor({ seed: this.seed+this.floorId, peeps: this.peeps })
    }

    @action newGame() {
        this.peeps = []
        this.inventory = new Inventory()
        for (let i of _.range(4)) {
            this.peeps.push(new Peep({ class: Class.Esper }))
        }

        this.floorId = `1-1`
        this.startFloor()
    }

    @action prevFloor() {
        this.floorId = `${this.floorDepth-1}-1`
    }

    @action nextFloor() {
        this.floorId = `${this.floorDepth+1}-1`
        this.startFloor()
    }
}