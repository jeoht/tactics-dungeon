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