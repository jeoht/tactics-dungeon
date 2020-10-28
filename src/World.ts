import _ = require("lodash")
import { Peep } from "./Peep"
import { ActiveFloor } from "./Floor"
import { action, observable, computed } from "mobx"
import { Inventory } from "./Inventory"
import { PeepKind } from "./PeepKind"

export class World {
    @observable peeps: Peep[]
    @observable inventory: Inventory = new Inventory()
    @observable.ref private _floor: ActiveFloor | null
    @observable floorId: string
    seed: string

    static load(save: World['save']) {
        const world = new World({
            peeps: save.peeps.map(p => Peep.load(p)),
            inventory: new Inventory(save.inventory),
            floorId: save.floorId,
            seed: save.seed,
            floor: save.floor ? ActiveFloor.load(save.floor) : null
        })
        world.floor?.prepare()
        return world
    }

    static create() {
        return new World({})
    }

    constructor(props: Partial<World>) {
        this.peeps = props.peeps ?? []
        this.inventory = props.inventory ?? new Inventory()
        this.floorId = props.floorId ?? '1-1'
        this.seed = props.seed ?? Math.random().toString()
        this._floor = props.floor ?? null
    }

    get floor(): ActiveFloor | null {
        return this._floor
    }

    set floor(floor: ActiveFloor | null) {
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

    @action startFloor() {
        this.floor = ActiveFloor.create({ seed: this.seed + this.floorId, peeps: this.peeps })
    }

    @action newGame() {
        this.peeps = []
        this.inventory = new Inventory()
        for (let i of _.range(4)) {
            this.peeps.push(Peep.create({ kind: PeepKind.Esper }))
        }

        this.floorId = `1-1`
        this.startFloor()
    }

    @action prevFloor() {
        this.floorId = `${this.floorDepth - 1}-1`
    }

    @action nextFloor() {
        this.floorId = `${this.floorDepth + 1}-1`
        this.startFloor()
    }
}