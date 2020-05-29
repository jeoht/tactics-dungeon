import { GameObject, GameComponent } from "./GameObject"
import { Cell } from "./Cell"
import { Item } from "./Item"

class Placeable extends GameComponent {
    cell!: Cell
}

class Harvestable extends GameComponent {
    item?: Item
}

export function chest(cell: Cell) {
    return GameObject.create(Placeable, Harvestable)
}