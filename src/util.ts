import { v4 as uuidv4 } from 'uuid'
import { PointVector } from './PointVector'

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