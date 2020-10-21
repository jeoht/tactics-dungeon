import { action, observable } from "mobx"

export interface Tickable {
    start?(): void
    stop?(): void
    frame(deltaTime: number): void
}

export class TimeReactor {
    @observable now: number = 0
    tickables: Tickable[] = []
    frameResolvers: ((deltaTime: number) => void)[] = []

    animationHandle: number | null = null
    @action start() {
        if (this.animationHandle != null)
            cancelAnimationFrame(this.animationHandle)

        let lastFrame: number | null = null
        const frame = action((timestamp: number) => {
            this.now = timestamp
            const deltaTime = lastFrame === null ? 0 : timestamp - lastFrame

            const frameResolvers = this.frameResolvers
            this.frameResolvers = []

            for (let i = this.tickables.length - 1; i >= 0; i--) {
                this.tickables[i].frame(deltaTime)
            }

            // The reversing here is so that the last bound resolvers play first
            // but they still bind their next resolvers in a consistent order
            frameResolvers.reverse()
            for (const resolve of frameResolvers) {
                resolve(deltaTime)
            }
            this.frameResolvers.reverse()

            lastFrame = timestamp
            this.animationHandle = requestAnimationFrame(frame)
        })
        this.animationHandle = requestAnimationFrame(frame)
    }

    @action stop() {
        if (this.animationHandle !== null)
            cancelAnimationFrame(this.animationHandle)
    }

    @action add(thing: Tickable) {
        this.tickables.push(thing)
        if (thing.start) {
            thing.start()
        }
    }

    @action remove(thing: Tickable) {
        this.tickables = this.tickables.filter(t => t !== thing)
        if (thing.stop) {
            thing.stop()
        }
    }

    nextFrame(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.frameResolvers.push(resolve)
        })
    }
}