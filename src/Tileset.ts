import * as PIXI from 'pixi.js'

export class Tileset {
    texture: PIXI.Texture
    tileWidth: number
    tileHeight: number
    rows: number
    columns: number
    tileCache: {[tileIndex: number]: PIXI.Texture|undefined} = {}

    constructor(texture: PIXI.Texture, tileWidth: number, tileHeight: number) {
        this.texture = texture
        this.tileWidth = tileWidth
        this.tileHeight = tileHeight
        this.columns = Math.floor(texture.width / tileWidth)
        this.rows = Math.floor(texture.height / tileHeight)
    }

    tile(tileIndex: number) {
        const cached = this.tileCache[tileIndex]
        if (cached) return cached

        const column = tileIndex % this.columns
        const row = Math.floor(tileIndex / this.columns)
        const sx = column * this.tileWidth
        const sy = row * this.tileHeight

        const texture = new PIXI.Texture(this.texture.baseTexture, new PIXI.Rectangle(sx, sy, this.tileWidth, this.tileHeight))
        this.tileCache[tileIndex] = texture
        return texture
    }
}