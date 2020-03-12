export class PointVector {
    static get zero() { return new PointVector(0, 0) }
    static get one() { return new PointVector(1, 1) }
    static get up() { return new PointVector(0, -1) }
    static get down() { return new PointVector(0, 1) }
    static get left() { return new PointVector(-1, 0) }
    static get right() { return new PointVector(1, 0) }

    static lerp(a: PointVector, b: PointVector, t: number) {
        t = Math.max(Math.min(t, 1), 0)
        return new PointVector(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
    }
    
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    get key(): string {
        return `${this.x},${this.y}`
    }

    neighbors() {
        const directions = [PointVector.up, PointVector.down, PointVector.left, PointVector.right]
        return directions.map(v => this.add(v))
    }

    add(other: PointVector) {
        return new PointVector(this.x+other.x, this.y+other.y)
    }

    addX(x: number) {
        return new PointVector(this.x+x, this.y)
    }

    addY(y: number) {
        return new PointVector(this.x, this.y+y)
    }

    addXY(x: number, y: number) {
        return new PointVector(this.x+x, this.y+y)
    }

    subtract(other: PointVector) {
        return new PointVector(this.x-other.x, this.y-other.y)
    }

    north() {
        return this.add(PointVector.up)
    }

    east() {
        return this.add(PointVector.right)
    }

    south() {
        return this.add(PointVector.down)
    }

    west() {
        return this.add(PointVector.left)
    }

    manhattanDistance(other: PointVector) {
        return Math.abs(other.x - this.x) + Math.abs(other.y - this.y)
    }
}