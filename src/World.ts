import _ = require("lodash")
import { Class, Peep } from "./Peep"
import { Floor } from "./Floor"

export class World {
    team: Peep[] = []
    floor: Floor|null = null

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