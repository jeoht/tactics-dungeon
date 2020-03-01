import { Team } from "./Unit"
import { World } from "./World"
import { computed } from "mobx"
import _ = require("lodash")

export class AI {
    world: World
    team: Team
    constructor(world: World, team: Team) {
        this.world = world
        this.team = team
    }

    @computed get units() {
        return this.world.units.filter(u => u.team === this.team)
    }

    doPhase() {
        for (const unit of this.units) {
            const path = unit.getPathToNearestEnemy()
            if (path.length) {
                if (path.length > unit.moveRange) {
                    unit.moveAlong(path.slice(0, unit.moveRange-1))
                } else {
                    if (path.length > 1) {
                        // Move to cell adjacent to target
                        unit.moveAlong(path.slice(0, path.length-1))
                    }

                    // Otherwise we're already adjacent
                    const targetCell = path[path.length-1]
                    unit.attack(targetCell.unit!)
                }    
            }
            unit.endMove()
        }
    }
}