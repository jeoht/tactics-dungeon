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
        const index = Math.floor(this.rng() * array.length)
        return array[index]
    }

    randomPos(width: number, height: number) {
        return new PointVector(Math.floor(Math.random() * width), Math.floor(Math.random() * height))
    }

    sampleBest<T>(things: T[], evaluate: (thing: T) => number) {
        const evaluations = things.map(t => evaluate(t))
        const bestScore = _.max(evaluations)
        const bests = things.filter((t, i) => evaluations[i] === bestScore)
        return this.sample(bests)
    }

    /**
     * Sample random elements from an array in sequence until a match is found
     * No more efficient than shuffling the whole array atm, but could be made so in future
     * 
     * @param things Array of things to sample from
     * @param predicate Return true if match is found
     */
    sampleFind<T>(things: T[], predicate: (thing: T) => boolean) {
        return this.shuffle(things).find(predicate)
    }

    /**
     * Get a copy of the given array in random order
     * From lodash shuffle https://github.com/lodash/lodash/blob/master/shuffle.js
     */
    shuffle<T>(array: T[]): T[] {
        const length = array == null ? 0 : array.length
        if (!length) {
            return []
        }
        let index = -1
        const lastIndex = length - 1
        const result = Array.from(array)
        while (++index < length) {
            const rand = index + Math.floor(this.random() * (lastIndex - index + 1))
            const value = result[rand]
            result[rand] = result[index]
            result[index] = value
        }
        return result
    }

    sampleEnum<T>(enumerable: T): T[keyof T] {
        const keys = Object.keys(enumerable)
        const realKeys = keys.slice(0, keys.length / 2)
        return this.sample(realKeys) as any
    }
}