import { Tileset } from "./Tileset"
import { ImageRefiner } from "./ImageRefiner"

export class Assets {
    world!: Tileset
    creatures!: Tileset
    grayscaleCreatures!: Tileset
    imgRefiner: ImageRefiner

    constructor() {
        this.imgRefiner = new ImageRefiner()
    }

    async loadImage(url: string): Promise<ImageBitmap> {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.src = url
            img.onload = () => {
                this.imgRefiner.editImage(img).bitmap().then(bmap => resolve(bmap))
            }
        })
    }

    async load() {
        const [world, creatures] = await Promise.all([
            this.loadImage('oryx_16bit_fantasy_world_trans.png'),
            this.loadImage('oryx_16bit_fantasy_creatures_trans.png')
        ])

        this.world = new Tileset(world, 24, 24)
        this.creatures = new Tileset(creatures, 24, 24)

        const grayscale = await this.imgRefiner.edit(creatures).grayscale().bitmap()
        this.grayscaleCreatures = new Tileset(grayscale, 24, 24)
    }


    tileToDataUrl(tileset: Tileset, tileIndex: number): string {
        const { canvas, ctx } = this.imgRefiner
        canvas.width = tileset.tileWidth
        canvas.height = tileset.tileHeight
        tileset.drawTile(ctx, tileIndex, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL()
    }
}