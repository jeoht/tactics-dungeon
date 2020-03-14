import { ScreenVector } from "./ScreenVector"

declare const require: any
const TinyQueue = require('tinyqueue').default

class PriorityQueue<T> {
    queue: any
    constructor() {
        this.queue = new TinyQueue([], (a: any, b: any) => a.priority - b.priority)
    }

    push(value: T, priority: number) {
        this.queue.push({ value, priority })
    }

    pop(): T {
        return this.queue.pop().value
    }

    get length(): number {
        return this.queue.length
    }
}


export function dijkstra<T>(props: { start: T, goal: ((node: T) => boolean), expand: (node: T) => T[] }): T[]|null {
    const { start, goal, expand } = props
    const frontier = new PriorityQueue<T>()
    frontier.push(start, 0)
    const cameFrom: Map<T, T|undefined> = new Map()
    const costSoFar: Map<T, number> = new Map()
    cameFrom.set(start, undefined)
    costSoFar.set(start, 0)

    let goalCell: T|null = null

    while (frontier.length > 0) {
        const current = frontier.pop()  

        if (goal(current)) {
            goalCell = current
            break
        }

        for (const nextCell of expand(current)) {
            const newCost = (costSoFar.get(current)||0) + 1
            const prevCost = costSoFar.get(nextCell)
            if (prevCost === undefined || newCost < prevCost) {
                costSoFar.set(nextCell, newCost)
                frontier.push(nextCell, newCost)
                cameFrom.set(nextCell, current)
            }
        }
    }

    if (goalCell === null || !cameFrom.has(goalCell))
        return null
    else {
        const path = []
        let current = goalCell
        while (current != start) {
            path.push(current)
            current = cameFrom.get(current) as T
        }
        path.reverse()
        return path
    }
}

export function dijkstraRange<T>(props: { start: T, range: number, expand: (node: T) => T[] }): T[] {
    const { start, range, expand } = props
    const frontier = new PriorityQueue<T>()
    frontier.push(start, 0)
    const costSoFar: Map<T, number> = new Map()
    costSoFar.set(start, 0)
    const reachable = new Set()
    reachable.add(start)

    while (frontier.length > 0) {
        const current = frontier.pop()  

        for (const nextCell of expand(current)) {
            const newCost = (costSoFar.get(current)||0) + 1
            const prevCost = costSoFar.get(nextCell)
            if (prevCost === undefined || newCost < prevCost) {
                costSoFar.set(nextCell, newCost)

                if (newCost <= range) {
                    reachable.add(nextCell)
                    frontier.push(nextCell, newCost)
                }
            }
        }
    }

    return Array.from(reachable) as T[]
}

export function bresenham(x0: number, y0: number, x1: number, y1: number, plot: (x: number, y: number) => boolean){
    let tmp
    let steep = Math.abs(y1-y0) > Math.abs(x1-x0)
    if (steep){
      //swap x0,y0
      tmp=x0
      x0=y0
      y0=tmp
   
      //swap x1,y1
      tmp=x1
      x1=y1
      y1=tmp
    }
   
    let sign = 1
    if (x0 > x1){
      sign = -1
      x0 *= -1
      x1 *= -1
    }
    let dx = x1 - x0
    let dy = Math.abs(y1 - y0)
    let err = ((dx/2))
    let ystep = y0 < y1 ? 1 : -1
    let y = y0

    for(let x=x0; x<=x1; x++){
      if(!(steep ? plot(y,sign*x) : plot(sign*x,y))) return
      err = (err - dy)
      if(err < 0){
        y+=ystep
        err+=dx
      }
    }
  }