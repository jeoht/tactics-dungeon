import { Cell } from "./Cell"
import { dijkstra, dijkstraRange } from "./pathfinding"
import { observable } from "mobx"
import _ = require("lodash")
import { nameByRace } from "fantasy-name-generator"

enum Gender {
    Boy = "Boy",
    Girl = "Girl",
    Soft = "Soft",
    Powerful = "Powerful",
    Mystery = "Mystery"
}

enum Class {
    Rookie = "Rookie"
}


function randomGender(): Gender {
    const r = Math.random()

    if (r <= 0.4)
        return Gender.Boy
    else if (r <= 0.8)
        return Gender.Girl
    else
        return _.sample(_.values(Gender)) as Gender
}

function randomName(gender: Gender) {
    if (gender === Gender.Boy)
        return nameByRace("human", { gender: "male"})
    else if (gender === Gender.Girl)
        return nameByRace("human", { gender: "female"})
    else
        return nameByRace("human")
}

export class Unit {
    @observable name: string = "Ellery Snooks"
    gender: Gender = randomGender()
    class: Class = Class.Rookie

    cell: Cell
    moveRange: number = 3
    moved: boolean = false

    constructor(cell: Cell) {
        this.cell = cell
        cell.unit = this

        this.gender = randomGender()
        this.name = randomName(this.gender)
    }

    get tileIndex(): number {
        // if (this.class === Class.Rookie) {
        //     return 24
        // }
        return 24+23
    }

    moveTo(cell: Cell) {
        this.cell.unit = undefined
        cell.unit = this
        this.cell = cell
    }

    canPathThrough(cell: Cell) {
        return cell.pathable && (!cell.unit || cell.unit === this)
    }

    getPathTo(cell: Cell) {
        return dijkstra({
            start: this.cell,
            goal: cell,
            expand: node => node.neighbors().filter(n => this.canPathThrough(n))
        })
    }

    findCellsInMoveRange() {
        return dijkstraRange({
            start: this.cell,
            range: this.moveRange,
            expand: node => node.neighbors().filter(n => this.canPathThrough(n))
        })
    }
}