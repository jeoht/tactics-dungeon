import { v4 as uuidv4 } from 'uuid'
import { PointVector } from './PointVector'
import _ = require('lodash')

export function uuid() {
    return uuidv4()
}

export function makeGrid<T>(width: number, height: number, mapfn?: () => T) {
    const grid: T[][] = []
    for (let i = 0; i < width; i++) {
        grid[i] = Array.from({ length: height }, mapfn ? mapfn as any : () => undefined) 
    }
    return grid
}

export function randomPos(width: number, height: number) {
    return new PointVector(Math.floor(Math.random()*width), Math.floor(Math.random()*height))
}

export function sampleBest<T>(things: T[], evaluate: (thing: T) => number) {
    const evaluations = things.map(t => evaluate(t))
    const bestScore = _.max(evaluations)
    const bests = things.filter((t, i) => evaluations[i] === bestScore)
    return _.sample(bests)
}

export function sampleEnum<T>(enumerable: T): T[keyof T] {
    const keys = Object.keys(enumerable)
    const realKeys = keys.slice(0, keys.length/2)
    return _.sample(realKeys) as any
}