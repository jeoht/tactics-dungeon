import seedrandom = require('seedrandom')
import { PointVector } from './PointVector'
import _ = require('lodash')

export class RNG {
    seed: string
    rng: seedrandom.prng
    constructor(seed: string) {
        this.seed = seed
        this.rng = seedrandom(seed, { state: true })
    }

    random() {
        return this.rng()
    }

    sample<T>(array: T[]): T {
        const index = Math.floor(this.rng()*array.length)
        return array[index]
    }

    randomPos(width: number, height: number) {
        return new PointVector(Math.floor(Math.random()*width), Math.floor(Math.random()*height))
    }
    
    sampleBest<T>(things: T[], evaluate: (thing: T) => number) {
        const evaluations = things.map(t => evaluate(t))
        const bestScore = _.max(evaluations)
        const bests = things.filter((t, i) => evaluations[i] === bestScore)
        return this.sample(bests)
    }
    
    sampleEnum<T>(enumerable: T): T[keyof T] {
        const keys = Object.keys(enumerable)
        const realKeys = keys.slice(0, keys.length/2)
        return this.sample(realKeys) as any
    }
}