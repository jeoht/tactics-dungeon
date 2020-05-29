


export class GameComponent {
    gameObject!: GameObject
}

type ComponentClass = new (...args: any) => any

/** Component container */
export class GameObject {
    components: GameComponent[] = []
    constructor() {
    }

    static create(...componentClasses: ComponentClass[]) {
        const obj = new GameObject()
        for (const klass of componentClasses) {
            obj.add(klass)
        }
        return obj
    }

    add<T extends new (...args: any) => InstanceType<T>>(componentClass: T): InstanceType<T> {
        const component = new componentClass() as GameComponent
        this.components.push(component)
        component.gameObject = this
        return component as InstanceType<T>
    }
}