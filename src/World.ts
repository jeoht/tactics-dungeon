import _ = require("lodash")
import { Class, Peep } from "./Peep"
import { Floor } from "./Floor"

export class World {
    team: Peep[] = []
    private _floor: Floor|null = null

    get floor(): Floor|null {
        return this._floor
    }

    set floor(floor: Floor|null) {
        if (this._floor) this._floor.dispose()
        this._floor = floor
    }

    constructor() {

    }

    newGame() {
        this.team = []
        for (let i of _.range(4)) {
            this.team.push(new Peep({ class: Class.Esper }))
        }

        this.floor = new Floor(this.team)
    }
}