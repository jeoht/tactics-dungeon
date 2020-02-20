export class Tileset {
    image: HTMLImageElement
    tileWidth: number
    tileHeight: number
    rows: number
    columns: number

    constructor(image: HTMLImageElement, tileWidth: number, tileHeight: number) {
        this.image = image
        this.tileWidth = tileWidth
        this.tileHeight = tileHeight
        this.rows = Math.floor(image.naturalHeight / tileHeight)
        this.columns = Math.floor(image.naturalWidth / tileWidth)
    }

    drawTile(ctx: CanvasRenderingContext2D, tileIndex: number, dx: number, dy: number, dWidth: number, dHeight: number) {
        const column = tileIndex % this.columns
        const row = Math.floor(tileIndex / this.columns)
        const sx = column * this.tileWidth
        const sy = row * this.tileHeight
        
        ctx.drawImage(this.image, sx, sy, this.tileWidth, this.tileHeight, dx, dy, dWidth, dHeight)        
    }
}