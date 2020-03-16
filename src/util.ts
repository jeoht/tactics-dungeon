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