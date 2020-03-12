import { Team } from "./Unit"
import { World } from "./World"
import { computed } from "mobx"
import _ = require("lodash")
import { Floor } from "./Floor"

export class AI {
    floor: Floor
    team: Team
    constructor(floor: Floor, team: Team) {
        this.floor = floor
        this.team = team
    }

    @computed get units() {
        return this.floor.units.filter(u => u.team === this.team)
    }

    doPhase() {
        for (const unit of this.units) {
            // Prioritize the enemies closest to defeat
            const enemies = _.sortBy(unit.enemies, e => e.health)

            for (const enemy of enemies) {
                const path = unit.getPathToAttackThisTurn(enemy)

                if (path) {
                    unit.moveAlong(path)
                    unit.attack(enemy)
                    unit.endMove()
                    break
                }
            }

            if (!unit.moved) {
                // Couldn't find a path to attack any enemy this turn
                const path = unit.pathTowardsAttackPosition
                if (path) unit.moveAlong(path)
                unit.endMove()
            }
        }
    }
}