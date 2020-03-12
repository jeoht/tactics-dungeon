import _ = require("lodash")
import { Class, Peep } from "./Peep"
import { Floor } from "./Floor"
import { action, observable, computed, toJS } from "mobx"

export class World {
    @observable team: Peep[] = []
    @observable.ref private _floor: Floor|null = null

    get floor(): Floor|null {
        return this._floor
    }

    set floor(floor: Floor|null) {
        if (this._floor) this._floor.dispose()
        this._floor = floor
    }

    constructor() {

    }

    @computed get save() {
        return {
            team: this.team.map(p => p.save),
            floor: this._floor?.save
        }
    }

    @action load(save: World['save']) {
        this.team = save.team.map(t => new Peep(t))
        if (save.floor) {
            this.floor = new Floor(save.floor)
        }
    }

    @action newGame() {
        this.team = []
        for (let i of _.range(4)) {
            this.team.push(new Peep({ class: Class.Esper }))
        }

        this.floor = new Floor({ team: this.team })
    }

    @action nextFloor() {
        this.floor = new Floor({ team: this.team })
    }
}