import { computed, action } from "mobx"
import { Cell } from "./Cell"
import { Unit } from "./Unit"

export interface UnitAction {
    targetRangeCells: Cell[]
    execute(cell: Cell): void
}

export class SnipeAction implements UnitAction {
    constructor(readonly unit: Unit) { }

    @computed get targetRangeCells() {
        const cells: Cell[] = []
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i !== 0 || j !== 0) {
                    let cell: Cell | undefined = this.unit.cell
                    while (true) {
                        cell = cell.floor.cellAt(cell.pos.addXY(i, j))
                        if (cell && !cell.isWall) {
                            if (!cell.unit || this.unit.isEnemy(cell.unit))
                                cells.push(cell)

                            if (cell.unit)
                                break
                        } else {
                            break
                        }
                    }
                }
            }
        }
        return cells
    }

    @action execute(cell: Cell) {
        const target = cell.unit
        if (!target) return

        const damage = 2
        target.cell.floor.event({ type: 'attack', unit: this.unit, target: target, damage: damage })

        target.damage += damage
        if (target.health <= 0) {
            target.defeatedBy(this.unit)
        }

        this.unit.endMove()
    }
}