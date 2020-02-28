import { Tileset } from "./Tileset"
import { ImageRefiner } from "./ImageRefiner"

async function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(img)
    })
}

export class Assets {
    world!: Tileset
    creatures!: Tileset
    grayscaleCreatures!: Tileset
    imgRefiner: ImageRefiner

    constructor() {
        this.imgRefiner = new ImageRefiner()
    }

    async load() {
        const [world, creatures] = await Promise.all([
            loadImage('oryx_16bit_fantasy_world_trans.png'),
            loadImage('oryx_16bit_fantasy_creatures_trans.png')
        ])

        this.world = new Tileset(world, 24, 24)
        this.creatures = new Tileset(creatures, 24, 24)

        const grayscale = await this.imgRefiner.editImage(creatures).grayscale().bitmap()
        this.grayscaleCreatures = new Tileset(grayscale, 24, 24)
    }
}